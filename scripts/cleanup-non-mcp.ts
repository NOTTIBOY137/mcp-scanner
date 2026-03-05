/**
 * Cleanup script: Remove non-MCP servers from the database.
 *
 * Usage:
 *   npx tsx scripts/cleanup-non-mcp.ts           # dry-run (prints what would be deleted)
 *   npx tsx scripts/cleanup-non-mcp.ts --execute  # actually delete
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, inArray, sql } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { TOP_SERVERS } from "../src/data/top-servers";

const REGISTRY_URL = "https://registry.modelcontextprotocol.io/api/servers";

// ---------------------------------------------------------------------------
// DB connection (standalone — not relying on Next.js path aliases)
// ---------------------------------------------------------------------------

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("ERROR: DATABASE_URL is not set. Create a .env file or export it.");
    process.exit(1);
  }
  const client = neon(url);
  return drizzle(client, { schema });
}

// ---------------------------------------------------------------------------
// Build the allowlist of owner/repo pairs from the seed file
// ---------------------------------------------------------------------------

function buildSeedAllowlist(): Set<string> {
  const set = new Set<string>();
  for (const s of TOP_SERVERS) {
    // Extract owner/repo from URL like https://github.com/owner/repo
    const match = s.repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      set.add(`${match[1].toLowerCase()}/${match[2].toLowerCase()}`);
    }
  }
  return set;
}

// ---------------------------------------------------------------------------
// Fetch registry servers as an additional allowlist
// ---------------------------------------------------------------------------

async function fetchRegistryAllowlist(): Promise<Set<string>> {
  const set = new Set<string>();
  try {
    const response = await fetch(REGISTRY_URL, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      console.log("  Registry fetch returned", response.status, "— skipping registry allowlist");
      return set;
    }
    const data = await response.json();
    const entries = Array.isArray(data?.servers) ? data.servers : Array.isArray(data) ? data : [];
    for (const entry of entries) {
      const url: string | undefined = entry.repository?.url;
      if (!url) continue;
      const match = url.replace(/\.git$/, "").match(/github\.com\/([^/]+)\/([^/]+)/);
      if (match) {
        set.add(`${match[1].toLowerCase()}/${match[2].toLowerCase()}`);
      }
    }
    console.log(`  Fetched ${set.size} servers from MCP registry`);
  } catch (err) {
    console.log("  Could not fetch registry:", err instanceof Error ? err.message : err);
  }
  return set;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const execute = process.argv.includes("--execute");

  console.log(`\n=== MCP Database Cleanup ${execute ? "(EXECUTE MODE)" : "(DRY RUN)"} ===\n`);

  const db = createDb();

  // 1. Build allowlists
  console.log("Building allowlists...");
  const seedList = buildSeedAllowlist();
  console.log(`  Seed file: ${seedList.size} servers`);

  const registryList = await fetchRegistryAllowlist();

  // 2. Query all servers from DB
  const allServers = await db
    .select({
      id: schema.servers.id,
      owner: schema.servers.owner,
      repo: schema.servers.repo,
      name: schema.servers.name,
      repoUrl: schema.servers.repoUrl,
      latestGrade: schema.servers.latestGrade,
      latestScore: schema.servers.latestScore,
      isVerified: schema.servers.isVerified,
      registrySlug: schema.servers.registrySlug,
    })
    .from(schema.servers)
    .orderBy(schema.servers.repo);

  console.log(`\n  Total servers in DB: ${allServers.length}\n`);

  // 3. Classify each server
  const toKeep: typeof allServers = [];
  const toDelete: typeof allServers = [];

  for (const srv of allServers) {
    const key = `${srv.owner.toLowerCase()}/${srv.repo.toLowerCase()}`;
    const inSeed = seedList.has(key);
    const inRegistry = registryList.has(key);
    const isRegistrySynced = !!(srv.registrySlug || srv.isVerified);

    if (inSeed || inRegistry || isRegistrySynced) {
      toKeep.push(srv);
    } else {
      toDelete.push(srv);
    }
  }

  // 4. Print summary
  console.log("--- SERVERS TO KEEP ---");
  for (const srv of toKeep) {
    const reasons: string[] = [];
    const key = `${srv.owner.toLowerCase()}/${srv.repo.toLowerCase()}`;
    if (seedList.has(key)) reasons.push("seed");
    if (registryList.has(key)) reasons.push("registry");
    if (srv.registrySlug || srv.isVerified) reasons.push("registry-synced");
    console.log(`  KEEP  ${srv.owner}/${srv.repo}  [${reasons.join(", ")}]  grade=${srv.latestGrade ?? "—"}  score=${srv.latestScore ?? "—"}`);
  }

  console.log("\n--- SERVERS TO DELETE ---");
  if (toDelete.length === 0) {
    console.log("  (none — database is clean!)");
  } else {
    for (const srv of toDelete) {
      console.log(`  DELETE  ${srv.owner}/${srv.repo}  grade=${srv.latestGrade ?? "—"}  score=${srv.latestScore ?? "—"}`);
    }
  }

  console.log(`\n  Summary: ${toKeep.length} keep, ${toDelete.length} delete\n`);

  if (toDelete.length === 0) {
    console.log("Nothing to delete. Exiting.");
    return;
  }

  if (!execute) {
    console.log("DRY RUN — no changes made. Re-run with --execute to delete.\n");
    return;
  }

  // 5. Perform deletion (respecting FK order)
  console.log("Deleting...\n");

  for (const srv of toDelete) {
    const serverId = srv.id;
    const label = `${srv.owner}/${srv.repo}`;

    // 5a. Get scan IDs for this server
    const serverScans = await db
      .select({ id: schema.scans.id })
      .from(schema.scans)
      .where(eq(schema.scans.serverId, serverId));
    const scanIds = serverScans.map((s) => s.id);

    // 5b. Delete findings for those scans
    if (scanIds.length > 0) {
      const findingsResult = await db
        .delete(schema.findings)
        .where(inArray(schema.findings.scanId, scanIds));
      console.log(`  ${label}: deleted findings for ${scanIds.length} scans`);
    }

    // 5c. Delete tool_hashes
    await db.delete(schema.toolHashes).where(eq(schema.toolHashes.serverId, serverId));
    console.log(`  ${label}: deleted tool_hashes`);

    // 5d. Delete server_claims (table may not exist yet)
    try {
      await db.delete(schema.serverClaims).where(eq(schema.serverClaims.serverId, serverId));
      console.log(`  ${label}: deleted server_claims`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("does not exist")) {
        console.log(`  ${label}: server_claims table not found — skipping`);
      } else {
        throw e;
      }
    }

    // 5e. Delete scans
    await db.delete(schema.scans).where(eq(schema.scans.serverId, serverId));
    console.log(`  ${label}: deleted scans`);

    // 5f. Delete server
    await db.delete(schema.servers).where(eq(schema.servers.id, serverId));
    console.log(`  ${label}: DELETED server\n`);
  }

  // 6. Verify
  const remaining = await db
    .select({ id: schema.servers.id, owner: schema.servers.owner, repo: schema.servers.repo })
    .from(schema.servers);
  console.log(`\nDone! ${toDelete.length} servers removed. ${remaining.length} servers remain:\n`);
  for (const srv of remaining) {
    console.log(`  ${srv.owner}/${srv.repo}`);
  }
  console.log();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

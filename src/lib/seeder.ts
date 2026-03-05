import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { servers, scans, findings, toolHashes } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import {
  parseGithubUrl,
  getRepoTree,
  batchFetchFiles,
  getRepoInfo,
} from "@/lib/github";
import { scanFiles } from "@/scanner/engine";
import { allRules } from "@/scanner/rules";
import { calculateGrade } from "@/scanner/grader";
import { detectToolDefinitions } from "@/scanner/hasher";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SeedResult {
  repoUrl: string;
  status: "scanned" | "skipped" | "failed";
  grade?: string;
  score?: number;
  findingsCount?: number;
  error?: string;
}

export interface SeedOptions {
  /** Delay in ms between successive scans to respect rate limits. Default: 3000 */
  delayMs?: number;
  /** Called after each repo finishes (success or failure). */
  onProgress?: (result: SeedResult, index: number, total: number) => void;
  /** Skip repos that were scanned within this many ms. Default: 24 hours */
  skipIfScannedWithinMs?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DELAY_MS = 3000;
const RATE_LIMIT_RETRY_DELAY_MS = 60_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns true if the error looks like a GitHub 403 rate-limit response.
 */
function isRateLimitError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes("rate limit") || msg.includes("403");
  }
  return false;
}

// ---------------------------------------------------------------------------
// Core: scan a single repo
// ---------------------------------------------------------------------------

export async function scanSingleRepo(
  repoUrl: string,
  options?: { skipIfScannedWithinMs?: number },
): Promise<SeedResult> {
  const skipWindow = options?.skipIfScannedWithinMs ?? TWENTY_FOUR_HOURS_MS;

  // 1. Parse URL
  let owner: string;
  let repo: string;
  try {
    ({ owner, repo } = parseGithubUrl(repoUrl));
  } catch {
    return { repoUrl, status: "failed", error: "Invalid GitHub URL" };
  }

  const normalizedUrl = `https://github.com/${owner}/${repo}`;

  try {
    // 2. Upsert server
    const existing = await db.query.servers.findFirst({
      where: eq(servers.repoUrl, normalizedUrl),
    });

    const serverId = existing?.id ?? createId();

    if (!existing) {
      await db.insert(servers).values({
        id: serverId,
        name: repo,
        repoUrl: normalizedUrl,
        owner,
        repo,
      });
    }

    // 3. Check if scanned recently -> skip
    if (skipWindow > 0) {
      const cutoff = new Date(Date.now() - skipWindow);
      const recentScan = await db.query.scans.findFirst({
        where: and(
          eq(scans.serverId, serverId),
          eq(scans.status, "completed"),
          gt(scans.completedAt, cutoff),
        ),
      });

      if (recentScan) {
        return {
          repoUrl: normalizedUrl,
          status: "skipped",
          grade: recentScan.grade ?? undefined,
          score: recentScan.score ?? undefined,
        };
      }
    }

    // 4. Fetch repo info
    const repoInfo = await getRepoInfo(owner, repo);

    await db
      .update(servers)
      .set({
        name: repoInfo.name,
        description: repoInfo.description,
        stars: repoInfo.stars,
        language: repoInfo.language,
        updatedAt: new Date(),
      })
      .where(eq(servers.id, serverId));

    // 5. Get file tree + contents
    const tree = await getRepoTree(owner, repo);
    const paths = tree.map((t) => t.path);
    const fileContents = await batchFetchFiles(owner, repo, paths);

    // 6. Run scanner
    const matches = scanFiles(fileContents, allRules);

    // 7. Grade
    const gradeResult = calculateGrade(matches);

    // 8. Create scan record
    const scanId = createId();
    const startTime = Date.now();

    await db.insert(scans).values({
      id: scanId,
      serverId,
      status: "completed",
      grade: gradeResult.grade,
      score: gradeResult.score,
      filesScanned: fileContents.length,
      findingsCount: matches.length,
      categoryScores: gradeResult.categoryScores,
      duration: Date.now() - startTime,
      completedAt: new Date(),
    });

    // 9. Store findings
    if (matches.length > 0) {
      await db.insert(findings).values(
        matches.map((m) => ({
          id: createId(),
          scanId,
          ruleId: m.ruleId,
          category: m.category,
          severity: m.severity,
          title: m.title,
          description: m.description,
          filePath: m.filePath,
          lineNumber: m.lineNumber,
          snippet: m.snippet.slice(0, 500),
          confidence: m.confidence,
        })),
      );
    }

    // 10. Detect and hash tool definitions
    for (const file of fileContents) {
      const tools = detectToolDefinitions(file.content);
      if (tools.length > 0) {
        await db.insert(toolHashes).values(
          tools.map((t) => ({
            id: createId(),
            serverId,
            toolName: t.name,
            hash: t.hash,
            scanId,
          })),
        );
      }
    }

    // 11. Update server with latest grade
    await db
      .update(servers)
      .set({
        latestGrade: gradeResult.grade,
        latestScore: gradeResult.score,
        latestScanId: scanId,
        updatedAt: new Date(),
      })
      .where(eq(servers.id, serverId));

    return {
      repoUrl: normalizedUrl,
      status: "scanned",
      grade: gradeResult.grade,
      score: gradeResult.score,
      findingsCount: matches.length,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { repoUrl: normalizedUrl, status: "failed", error: message };
  }
}

// ---------------------------------------------------------------------------
// Batch: seed multiple repos sequentially with rate-limit awareness
// ---------------------------------------------------------------------------

export async function seedServers(
  serverList: { repoUrl: string }[],
  options?: SeedOptions,
): Promise<SeedResult[]> {
  const delayMs = options?.delayMs ?? DEFAULT_DELAY_MS;
  const skipWindow = options?.skipIfScannedWithinMs ?? TWENTY_FOUR_HOURS_MS;
  const results: SeedResult[] = [];

  for (let i = 0; i < serverList.length; i++) {
    const { repoUrl } = serverList[i];

    let result = await scanSingleRepo(repoUrl, {
      skipIfScannedWithinMs: skipWindow,
    });

    // If we hit a rate limit, wait and retry once
    if (
      result.status === "failed" &&
      result.error &&
      isRateLimitError(new Error(result.error))
    ) {
      await sleep(RATE_LIMIT_RETRY_DELAY_MS);
      result = await scanSingleRepo(repoUrl, {
        skipIfScannedWithinMs: skipWindow,
      });
    }

    results.push(result);

    if (options?.onProgress) {
      options.onProgress(result, i, serverList.length);
    }

    // Delay between scans (skip delay after last item)
    if (i < serverList.length - 1) {
      await sleep(delayMs);
    }
  }

  return results;
}

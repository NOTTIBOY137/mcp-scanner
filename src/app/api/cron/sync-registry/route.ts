import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { servers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let synced = 0;

  try {
    // Fetch from MCP Registry API (placeholder - adjust URL when registry is available)
    const registryUrl = "https://registry.modelcontextprotocol.io/api/servers";
    const response = await fetch(registryUrl, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(30000),
    }).catch(() => null);

    if (!response?.ok) {
      return NextResponse.json({
        message: "Registry sync skipped - registry unavailable",
        synced: 0,
      });
    }

    const data = await response.json();
    const registryServers = Array.isArray(data?.servers) ? data.servers : Array.isArray(data) ? data : [];

    for (const entry of registryServers) {
      if (!entry.repository?.url) continue;

      const repoUrl = entry.repository.url.replace(/\.git$/, "");
      const existing = await db.query.servers.findFirst({
        where: eq(servers.repoUrl, repoUrl),
      });

      if (existing) {
        await db.update(servers).set({
          registrySlug: entry.slug ?? null,
          isVerified: entry.verified ?? false,
          stars: entry.stars ?? existing.stars,
          updatedAt: new Date(),
        }).where(eq(servers.id, existing.id));
      } else {
        await db.insert(servers).values({
          id: createId(),
          name: entry.name ?? entry.slug ?? "unknown",
          repoUrl,
          owner: entry.repository.owner ?? repoUrl.split("/").at(-2) ?? "",
          repo: entry.repository.repo ?? repoUrl.split("/").at(-1) ?? "",
          description: entry.description ?? null,
          stars: entry.stars ?? 0,
          registrySlug: entry.slug ?? null,
          isVerified: entry.verified ?? false,
        });
      }

      synced++;
    }
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Sync failed",
      synced,
    }, { status: 500 });
  }

  return NextResponse.json({ message: "Registry sync complete", synced });
}

import { NextResponse } from "next/server";
import { TOP_SERVERS } from "@/data/top-servers";
import { seedServers } from "@/lib/seeder";
import type { SeedResult } from "@/lib/seeder";

export const maxDuration = 300; // 5 minute timeout for serverless

export async function POST(request: Request) {
  // Authenticate with CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse optional query params
  const url = new URL(request.url);
  const priorityParam = url.searchParams.get("priority");
  const delayParam = url.searchParams.get("delay");

  // Filter by priority if specified (e.g. ?priority=1 scans only priority-1 servers)
  let serverList = [...TOP_SERVERS];
  if (priorityParam) {
    const maxPriority = parseInt(priorityParam, 10);
    if (!isNaN(maxPriority)) {
      serverList = serverList.filter((s) => s.priority <= maxPriority);
    }
  }

  const delayMs = delayParam ? parseInt(delayParam, 10) : 3000;

  const results = await seedServers(serverList, {
    delayMs: isNaN(delayMs) ? 3000 : delayMs,
  });

  const summary = buildSummary(results);

  return NextResponse.json({ summary, results });
}

function buildSummary(results: SeedResult[]) {
  const scanned = results.filter((r) => r.status === "scanned").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failed = results.filter((r) => r.status === "failed").length;

  return {
    total: results.length,
    scanned,
    skipped,
    failed,
    grades: results
      .filter((r) => r.grade)
      .reduce(
        (acc, r) => {
          acc[r.grade!] = (acc[r.grade!] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
  };
}

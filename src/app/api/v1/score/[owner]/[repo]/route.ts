import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { servers, scans, findings } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { validateApiKey, getPlanLimits } from "@/lib/api-keys";
import { anonymousV1RateLimit, createV1RateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params;

  // Determine auth: API key or anonymous
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  let rateLimitKey: string;
  let dailyLimit: number;
  let authenticatedUserId: string | null = null;

  if (bearerToken) {
    const keyData = await validateApiKey(bearerToken);
    if (!keyData) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
    rateLimitKey = keyData.userId;
    dailyLimit = getPlanLimits(keyData.plan).daily;
    authenticatedUserId = keyData.userId;
  } else {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "127.0.0.1";
    rateLimitKey = ip;
    dailyLimit = 10;
  }

  // Track usage for authenticated users (fire-and-forget)
  if (authenticatedUserId) {
    const uid = authenticatedUserId;
    import("@/lib/usage")
      .then(({ incrementUsage }) => incrementUsage(uid, "v1/score"))
      .catch(() => {});
  }

  // Apply rate limiting
  try {
    const limiter = bearerToken
      ? createV1RateLimit(dailyLimit)
      : anonymousV1RateLimit;

    const { success, remaining, reset } = await limiter.limit(rateLimitKey);

    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": dailyLimit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      );
    }

    // Look up server
    const server = await db.query.servers.findFirst({
      where: and(eq(servers.owner, owner), eq(servers.repo, repo)),
    });

    if (!server) {
      return NextResponse.json(
        { error: "Server not found. It may not have been scanned yet." },
        { status: 404 }
      );
    }

    // Get latest completed scan
    const latestScan = await db.query.scans.findFirst({
      where: and(eq(scans.serverId, server.id), eq(scans.status, "completed")),
      orderBy: desc(scans.createdAt),
    });

    // Count findings by severity
    let findingCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    if (latestScan) {
      const scanFindings = await db
        .select()
        .from(findings)
        .where(eq(findings.scanId, latestScan.id));

      for (const f of scanFindings) {
        const sev = f.severity.toLowerCase() as keyof typeof findingCounts;
        if (sev in findingCounts) findingCounts[sev]++;
      }
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";

    return NextResponse.json(
      {
        server: `${owner}/${repo}`,
        grade: server.latestGrade ?? null,
        score: server.latestScore ?? null,
        findings: findingCounts,
        lastScanned: latestScan?.createdAt?.toISOString() ?? null,
        reportUrl: latestScan
          ? `${appUrl}/report/${latestScan.id}`
          : null,
        badgeUrl: `${appUrl}/api/badge/${owner}/${repo}.svg`,
      },
      {
        headers: {
          "X-RateLimit-Limit": dailyLimit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

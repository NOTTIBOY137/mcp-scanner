import { db } from "@/lib/db";
import { servers, scans, serverClaims } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GradeBadge } from "@/components/scanner/GradeBadge";
import { ClaimServerFlow } from "@/components/scanner/ClaimServerFlow";
import { RescanButton } from "@/components/scanner/RescanButton";
import { ScanHistoryWithCompare } from "@/components/scanner/ScanHistoryWithCompare";
import { auth } from "@clerk/nextjs/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ serverId: string }>;
}): Promise<Metadata> {
  const { serverId } = await params;
  const server = await db.query.servers.findFirst({
    where: eq(servers.id, serverId),
  });

  if (!server) {
    return { title: "Server Not Found" };
  }

  const title = `${server.owner}/${server.repo} — Security Grade ${server.latestGrade ?? "?"}`;
  const description = `MCP security scan results for ${server.owner}/${server.repo}. Grade: ${server.latestGrade ?? "unscanned"}, Score: ${server.latestScore ?? "N/A"}/100.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function ServerPage({
  params,
}: {
  params: Promise<{ serverId: string }>;
}) {
  const { serverId } = await params;
  const { userId } = await auth();

  const server = await db.query.servers.findFirst({
    where: eq(servers.id, serverId),
  });

  if (!server) notFound();

  const scanHistory = await db.query.scans.findMany({
    where: eq(scans.serverId, serverId),
    orderBy: desc(scans.createdAt),
    limit: 20,
  });

  // Check claim status
  let claimStatus: "unclaimed" | "claimed-by-user" | "claimed-by-other" = "unclaimed";
  if (userId) {
    const claims = await db
      .select()
      .from(serverClaims)
      .where(
        and(eq(serverClaims.serverId, serverId), eq(serverClaims.verified, true))
      )
      .limit(1);

    if (claims.length > 0) {
      claimStatus =
        claims[0].clerkUserId === userId ? "claimed-by-user" : "claimed-by-other";
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center gap-6">
        <GradeBadge grade={server.latestGrade} size="lg" />
        <div>
          <h1 className="text-2xl font-bold">{server.name}</h1>
          <p className="text-muted">
            {server.owner}/{server.repo}
          </p>
          {server.description && (
            <p className="mt-1 text-sm text-muted">
              {server.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted">
            {(server.stars ?? 0) > 0 && <span>{server.stars} stars</span>}
            {server.language && <span>{server.language}</span>}
            <a
              href={server.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-500 hover:underline"
            >
              View on GitHub
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`/scan?url=${encodeURIComponent(server.repoUrl)}`}
              className="mt-3 btn-primary inline-flex items-center gap-2 text-sm"
            >
              Scan Now
            </a>

            {userId && <RescanButton serverId={serverId} />}

            {/* Claim status badges */}
            {claimStatus === "claimed-by-user" && (
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-green-500/15 px-3 py-1.5 text-xs font-medium text-green-400 ring-1 ring-green-500/30">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                You own this server
              </span>
            )}
            {claimStatus === "claimed-by-other" && (
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-zinc-900/15 px-3 py-1.5 text-xs font-medium text-muted ring-1 ring-white/10">
                Claimed
              </span>
            )}
          </div>

          {/* Claim flow for signed-in users when unclaimed */}
          {userId && claimStatus === "unclaimed" && (
            <ClaimServerFlow serverId={serverId} />
          )}
        </div>
      </div>

      {/* Grade trend */}
      {scanHistory.length > 1 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted">Grade Trend</h2>
          <div className="flex items-end gap-1 overflow-x-auto pb-1 h-12">
            {scanHistory
              .slice()
              .reverse()
              .map((s) => {
                const score = s.score ?? 0;
                const height = Math.max(4, (score / 100) * 48);
                const color =
                  score >= 90 ? "bg-green-500" :
                  score >= 70 ? "bg-brand-500" :
                  score >= 50 ? "bg-yellow-500" :
                  "bg-red-500";
                return (
                  <div
                    key={`bar-${s.id}`}
                    className={`w-3 rounded-t ${color} opacity-60`}
                    style={{ height: `${height}px` }}
                    title={`Score: ${score}`}
                  />
                );
              })}
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {scanHistory
              .slice()
              .reverse()
              .map((scan) => (
                <GradeBadge key={scan.id} grade={scan.grade} size="sm" />
              ))}
          </div>
        </section>
      )}

      <ScanHistoryWithCompare
        scanHistory={scanHistory.map((scan) => ({
          id: scan.id,
          grade: scan.grade,
          score: scan.score,
          findingsCount: scan.findingsCount,
          commitSha: scan.commitSha,
          createdAt: scan.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}

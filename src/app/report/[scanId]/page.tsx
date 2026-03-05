import { db } from "@/lib/db";
import { scans, findings, servers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { CategoryScoreDetail, Grade } from "@/types/grade";
import { GRADE_THRESHOLDS } from "@/types/grade";
import { CircularProgress } from "@/components/scanner/CircularProgress";
import { ShareButtons } from "@/components/scanner/ShareButtons";
import { ArrowRight } from "lucide-react";
import { formatCategoryName } from "@/lib/format";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ scanId: string }>;
}): Promise<Metadata> {
  const { scanId } = await params;
  const scan = await db.query.scans.findFirst({
    where: eq(scans.id, scanId),
  });
  if (!scan) return { title: "Report Not Found" };

  const server = await db.query.servers.findFirst({
    where: eq(servers.id, scan.serverId),
  });
  const name = server?.name ?? "Unknown Server";
  const grade = scan.grade ?? "?";
  const score = scan.score ?? 0;
  const findingsCount = scan.findingsCount ?? 0;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";

  return {
    title: `${name} — Grade ${grade} | Security Report`,
    description: `Security scan found ${findingsCount} issues. Score: ${score}/100.`,
    openGraph: {
      title: `${name} scored ${grade} (${score}/100)`,
      description: `MCP security scan: ${findingsCount} findings detected`,
      images: [`${appUrl}/api/og/${scanId}`],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — Grade ${grade} | MCP Security Scan`,
      images: [`${appUrl}/api/og/${scanId}`],
    },
  };
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const { scanId } = await params;

  const scan = await db.query.scans.findFirst({
    where: eq(scans.id, scanId),
  });
  if (!scan || scan.status !== "completed") notFound();

  const server = await db.query.servers.findFirst({
    where: eq(servers.id, scan.serverId),
  });

  const scanFindings = await db.query.findings.findMany({
    where: eq(findings.scanId, scanId),
  });

  const severityCounts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };
  for (const f of scanFindings) {
    severityCounts[f.severity] = (severityCounts[f.severity] ?? 0) + 1;
  }

  const categoryScores = (scan.categoryScores as CategoryScoreDetail[]) ?? [];
  const grade = (scan.grade ?? "F") as Grade;
  const gradeInfo = GRADE_THRESHOLDS[grade] ?? GRADE_THRESHOLDS.F;
  const serverName = server?.name ?? "Unknown Server";
  const score = scan.score ?? 0;
  const totalFindings = scanFindings.length;

  return (
    <div className="mx-auto max-w-xl space-y-10 py-8">
      {/* Grade Circle */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="flex h-[120px] w-[120px] items-center justify-center rounded-full font-mono text-5xl font-bold"
          style={{
            backgroundColor: `${gradeInfo.color}15`,
            color: gradeInfo.color,
            boxShadow: `0 0 40px ${gradeInfo.color}30, 0 0 80px ${gradeInfo.color}10`,
          }}
        >
          {grade}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">{serverName}</h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            {server?.owner}/{server?.repo}
          </p>
        </div>
      </div>

      {/* Score */}
      <div className="text-center">
        <p className="font-mono text-4xl font-bold text-[var(--text-primary)]">
          {score} <span className="text-lg text-[var(--text-tertiary)]">/ 100</span>
        </p>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">
          {totalFindings} finding{totalFindings !== 1 ? "s" : ""} across {scan.filesScanned} files
        </p>
      </div>

      {/* Severity Bar */}
      {totalFindings > 0 && (
        <div className="space-y-3">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
            {severityCounts.critical > 0 && (
              <div className="bg-red-500" style={{ width: `${(severityCounts.critical / totalFindings) * 100}%` }} />
            )}
            {severityCounts.high > 0 && (
              <div className="bg-orange-500" style={{ width: `${(severityCounts.high / totalFindings) * 100}%` }} />
            )}
            {severityCounts.medium > 0 && (
              <div className="bg-amber-500" style={{ width: `${(severityCounts.medium / totalFindings) * 100}%` }} />
            )}
            {severityCounts.low > 0 && (
              <div className="bg-cyan-500" style={{ width: `${(severityCounts.low / totalFindings) * 100}%` }} />
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-[var(--text-secondary)]">
            {severityCounts.critical > 0 && (
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />{severityCounts.critical} critical</span>
            )}
            {severityCounts.high > 0 && (
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" />{severityCounts.high} high</span>
            )}
            {severityCounts.medium > 0 && (
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />{severityCounts.medium} medium</span>
            )}
            {severityCounts.low > 0 && (
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-500" />{severityCounts.low} low</span>
            )}
          </div>
        </div>
      )}

      {scanFindings.length === 0 && (
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-4 py-2 text-sm font-medium text-emerald-400">
            No issues found
          </span>
        </div>
      )}

      {/* Category Summary */}
      {categoryScores.length > 0 && (
        <div className="space-y-2">
          {categoryScores.map((cs) => {
            const isClean = cs.findingsCount === 0;
            return (
              <div key={cs.category} className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] px-4 py-2.5 border border-[var(--border-subtle)]">
                <span className="text-sm text-[var(--text-primary)]">
                  {formatCategoryName(cs.category)}
                </span>
                <span className={`text-xs font-medium ${isClean ? "text-emerald-400" : "text-amber-400"}`}>
                  {isClean ? "clean" : `${cs.findingsCount} issue${cs.findingsCount > 1 ? "s" : ""}`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Share Buttons */}
      <div className="flex justify-center">
        <ShareButtons
          scanId={scanId}
          serverName={serverName}
          grade={grade}
          score={score}
        />
      </div>

      {/* Full Results Link */}
      {scanFindings.length > 0 && (
        <div className="text-center">
          <a
            href={`/results/${scanId}`}
            className="text-sm text-[var(--accent)] hover:text-[var(--accent-glow)] transition-colors"
          >
            View detailed findings ({scanFindings.length} issues) &rarr;
          </a>
        </div>
      )}

      {/* CTA */}
      <div className="text-center">
        <a
          href="/scan"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--accent)] to-cyan-400 px-8 py-3.5 font-display font-semibold text-white transition-all hover:shadow-lg hover:shadow-cyan-500/25 hover:brightness-110"
        >
          Scan Your MCP Server
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] pt-6 text-center text-sm text-[var(--text-tertiary)]">
        Powered by MCP Scanner — The MCP Trust Registry
      </footer>
    </div>
  );
}

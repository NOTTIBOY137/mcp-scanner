import { db } from "@/lib/db";
import { scans, findings, servers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Share2,
  Github,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  Download,
} from "lucide-react";
import { CircularProgress } from "@/components/scanner/CircularProgress";
import { FindingCard } from "@/components/scanner/FindingCard";
import { ScanProgress } from "@/components/scanner/ScanProgress";
import { allRules } from "@/scanner/rules";
import type { RuleMatch, VulnCategory, Severity, Confidence } from "@/types/scan";
import type { CategoryScoreDetail, Grade } from "@/types/grade";
import { GRADE_THRESHOLDS } from "@/types/grade";
import { formatCategoryName } from "@/lib/format";

export const revalidate = 3600;

const SEV = {
  critical: { bar: "bg-red-500", text: "text-red-400" },
  high: { bar: "bg-orange-500", text: "text-orange-400" },
  medium: { bar: "bg-amber-500", text: "text-amber-400" },
  low: { bar: "bg-accent-500", text: "text-accent-400" },
  info: { bar: "bg-zinc-600", text: "text-zinc-400" },
};

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const { scanId } = await params;

  const scan = await db.query.scans.findFirst({ where: eq(scans.id, scanId) });
  if (!scan) notFound();

  const server = await db.query.servers.findFirst({ where: eq(servers.id, scan.serverId) });

  if (scan.status !== "completed") {
    return (
      <div className="mx-auto max-w-lg pt-20">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-6">
          Scanning {server?.name ?? "..."}
        </h1>
        <ScanProgress scanId={scanId} />
      </div>
    );
  }

  const scanFindings = await db.query.findings.findMany({ where: eq(findings.scanId, scanId) });

  const ruleMatches: RuleMatch[] = scanFindings.map((f) => ({
    ruleId: f.ruleId,
    category: f.category as VulnCategory,
    severity: f.severity as Severity,
    title: f.title,
    description: f.description,
    filePath: f.filePath,
    lineNumber: f.lineNumber ?? 0,
    snippet: f.snippet ?? "",
    confidence: f.confidence as Confidence,
  }));

  const remediationMap = new Map(allRules.filter((r) => r.remediation).map((r) => [r.id, r.remediation!]));
  for (const match of ruleMatches) {
    const rem = remediationMap.get(match.ruleId);
    if (rem) match.remediation = rem;
  }

  const sevCounts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const m of ruleMatches) sevCounts[m.severity] = (sevCounts[m.severity] ?? 0) + 1;

  const grouped = ruleMatches.reduce((acc, f) => { (acc[f.category] ??= []).push(f); return acc; }, {} as Record<string, RuleMatch[]>);
  const categoryScores = (scan.categoryScores as CategoryScoreDetail[]) ?? [];
  const totalFindings = Object.values(sevCounts).reduce((a, b) => a + b, 0);
  const gradeColor = GRADE_THRESHOLDS[(scan.grade ?? "F") as Grade]?.color ?? "#64748b";

  return (
    <div className="mx-auto max-w-3xl pt-12 pb-24 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-muted transition-colors">Home</Link>
        <span>/</span>
        {server && (
          <>
            <Link href={`/server/${server.id}`} className="hover:text-muted transition-colors">
              {server.owner}/{server.repo}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-muted">Results</span>
      </nav>

      {/* MCP verification warning */}
      {server && server.isVerified === false && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm">
          <p className="font-medium text-warning">This repository may not be an MCP server</p>
          <p className="mt-1 text-muted">We could not detect MCP SDK imports or tool registrations.</p>
        </div>
      )}

      {/* Summary */}
      <div className="rounded-xl border border-white/10 bg-card p-6 flex flex-col sm:flex-row items-center gap-6" style={{ borderTopColor: gradeColor, borderTopWidth: 2 }}>
        <CircularProgress score={scan.score ?? 0} grade={scan.grade ?? "F"} size={120} />
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {server?.name ?? "Unknown"}
          </h1>
          <p className="text-muted">{server?.owner}/{server?.repo}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {scan.filesScanned} files · {scan.findingsCount} findings
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/report/${scanId}`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10 transition-colors">
              <Share2 className="size-3.5" aria-hidden="true" /> Share
            </Link>
            {server?.repoUrl && (
              <a href={server.repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10 transition-colors">
                <Github className="size-3.5" aria-hidden="true" /> GitHub <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            )}
            <a href={`/api/export/${scanId}/sarif`} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-muted transition-colors">
              <Download className="size-3.5" aria-hidden="true" /> SARIF
            </a>
            <a href={`/api/export/${scanId}/json`} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-muted transition-colors">
              <Download className="size-3.5" aria-hidden="true" /> JSON
            </a>
          </div>
        </div>
      </div>

      {/* Severity bar */}
      {totalFindings > 0 && (
        <div className="space-y-3">
          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            {(["critical", "high", "medium", "low"] as const).map((s) => {
              if (sevCounts[s] === 0) return null;
              return <div key={s} className={SEV[s].bar} style={{ width: `${(sevCounts[s] / totalFindings) * 100}%` }} />;
            })}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {(["critical", "high", "medium", "low"] as const).map((s) => {
              if (sevCounts[s] === 0) return null;
              return (
                <span key={s} className="flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${SEV[s].bar}`} />
                  {sevCounts[s]} {s}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Category scores */}
      {categoryScores.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categoryScores.map((cs) => {
            const pct = (cs.score / cs.maxScore) * 100;
            const clean = cs.findingsCount === 0;
            return (
              <div key={cs.category} className="rounded-xl border border-white/10 bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{formatCategoryName(cs.category)}</span>
                  <span className={`text-xs font-medium ${clean ? "text-secure" : "text-warning"}`}>
                    {clean ? "clean" : `${cs.findingsCount} issue${cs.findingsCount > 1 ? "s" : ""}`}
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div className={`h-full rounded-full ${clean ? "bg-secure" : "bg-warning"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Findings by category */}
      {Object.entries(grouped).map(([category, items]) => (
        <section key={category}>
          <details open={items.some((f) => f.severity === "critical" || f.severity === "high")}>
            <summary className="cursor-pointer mb-3 flex items-center gap-2 text-base font-semibold text-foreground hover:text-brand-400 transition-colors">
              <ChevronDown className="size-4 transition-transform [[open]>&]:rotate-0 [&:not([open])>&]:-rotate-90" aria-hidden="true" />
              {formatCategoryName(category)}
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                {items.length}
              </span>
            </summary>
            <div className="space-y-3 ml-6">
              {items.map((finding, i) => (
                <FindingCard key={`${finding.ruleId}-${i}`} finding={finding} />
              ))}
            </div>
          </details>
        </section>
      ))}

      {/* No findings */}
      {ruleMatches.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-card text-center py-12">
          <ShieldCheck className="mx-auto size-12 text-secure mb-3" aria-hidden="true" />
          <p className="text-secure font-semibold text-lg">No vulnerabilities detected</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This server passed all {scan.filesScanned} file checks.
          </p>
        </div>
      )}
    </div>
  );
}

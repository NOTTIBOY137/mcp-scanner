import { db } from "@/lib/db";
import { scans, findings, servers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  Share2,
  RefreshCw,
  Github,
  ExternalLink,
  ChevronDown,
  FileCode,
  ShieldCheck,
  Download,
} from "lucide-react";
import { CircularProgress } from "@/components/scanner/CircularProgress";
import { FindingCard } from "@/components/scanner/FindingCard";
import { ScanProgress } from "@/components/scanner/ScanProgress";
import { allRules } from "@/scanner/rules";
import type {
  RuleMatch,
  VulnCategory,
  Severity,
  Confidence,
} from "@/types/scan";
import type { CategoryScoreDetail, Grade } from "@/types/grade";
import { GRADE_THRESHOLDS } from "@/types/grade";
import { formatCategoryName } from "@/lib/format";

export const revalidate = 3600;

const CATEGORY_EXPLANATIONS: Record<string, string> = {
  "tool-poisoning":
    "Tool poisoning occurs when MCP tool descriptions contain hidden instructions that override the AI model's behavior. This can trick the model into performing unintended actions.",
  "command-injection":
    "Command injection allows attackers to execute arbitrary system commands through unsanitized user input passed to shell functions like exec() or spawn().",
  "path-traversal":
    "Path traversal allows access to files outside the intended directory by using sequences like ../ to navigate the filesystem, potentially exposing sensitive files.",
  ssrf: "Server-Side Request Forgery (SSRF) tricks the server into making requests to internal services or arbitrary URLs, potentially accessing private networks.",
  "credential-theft":
    "Credential theft involves hardcoded secrets, API keys, or tokens in source code that could be extracted by attackers to gain unauthorized access.",
  "excessive-permissions":
    "Excessive permissions mean the tool requests more access than needed, violating the principle of least privilege and increasing the attack surface.",
  "missing-auth":
    "Missing authentication means endpoints or tools can be accessed without verifying the caller's identity, allowing unauthorized use.",
  "supply-chain":
    "Supply chain vulnerabilities involve dependencies or external resources that could be compromised, introducing malicious code through trusted channels.",
  "rug-pull":
    "Rug-pull risk indicates the tool's behavior could change without notice — for example, fetching remote configuration that alters functionality.",
  "data-exfiltration":
    "Data exfiltration involves sending tool outputs, session data, or credentials to external endpoints, potentially leaking sensitive information to unauthorized parties.",
};

const SEVERITY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  critical: { bg: "bg-red-500/15", text: "text-red-400", bar: "bg-red-500" },
  high: { bg: "bg-orange-500/15", text: "text-orange-400", bar: "bg-orange-500" },
  medium: { bg: "bg-amber-500/15", text: "text-amber-400", bar: "bg-amber-500" },
  low: { bg: "bg-cyan-500/15", text: "text-cyan-400", bar: "bg-cyan-500" },
  info: { bg: "bg-[var(--bg-tertiary)]/15", text: "text-[var(--text-secondary)]", bar: "bg-[var(--bg-tertiary)]" },
};

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const { scanId } = await params;

  const scan = await db.query.scans.findFirst({
    where: eq(scans.id, scanId),
  });

  if (!scan) notFound();

  const server = await db.query.servers.findFirst({
    where: eq(servers.id, scan.serverId),
  });

  if (scan.status !== "completed") {
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="mb-6 font-display text-2xl font-bold">
          Scanning {server?.name ?? "..."}
        </h1>
        <ScanProgress scanId={scanId} />
      </div>
    );
  }

  const scanFindings = await db.query.findings.findMany({
    where: eq(findings.scanId, scanId),
  });

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

  const remediationMap = new Map(
    allRules.filter((r) => r.remediation).map((r) => [r.id, r.remediation!])
  );
  for (const match of ruleMatches) {
    const rem = remediationMap.get(match.ruleId);
    if (rem) {
      match.remediation = rem;
    }
  }

  const severityCounts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };
  for (const m of ruleMatches) {
    severityCounts[m.severity] = (severityCounts[m.severity] ?? 0) + 1;
  }

  const grouped = ruleMatches.reduce(
    (acc, f) => {
      (acc[f.category] ??= []).push(f);
      return acc;
    },
    {} as Record<string, RuleMatch[]>
  );

  const categoryScores = (scan.categoryScores as CategoryScoreDetail[]) ?? [];
  const totalFindings = Object.values(severityCounts).reduce(
    (a, b) => a + b,
    0
  );
  const gradeColor = GRADE_THRESHOLDS[(scan.grade ?? "F") as Grade]?.color ?? "#64748b";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
        <a href="/" className="hover:text-[var(--text-secondary)] transition-colors">Home</a>
        <span>/</span>
        {server && (
          <>
            <a href={`/server/${server.id}`} className="hover:text-[var(--text-secondary)] transition-colors">
              {server.owner}/{server.repo}
            </a>
            <span>/</span>
          </>
        )}
        <span className="text-[var(--text-secondary)]">Scan Results</span>
      </nav>

      {/* MCP verification warning */}
      {server && server.isVerified === false && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          <p className="font-medium text-amber-400">
            This repository may not be an MCP server
          </p>
          <p className="mt-1 text-[var(--text-secondary)]">
            We could not detect MCP SDK imports, tool registrations, or server.json in this repository. Results should be interpreted with caution.
          </p>
        </div>
      )}

      {/* Summary Card */}
      <div
        className="card flex flex-col sm:flex-row items-center gap-6"
        style={{ borderTop: `2px solid ${gradeColor}` }}
      >
        <CircularProgress
          score={scan.score ?? 0}
          grade={scan.grade ?? "F"}
          size={140}
        />
        <div className="flex-1 text-center sm:text-left">
          <h1 className="font-display text-2xl font-bold">{server?.name ?? "Unknown"}</h1>
          <p className="text-[var(--text-secondary)]">
            {server?.owner}/{server?.repo}
          </p>
          <p className="mt-2 text-sm text-[var(--text-tertiary)]">
            {scan.filesScanned} files &middot; {scan.findingsCount} findings
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={`/report/${scanId}`}
              className="btn-secondary inline-flex items-center gap-1.5 text-xs"
            >
              <Share2 className="h-3.5 w-3.5" /> Share
            </a>
            {server?.repoUrl && (
              <a
                href={server.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex items-center gap-1.5 text-xs"
              >
                <Github className="h-3.5 w-3.5" /> GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <a
              href={`/api/export/${scanId}/sarif`}
              className="btn-ghost inline-flex items-center gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" /> SARIF
            </a>
            <a
              href={`/api/export/${scanId}/json`}
              className="btn-ghost inline-flex items-center gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" /> JSON
            </a>
          </div>
        </div>
      </div>

      {/* Severity Breakdown Bar */}
      {totalFindings > 0 && (
        <div className="space-y-3">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
            {(["critical", "high", "medium", "low"] as const).map((s) => {
              const count = severityCounts[s];
              if (count === 0) return null;
              return (
                <div
                  key={s}
                  className={SEVERITY_COLORS[s].bar}
                  style={{ width: `${(count / totalFindings) * 100}%` }}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-[var(--text-secondary)]">
            {(["critical", "high", "medium", "low"] as const).map((s) => {
              if (severityCounts[s] === 0) return null;
              return (
                <span key={s} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${SEVERITY_COLORS[s].bar}`} />
                  {severityCounts[s]} {s}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Score Grid */}
      {categoryScores.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categoryScores.map((cs) => {
            const pct = (cs.score / cs.maxScore) * 100;
            const isClean = cs.findingsCount === 0;
            return (
              <div
                key={cs.category}
                className="card p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {formatCategoryName(cs.category)}
                  </span>
                  <span className={`text-xs font-medium ${isClean ? "text-emerald-400" : "text-amber-400"}`}>
                    {isClean ? "clean" : `${cs.findingsCount} issue${cs.findingsCount > 1 ? "s" : ""}`}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-primary)]">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${isClean ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Findings by Category */}
      {Object.entries(grouped).map(([category, items]) => (
        <section key={category}>
          <details
            open={items.some(
              (f) => f.severity === "critical" || f.severity === "high"
            )}
          >
            <summary className="cursor-pointer mb-3 flex items-center gap-2 text-lg font-display font-semibold text-[var(--text-primary)] hover:text-[var(--accent-glow)] transition-colors">
              <ChevronDown className="h-5 w-5 transition-transform [[open]>&]:rotate-0 [&:not([open])>&]:-rotate-90" />
              {formatCategoryName(category)}
              <span className="rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs font-mono text-[var(--text-tertiary)]">
                {items.length}
              </span>
            </summary>
            {CATEGORY_EXPLANATIONS[category] && (
              <p className="mb-4 text-sm text-[var(--text-tertiary)] border-l-2 border-[var(--border-subtle)] pl-3">
                {CATEGORY_EXPLANATIONS[category]}
              </p>
            )}
            <div className="space-y-3">
              {items.map((finding, i) => (
                <FindingCard
                  key={`${finding.ruleId}-${i}`}
                  finding={finding}
                />
              ))}
            </div>
          </details>
        </section>
      ))}

      {ruleMatches.length === 0 && (
        <div className="card text-center py-10">
          <ShieldCheck className="mx-auto h-12 w-12 text-emerald-400 mb-3" />
          <p className="text-emerald-400 font-display font-semibold text-lg">
            No vulnerabilities detected
          </p>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            This server passed all {scan.filesScanned} file checks.
          </p>
        </div>
      )}
    </div>
  );
}

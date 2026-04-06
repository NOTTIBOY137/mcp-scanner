import Link from "next/link";
import { Code2, Shield, GitBranch, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { servers, scans } from "@/db/schema";
import { sql, isNotNull, desc, eq } from "drizzle-orm";
import { HomeSearchBar } from "@/components/scanner/HomeSearchBar";

export const revalidate = 300;

export default async function HomePage() {
  let totalServers = 0;
  let totalFindings = 0;
  let recentServers: {
    id: string;
    name: string;
    owner: string;
    repo: string;
    latestGrade: string | null;
    latestScore: number | null;
    findingsCount: number | null;
    lastScannedAt: Date | null;
  }[] = [];

  try {
    const [sc] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(servers)
      .where(isNotNull(servers.latestGrade));
    totalServers = sc.count;

    const [fs] = await db
      .select({ total: sql<number>`coalesce(sum(${scans.findingsCount}), 0)::int` })
      .from(scans)
      .where(eq(scans.status, "completed"));
    totalFindings = fs.total;

    recentServers = await db
      .select({
        id: servers.id,
        name: servers.name,
        owner: servers.owner,
        repo: servers.repo,
        latestGrade: servers.latestGrade,
        latestScore: servers.latestScore,
        findingsCount: scans.findingsCount,
        lastScannedAt: scans.completedAt,
      })
      .from(servers)
      .leftJoin(scans, eq(servers.latestScanId, scans.id))
      .where(isNotNull(servers.latestGrade))
      .orderBy(desc(servers.updatedAt))
      .limit(5);
  } catch {
    /* render with defaults */
  }

  const gradeColor: Record<string, string> = {
    A: "bg-emerald-500",
    B: "bg-blue-500",
    C: "bg-amber-500",
    D: "bg-orange-500",
    F: "bg-red-500",
  };

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-24 text-center">
        <div className="absolute inset-0 dot-grid opacity-50" aria-hidden="true" />
        <div className="relative">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-balance">
            Secure your MCP servers
          </h1>
          <p className="mt-4 text-lg text-[var(--fg-faint)] max-w-xl mx-auto text-pretty">
            Free security scanning for Model Context Protocol servers.
            122 rules. OWASP mapped. CI/CD ready.
          </p>
          <div className="mt-10 max-w-lg mx-auto">
            <HomeSearchBar />
          </div>
          <p className="mt-4 text-sm text-[var(--fg-ghost)]">
            Try:{" "}
            <Link
              href="/scan?q=modelcontextprotocol/servers"
              className="text-[var(--accent)] hover:underline"
            >
              modelcontextprotocol/servers
            </Link>
          </p>
        </div>
      </section>

      {/* Stats — single line */}
      <section
        className="py-6 text-center text-sm text-[var(--fg-faint)] border-y border-[var(--border)]"
        aria-label="Statistics"
      >
        <p>
          <span className="text-[var(--fg)] font-medium" style={{ fontFamily: "'Geist Mono', monospace" }}>
            {totalServers}
          </span>{" "}
          servers scanned{" · "}
          <span className="text-[var(--fg)] font-medium" style={{ fontFamily: "'Geist Mono', monospace" }}>
            {totalFindings.toLocaleString()}
          </span>{" "}
          vulnerabilities found{" · "}
          <span className="text-[var(--fg)] font-medium" style={{ fontFamily: "'Geist Mono', monospace" }}>
            122
          </span>{" "}
          detection rules
        </p>
      </section>

      {/* Features — 3 cards */}
      <section className="py-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Code2,
              title: "Source Code Analysis",
              desc: "Scan GitHub repos for 15 categories of vulnerabilities including tool poisoning, injection, and credential theft.",
              href: "/scan",
            },
            {
              icon: Shield,
              title: "Config Scanner",
              desc: "Paste your MCP config to find hardcoded secrets, dangerous permissions, and insecure server settings.",
              href: "/config-scan",
            },
            {
              icon: GitBranch,
              title: "CI/CD Integration",
              desc: "GitHub Actions workflow that blocks unsafe MCP servers in every pull request.",
              href: "/integrations",
            },
          ].map(({ icon: Icon, title, desc, href }) => (
            <div key={title} className="card group">
              <Icon className="size-6 text-[var(--fg-ghost)] mb-4" aria-hidden="true" />
              <h3 className="text-base font-medium">{title}</h3>
              <p className="mt-2 text-sm text-[var(--fg-faint)] text-pretty leading-relaxed">
                {desc}
              </p>
              <Link
                href={href}
                className="mt-4 inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
              >
                Learn more <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Scanned — compact list */}
      {recentServers.length > 0 && (
        <section className="pb-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium">Recently scanned</h2>
            <Link
              href="/leaderboard"
              className="text-sm text-[var(--fg-faint)] hover:text-[var(--fg-muted)] transition-colors"
            >
              View all <ArrowRight className="inline size-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="border border-[var(--border)] rounded-xl overflow-hidden">
            {recentServers.map((server, i) => (
              <Link
                key={server.id}
                href={`/server/${server.id}`}
                className={`flex items-center gap-4 px-4 py-3.5 hover:bg-[var(--bg-muted)] transition-colors ${
                  i < recentServers.length - 1 ? "border-b border-[var(--border)]" : ""
                }`}
              >
                {/* Grade badge */}
                <div
                  className={`size-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 ${
                    gradeColor[server.latestGrade ?? "F"] ?? "bg-zinc-600"
                  }`}
                >
                  {server.latestGrade ?? "–"}
                </div>

                {/* Server info */}
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-[var(--fg)]">
                    {server.owner}/{server.repo}
                  </span>
                </div>

                {/* Score */}
                <span
                  className="text-sm text-[var(--fg-faint)] tabular-nums"
                  style={{ fontFamily: "'Geist Mono', monospace" }}
                >
                  {server.latestScore ?? "–"}/100
                </span>

                {/* Findings */}
                <span className="text-sm text-[var(--fg-ghost)] tabular-nums w-20 text-right">
                  {server.findingsCount ?? 0} findings
                </span>

                {/* Time */}
                <span className="text-xs text-[var(--fg-ghost)] w-16 text-right hidden sm:block">
                  {server.lastScannedAt
                    ? new Date(server.lastScannedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "–"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 text-center border-t border-[var(--border)]">
        <p className="text-sm text-[var(--fg-ghost)]">
          MCP Scanner — Free and open source
          <span className="mx-2">·</span>
          <a
            href="https://github.com/NOTTIBOY137/mcp-scanner"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--fg-faint)] hover:text-[var(--fg-muted)] transition-colors"
          >
            GitHub
          </a>
        </p>
      </footer>
    </>
  );
}

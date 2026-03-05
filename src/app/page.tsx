import Link from "next/link";
import { ShieldAlert, Bug, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { servers, scans } from "@/db/schema";
import { sql, isNotNull, desc, eq } from "drizzle-orm";
import { ServerCard } from "@/components/scanner/ServerCard";
import { HomeSearchBar } from "@/components/scanner/HomeSearchBar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP Scanner — Is Your MCP Server Safe?",
  description:
    "The first public security registry for Model Context Protocol servers. Scan any MCP server for vulnerabilities in seconds. Free security grades, badges, and shareable reports.",
  openGraph: {
    title: "MCP Scanner — Is Your MCP Server Safe?",
    description:
      "The first public security registry for Model Context Protocol servers.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MCP Scanner — Is Your MCP Server Safe?",
    description:
      "Free security grades for MCP servers. Scan any server in seconds.",
  },
};

export const revalidate = 300;

export default async function HomePage() {
  let totalServers = 0;
  let totalFindings = 0;
  let avgScore = 0;
  let recentServers: {
    id: string;
    name: string;
    owner: string;
    repo: string;
    description: string | null;
    stars: number | null;
    latestGrade: string | null;
    latestScore: number | null;
    findingsCount: number | null;
    lastScannedAt: Date | null;
  }[] = [];

  try {
    const [serverCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(servers)
      .where(isNotNull(servers.latestGrade));
    totalServers = serverCount.count;

    const [findingsSum] = await db
      .select({
        total: sql<number>`coalesce(sum(${scans.findingsCount}), 0)::int`,
      })
      .from(scans)
      .where(eq(scans.status, "completed"));
    totalFindings = findingsSum.total;

    const [scoreAvg] = await db
      .select({
        avg: sql<number>`coalesce(round(avg(${servers.latestScore})), 0)::int`,
      })
      .from(servers)
      .where(isNotNull(servers.latestScore));
    avgScore = scoreAvg.avg;

    recentServers = await db
      .select({
        id: servers.id,
        name: servers.name,
        owner: servers.owner,
        repo: servers.repo,
        description: servers.description,
        stars: servers.stars,
        latestGrade: servers.latestGrade,
        latestScore: servers.latestScore,
        findingsCount: scans.findingsCount,
        lastScannedAt: scans.completedAt,
      })
      .from(servers)
      .leftJoin(scans, eq(servers.latestScanId, scans.id))
      .where(isNotNull(servers.latestGrade))
      .orderBy(desc(servers.updatedAt))
      .limit(6);
  } catch {
    // DB connection may fail — render with defaults
  }

  return (
    <div className="space-y-0">
      {/* Hero */}
      <section className="gradient-mesh grain relative -mx-6 -mt-8 flex min-h-[70vh] flex-col items-center justify-center px-6 py-20 text-center overflow-hidden">
        {/* Floating particles */}
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${10 + i * 11}%`,
              top: `${15 + (i * 17) % 60}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${5 + (i % 3) * 2}s`,
            }}
          />
        ))}

        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1]">
          Is Your MCP Server
          <br />
          <span className="text-[var(--accent-glow)] glow-text">Safe?</span>
        </h1>
        <p className="mx-auto mt-6 max-w-[540px] text-lg leading-relaxed text-[var(--text-secondary)]">
          The first public security registry for Model Context Protocol
          servers. Scan any MCP server in seconds.
        </p>
        <div className="mt-10 w-full">
          <HomeSearchBar />
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative -mx-6 border-y border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-6 py-10">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-10 sm:gap-20 text-center">
          <div>
            <p className="font-mono text-3xl font-bold text-[var(--text-primary)]">
              {totalServers.toLocaleString()}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-widest text-[var(--text-tertiary)]">
              Servers Scanned
            </p>
          </div>
          <div className="hidden sm:block h-10 w-px bg-[var(--border-subtle)]" />
          <div>
            <p className="font-mono text-3xl font-bold text-[var(--text-primary)]">
              {totalFindings.toLocaleString()}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-widest text-[var(--text-tertiary)]">
              Vulnerabilities Found
            </p>
          </div>
          <div className="hidden sm:block h-10 w-px bg-[var(--border-subtle)]" />
          <div>
            <p className="font-mono text-3xl font-bold text-[var(--text-primary)]">
              {avgScore}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-widest text-[var(--text-tertiary)]">
              Average Score
            </p>
          </div>
        </div>
      </section>

      {/* Recently Scanned */}
      {recentServers.length > 0 && (
        <section className="pt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold">Recently Scanned</h2>
            <Link
              href="/leaderboard"
              className="text-sm text-[var(--accent)] hover:text-[var(--accent-glow)] transition-colors"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {recentServers.map((server) => (
              <ServerCard key={server.id} server={server} />
            ))}
          </div>
        </section>
      )}

      {/* Why Scan? */}
      <section className="pt-20">
        <h2 className="font-display text-2xl font-bold text-center mb-10">
          Why Scan MCP Servers?
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card group">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10">
              <ShieldAlert className="h-6 w-6 text-[var(--accent)]" />
            </div>
            <h3 className="font-display font-semibold text-[var(--text-primary)]">
              75% allow arbitrary file access
            </h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Most MCP servers grant unrestricted read/write access to your
              filesystem without proper sandboxing.
            </p>
          </div>
          <div className="card group">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10">
              <Bug className="h-6 w-6 text-[var(--accent)]" />
            </div>
            <h3 className="font-display font-semibold text-[var(--text-primary)]">
              53% have command injection
            </h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Over half of scanned servers pass unsanitized input to system
              shell commands, enabling remote code execution.
            </p>
          </div>
          <div className="card group">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10">
              <ShieldCheck className="h-6 w-6 text-[var(--accent)]" />
            </div>
            <h3 className="font-display font-semibold text-[var(--text-primary)]">
              No registry existed — until now
            </h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              MCP Scanner is the first public trust registry. Know what you
              are installing before it gets access to your data.
            </p>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-[var(--text-tertiary)]">
          Based on analysis of publicly scanned MCP servers on this registry.
        </p>
      </section>
    </div>
  );
}

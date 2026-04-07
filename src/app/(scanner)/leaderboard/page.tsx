import { db } from "@/lib/db";
import { servers, scans } from "@/db/schema";
import { desc, asc, isNotNull, eq, and, ilike, or, sql } from "drizzle-orm";
import { Search, Shield } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "MCP Security Registry",
  description: "Every MCP server ranked by security score. Browse, search, and compare MCP servers.",
  alternates: { canonical: "/leaderboard" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "safe", label: "Safe" },
  { key: "review", label: "Review" },
  { key: "risky", label: "Risky" },
] as const;

function scoreColor(score: number | null): string {
  if (score === null) return "text-zinc-500";
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

function scoreBg(score: number | null): string {
  if (score === null) return "bg-zinc-800";
  if (score >= 80) return "bg-emerald-500/10 border-emerald-500/20";
  if (score >= 60) return "bg-amber-500/10 border-amber-500/20";
  if (score >= 40) return "bg-orange-500/10 border-orange-500/20";
  return "bg-red-500/10 border-red-500/20";
}

function statusBadge(score: number | null): { label: string; cls: string } {
  if (score === null) return { label: "Unknown", cls: "text-zinc-400 border-zinc-700 bg-zinc-800/50" };
  if (score >= 80) return { label: "Safe", cls: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" };
  if (score >= 50) return { label: "Review", cls: "text-amber-400 border-amber-500/20 bg-amber-500/10" };
  if (score >= 20) return { label: "Risky", cls: "text-orange-400 border-orange-500/20 bg-orange-500/10" };
  return { label: "Dangerous", cls: "text-red-400 border-red-500/20 bg-red-500/10" };
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const pageSize = 24;
  const filter = params.filter ?? "all";

  let results: {
    id: string; name: string; owner: string; repo: string;
    description: string | null; stars: number | null;
    language: string | null;
    latestGrade: string | null; latestScore: number | null;
    findingsCount: number | null; lastScannedAt: Date | null;
  }[] = [];
  let dbError = false;
  let totalServers = 0;
  let safeCount = 0;
  let totalFindings = 0;

  try {
    let gradeFilter;
    if (filter === "safe") gradeFilter = or(eq(servers.latestGrade, "A"), eq(servers.latestGrade, "B"));
    else if (filter === "review") gradeFilter = or(eq(servers.latestGrade, "C"), eq(servers.latestGrade, "D"));
    else if (filter === "risky") gradeFilter = eq(servers.latestGrade, "F");

    const queryFilter = params.q
      ? or(ilike(servers.name, `%${params.q}%`), ilike(servers.owner, `%${params.q}%`), ilike(servers.repo, `%${params.q}%`))
      : undefined;

    // Aggregate stats
    const [statsRow] = await db.select({
      total: sql<number>`count(*)::int`,
      safe: sql<number>`count(*) filter (where ${servers.latestScore} >= 80)::int`,
      findings: sql<number>`coalesce(sum(${scans.findingsCount}), 0)::int`,
    }).from(servers).leftJoin(scans, eq(servers.latestScanId, scans.id)).where(isNotNull(servers.latestGrade));
    totalServers = statsRow.total;
    safeCount = statsRow.safe;
    totalFindings = statsRow.findings;

    results = await db
      .select({
        id: servers.id, name: servers.name, owner: servers.owner, repo: servers.repo,
        description: servers.description, stars: servers.stars, language: servers.language,
        latestGrade: servers.latestGrade, latestScore: servers.latestScore,
        findingsCount: scans.findingsCount, lastScannedAt: scans.completedAt,
      })
      .from(servers)
      .leftJoin(scans, eq(servers.latestScanId, scans.id))
      .where(and(isNotNull(servers.latestGrade), gradeFilter, queryFilter))
      .orderBy(desc(servers.latestScore))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
  } catch { dbError = true; }

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    const merged = { filter, q: params.q ?? "", page: String(page), ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all" && !(k === "page" && v === "1")) p.set(k, v);
    }
    const qs = p.toString();
    return `/leaderboard${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="pt-16 pb-24">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          MCP Security Registry
        </h1>
        <p className="mt-3 text-muted max-w-lg mx-auto">
          Every scanned MCP server ranked by security score. Find safe servers for your AI agent workflows.
        </p>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-3 gap-4 mb-10 max-w-lg mx-auto">
        <div className="rounded-xl border border-white/10 bg-card p-4 text-center">
          <p className="text-2xl font-bold font-mono tabular-nums text-foreground">{totalServers}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Servers Scanned</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-400">{safeCount}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Safe</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-card p-4 text-center">
          <p className="text-2xl font-bold font-mono tabular-nums text-foreground">{totalFindings.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Findings</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {FILTERS.map((f) => (
            <a
              key={f.key}
              href={buildUrl({ filter: f.key, page: "1" })}
              className={`text-sm font-medium transition-colors ${
                filter === f.key ? "text-foreground" : "text-muted-foreground hover:text-muted"
              }`}
            >
              {f.label}
            </a>
          ))}
        </div>
        <form className="relative w-full sm:w-64" action="/leaderboard" method="GET">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
          <input name="q" type="text" placeholder="Search servers..." defaultValue={params.q} className="input pl-9 w-full" />
        </form>
      </div>

      {dbError && (
        <div className="rounded-xl border border-white/10 bg-card text-center p-8">
          <p className="text-foreground font-medium">Failed to load data.</p>
          <p className="mt-1 text-sm text-muted">Please refresh the page.</p>
        </div>
      )}

      {/* Card Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((server) => {
          const badge = statusBadge(server.latestScore);
          const avatarUrl = `https://github.com/${server.owner}.png?size=80`;

          return (
            <Link
              key={server.id}
              href={`/server/${server.id}`}
              className="group rounded-xl border border-white/10 bg-card p-5 transition-all duration-300 hover:border-white/20 hover:bg-card-hover"
            >
              {/* Top: Avatar + Name + Score */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* GitHub Avatar */}
                  <img
                    src={avatarUrl}
                    alt=""
                    width={36}
                    height={36}
                    className="size-9 rounded-lg border border-white/10 bg-zinc-900 shrink-0"
                    loading="lazy"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground truncate">
                        {server.name}
                      </span>
                      {server.latestScore !== null && server.latestScore >= 80 && (
                        <Shield className="size-3.5 text-emerald-400 shrink-0" aria-label="Verified safe" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {server.owner}/{server.repo}
                    </p>
                  </div>
                </div>

                {/* Score */}
                <div className={`shrink-0 rounded-lg border px-2.5 py-1 text-right ${scoreBg(server.latestScore)}`}>
                  <span className={`text-lg font-bold font-mono tabular-nums ${scoreColor(server.latestScore)}`}>
                    {server.latestScore ?? "—"}
                  </span>
                </div>
              </div>

              {/* Description */}
              {server.description && (
                <p className="mt-3 text-xs text-muted leading-relaxed line-clamp-2">
                  {server.description}
                </p>
              )}

              {/* Bottom: Badge + Stats */}
              <div className="mt-4 flex items-center justify-between">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>
                  {badge.label}
                </span>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  {server.findingsCount !== null && server.findingsCount > 0 && (
                    <span>{server.findingsCount} findings</span>
                  )}
                  {server.language && <span>{server.language}</span>}
                  {server.stars !== null && server.stars > 0 && (
                    <span className="flex items-center gap-0.5">
                      <svg className="size-3" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
                      </svg>
                      {server.stars.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty */}
      {results.length === 0 && !dbError && (
        <div className="text-center py-20">
          <p className="text-muted">No servers found.</p>
          {params.q && (
            <a href="/leaderboard" className="mt-2 inline-block text-sm text-brand-400 hover:underline">Clear search</a>
          )}
        </div>
      )}

      {/* Pagination */}
      {(results.length === pageSize || page > 1) && (
        <div className="flex items-center justify-center gap-6 pt-10">
          {page > 1 ? (
            <a href={buildUrl({ page: String(page - 1) })} className="text-sm text-muted hover:text-foreground transition-colors">Previous</a>
          ) : (
            <span className="text-sm text-muted-foreground">Previous</span>
          )}
          <span className="text-sm text-muted-foreground font-mono">{page}</span>
          {results.length === pageSize ? (
            <a href={buildUrl({ page: String(page + 1) })} className="text-sm text-muted hover:text-foreground transition-colors">Next</a>
          ) : (
            <span className="text-sm text-muted-foreground">Next</span>
          )}
        </div>
      )}
    </div>
  );
}

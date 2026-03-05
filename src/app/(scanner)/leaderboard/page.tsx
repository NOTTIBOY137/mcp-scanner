import { db } from "@/lib/db";
import { servers, scans } from "@/db/schema";
import { desc, asc, isNotNull, eq, and, ilike, or } from "drizzle-orm";
import { Star, Search } from "lucide-react";
import Link from "next/link";
import { GRADE_THRESHOLDS, type Grade } from "@/types/grade";

export const revalidate = 600;

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP Security Leaderboard",
  description:
    "Every MCP server ranked by security score. See which servers are safe and which have vulnerabilities.",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "good", label: "A-B" },
  { key: "risk", label: "C-D" },
  { key: "fail", label: "F" },
  { key: "recent", label: "Recently Scanned" },
] as const;

const SORTS = [
  { key: "best", label: "Best Score" },
  { key: "worst", label: "Worst Score" },
  { key: "recent", label: "Most Recent" },
] as const;

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return n.toLocaleString();
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string;
    sort?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const pageSize = 20;
  const filter = params.filter ?? "all";
  const sort = params.sort ?? "best";

  let results: {
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
  let dbError = false;

  try {
    let gradeFilter;
    if (filter === "good") {
      gradeFilter = or(
        eq(servers.latestGrade, "A"),
        eq(servers.latestGrade, "B")
      );
    } else if (filter === "risk") {
      gradeFilter = or(
        eq(servers.latestGrade, "C"),
        eq(servers.latestGrade, "D")
      );
    } else if (filter === "fail") {
      gradeFilter = eq(servers.latestGrade, "F");
    }

    const queryFilter = params.q
      ? or(
          ilike(servers.name, `%${params.q}%`),
          ilike(servers.owner, `%${params.q}%`),
          ilike(servers.repo, `%${params.q}%`)
        )
      : undefined;

    const where = and(isNotNull(servers.latestGrade), gradeFilter, queryFilter);

    let orderBy;
    if (sort === "worst") {
      orderBy = asc(servers.latestScore);
    } else if (sort === "recent" || filter === "recent") {
      orderBy = desc(servers.updatedAt);
    } else {
      orderBy = desc(servers.latestScore);
    }

    results = await db
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
      .where(where)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize);
  } catch {
    dbError = true;
  }

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    const base = { filter, sort, q: params.q ?? "", page: String(page) };
    const merged = { ...base, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all" && v !== "best" && !(k === "page" && v === "1")) {
        p.set(k, v);
      }
    }
    const qs = p.toString();
    return `/leaderboard${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Security Leaderboard</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          MCP servers ranked by security score.
        </p>
      </div>

      {dbError && (
        <div className="card border-red-500/30 bg-red-500/5 text-center">
          <p className="font-medium">Failed to load leaderboard data.</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Database connection timed out. Please refresh the page.
          </p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <a
            key={f.key}
            href={buildUrl({ filter: f.key, page: "1" })}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              filter === f.key
                ? "bg-[var(--accent)] text-white shadow-md shadow-cyan-500/20"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {/* Sort + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] p-1">
          {SORTS.map((s) => (
            <a
              key={s.key}
              href={buildUrl({ sort: s.key, page: "1" })}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                sort === s.key
                  ? "bg-[var(--bg-hover)] text-[var(--text-primary)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {s.label}
            </a>
          ))}
        </div>
        <form className="flex flex-1 gap-2" action="/leaderboard" method="GET">
          {filter !== "all" && (
            <input type="hidden" name="filter" value={filter} />
          )}
          {sort !== "best" && (
            <input type="hidden" name="sort" value={sort} />
          )}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <input
              name="q"
              type="text"
              placeholder="Search servers..."
              defaultValue={params.q}
              className="input pl-9"
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <th className="px-4 py-3 text-right font-mono text-xs text-[var(--text-tertiary)] w-12">#</th>
              <th className="px-4 py-3 text-center w-14">Grade</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Server</th>
              <th className="hidden md:table-cell px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Score</th>
              <th className="hidden sm:table-cell px-4 py-3 text-right font-medium text-[var(--text-secondary)]">Findings</th>
              <th className="hidden lg:table-cell px-4 py-3 text-right font-medium text-[var(--text-secondary)]">Stars</th>
              <th className="hidden md:table-cell px-4 py-3 text-right font-medium text-[var(--text-secondary)]">Scanned</th>
            </tr>
          </thead>
          <tbody>
            {results.map((server, i) => {
              const rank = (page - 1) * pageSize + i + 1;
              const gradeColor = GRADE_THRESHOLDS[server.latestGrade as Grade]?.color ?? "#64748b";
              return (
                <tr
                  key={server.id}
                  className="group border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ borderLeft: `2px solid transparent` }}
                >
                  <td className="px-4 py-3 text-right font-mono text-[var(--text-tertiary)]">
                    {rank}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div
                      className="mx-auto flex h-8 w-8 items-center justify-center rounded-full font-mono font-bold text-sm"
                      style={{ backgroundColor: `${gradeColor}15`, color: gradeColor }}
                    >
                      {server.latestGrade ?? "?"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/server/${server.id}`}
                      className="group-hover:text-[var(--accent-glow)] font-medium transition-colors"
                    >
                      {server.name}
                    </Link>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {server.owner}/{server.repo}
                    </p>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[var(--text-primary)]">
                        {server.latestScore ?? "—"}/100
                      </span>
                      {server.latestScore !== null && (
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--bg-primary)]">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${server.latestScore}%`, backgroundColor: gradeColor }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-right text-[var(--text-secondary)]">
                    {server.findingsCount ?? 0}
                  </td>
                  <td className="hidden lg:table-cell px-4 py-3 text-right text-[var(--text-tertiary)]">
                    {(server.stars ?? 0) > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {formatStars(server.stars!)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-right text-[var(--text-tertiary)]">
                    {server.lastScannedAt
                      ? new Date(server.lastScannedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {results.length === 0 && !dbError && (
        <div className="card text-center py-12">
          <p className="text-[var(--text-secondary)]">No servers found.</p>
          {params.q && (
            <a
              href="/leaderboard"
              className="mt-2 inline-block text-sm text-[var(--accent)] hover:text-[var(--accent-glow)]"
            >
              Clear search
            </a>
          )}
        </div>
      )}

      {/* Pagination */}
      {(results.length === pageSize || page > 1) && (
        <div className="flex items-center justify-center gap-4">
          {page > 1 && (
            <a href={buildUrl({ page: String(page - 1) })} className="btn-secondary">
              &larr; Previous
            </a>
          )}
          <span className="text-sm text-[var(--text-tertiary)]">
            Page {page}
          </span>
          {results.length === pageSize && (
            <a href={buildUrl({ page: String(page + 1) })} className="btn-secondary">
              Next &rarr;
            </a>
          )}
        </div>
      )}

      {results.length > 0 && results.length < pageSize && page === 1 && (
        <div className="card text-center border-dashed">
          <p className="text-[var(--text-secondary)]">
            Know an MCP server we should scan?
          </p>
          <Link
            href="/scan"
            className="mt-2 inline-block text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-glow)]"
          >
            Submit it for scanning &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}

import { db } from "@/lib/db";
import { servers, scans } from "@/db/schema";
import { desc, asc, isNotNull, eq, and, ilike, or } from "drizzle-orm";
import { Search } from "lucide-react";
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
  { key: "good", label: "A\u2013B" },
  { key: "risk", label: "C\u2013D" },
  { key: "fail", label: "F" },
] as const;

const GRADE_CSS: Record<string, string> = {
  A: "bg-[var(--grade-A)]",
  B: "bg-[var(--grade-B)]",
  C: "bg-[var(--grade-C)]",
  D: "bg-[var(--grade-D)]",
  F: "bg-[var(--grade-F)]",
};

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
    } else if (sort === "recent") {
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
    <div className="py-24 space-y-10">
      {/* Header row: title left, search right */}
      <div className="flex items-center justify-between gap-6">
        <h1 className="text-2xl font-medium text-balance">Leaderboard</h1>

        <form
          className="relative w-full max-w-[240px]"
          action="/leaderboard"
          method="GET"
        >
          {filter !== "all" && (
            <input type="hidden" name="filter" value={filter} />
          )}
          {sort !== "best" && (
            <input type="hidden" name="sort" value={sort} />
          )}
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--fg-ghost)]"
            aria-hidden="true"
          />
          <input
            name="q"
            type="text"
            placeholder="Search..."
            defaultValue={params.q}
            className="input pl-9 w-full"
          />
        </form>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-6">
        {FILTERS.map((f) => (
          <a
            key={f.key}
            href={buildUrl({ filter: f.key, page: "1" })}
            className={`text-sm transition-colors ${
              filter === f.key
                ? "text-[var(--fg)]"
                : "text-[var(--fg-faint)] hover:text-[var(--fg-muted)]"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {dbError && (
        <div className="card text-center">
          <p className="font-medium text-[var(--fg)]">
            Failed to load leaderboard data.
          </p>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            Database connection timed out. Please refresh the page.
          </p>
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="data-table w-full text-sm">
          <thead>
            <tr>
              <th className="w-12 text-right">#</th>
              <th className="w-16 text-center">Grade</th>
              <th className="text-left">Server</th>
              <th className="hidden md:table-cell text-right">Score</th>
              <th className="hidden sm:table-cell text-right">Findings</th>
              <th className="hidden md:table-cell text-right">Scanned</th>
            </tr>
          </thead>
          <tbody>
            {results.map((server, i) => {
              const rank = (page - 1) * pageSize + i + 1;
              const grade = (server.latestGrade as Grade) ?? null;
              const bgClass = grade ? GRADE_CSS[grade] ?? "" : "";

              return (
                <tr
                  key={server.id}
                  className="group transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ height: 52 }}
                >
                  <td
                    className="text-right text-[var(--fg-ghost)]"
                    style={{ fontFamily: "'Geist Mono', monospace" }}
                  >
                    {rank}
                  </td>
                  <td className="text-center">
                    <span
                      className={`inline-flex items-center justify-center size-6 rounded-full text-xs font-semibold text-white ${bgClass}`}
                    >
                      {grade ?? "?"}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/server/${server.id}`}
                      className="text-[var(--fg)] hover:text-[var(--accent-hover)] transition-colors"
                    >
                      {server.owner}/{server.repo}
                    </Link>
                  </td>
                  <td
                    className="hidden md:table-cell text-right text-[var(--fg)]"
                    style={{ fontFamily: "'Geist Mono', monospace" }}
                  >
                    {server.latestScore ?? "\u2014"}
                  </td>
                  <td
                    className="hidden sm:table-cell text-right text-[var(--fg-muted)]"
                    style={{ fontFamily: "'Geist Mono', monospace" }}
                  >
                    {server.findingsCount ?? 0}
                  </td>
                  <td className="hidden md:table-cell text-right text-[var(--fg-faint)]">
                    {server.lastScannedAt
                      ? new Date(server.lastScannedAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )
                      : "\u2014"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {results.length === 0 && !dbError && (
        <div className="text-center py-16">
          <p className="text-[var(--fg-muted)]">No servers found.</p>
          {params.q && (
            <a
              href="/leaderboard"
              className="mt-2 inline-block text-sm text-[var(--accent)] hover:text-[var(--accent-hover)]"
            >
              Clear search
            </a>
          )}
        </div>
      )}

      {/* Pagination */}
      {(results.length === pageSize || page > 1) && (
        <div className="flex items-center justify-center gap-6 pt-4">
          {page > 1 ? (
            <a
              href={buildUrl({ page: String(page - 1) })}
              className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
            >
              Previous
            </a>
          ) : (
            <span className="text-sm text-[var(--fg-ghost)]">Previous</span>
          )}
          <span
            className="text-sm text-[var(--fg-ghost)]"
            style={{ fontFamily: "'Geist Mono', monospace" }}
          >
            {page}
          </span>
          {results.length === pageSize ? (
            <a
              href={buildUrl({ page: String(page + 1) })}
              className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
            >
              Next
            </a>
          ) : (
            <span className="text-sm text-[var(--fg-ghost)]">Next</span>
          )}
        </div>
      )}
    </div>
  );
}

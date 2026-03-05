import Link from "next/link";
import { Star } from "lucide-react";
import type { ServerListItem } from "@/types/server";
import { GradeBadge } from "./GradeBadge";
import { GRADE_THRESHOLDS, type Grade } from "@/types/grade";

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return n.toLocaleString();
}

export function ServerCard({
  server,
  rank,
}: {
  server: ServerListItem;
  rank?: number;
}) {
  const gradeColor =
    GRADE_THRESHOLDS[server.latestGrade as Grade]?.color ?? "#64748b";

  return (
    <Link
      href={`/server/${server.id}`}
      className="group flex items-center gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5 transition-all hover:border-[var(--border-accent)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/5"
    >
      {rank != null && (
        <span className="hidden sm:flex w-6 text-center font-mono text-sm text-[var(--text-tertiary)]">
          {rank}
        </span>
      )}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-mono font-bold" style={{ backgroundColor: `${gradeColor}15`, color: gradeColor }}>
        {server.latestGrade ?? "?"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-glow)] transition-colors">
            {server.name}
          </h3>
          {server.latestScore !== null && (
            <span className="font-mono text-xs text-[var(--text-tertiary)]">
              {server.latestScore}/100
            </span>
          )}
        </div>
        <p className="truncate text-sm text-[var(--text-tertiary)]">
          {server.owner}/{server.repo}
        </p>
        {server.latestScore !== null && (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--bg-primary)]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(server.latestScore, 3)}%`,
                backgroundColor: gradeColor,
              }}
            />
          </div>
        )}
      </div>
      <div className="hidden sm:flex flex-col items-end gap-1 text-xs text-[var(--text-tertiary)]">
        {(server.stars ?? 0) > 0 && (
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            {formatStars(server.stars!)}
          </span>
        )}
        {server.findingsCount != null && server.findingsCount > 0 && (
          <span>{server.findingsCount} findings</span>
        )}
        {server.lastScannedAt && (
          <span>
            {new Date(server.lastScannedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>
    </Link>
  );
}

import { db } from "@/lib/db";
import { scans, findings } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  // Avg scan duration (last 50 completed scans)
  const recentScans = await db
    .select({
      duration: scans.duration,
      grade: scans.grade,
    })
    .from(scans)
    .where(eq(scans.status, "completed"))
    .orderBy(desc(scans.completedAt))
    .limit(50);

  const avgDuration =
    recentScans.length > 0
      ? Math.round(
          recentScans.reduce((sum, s) => sum + (s.duration ?? 0), 0) /
            recentScans.length
        )
      : 0;

  // Grade distribution
  const gradeDistribution = recentScans.reduce(
    (acc, s) => {
      const g = s.grade ?? "F";
      acc[g] = (acc[g] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Top 20 triggered rules
  const topRules = await db
    .select({
      ruleId: findings.ruleId,
      title: findings.title,
      count: count(),
    })
    .from(findings)
    .groupBy(findings.ruleId, findings.title)
    .orderBy(desc(count()))
    .limit(20);

  const gradeOrder = ["A+", "A", "B", "C", "D", "F"];
  const gradeColors: Record<string, string> = {
    "A+": "bg-green-400",
    A: "bg-green-500",
    B: "bg-[var(--accent)]",
    C: "bg-yellow-500",
    D: "bg-orange-500",
    F: "bg-red-500",
  };

  const maxGradeCount = Math.max(...Object.values(gradeDistribution), 1);
  const maxRuleCount = topRules.length > 0 ? Number(topRules[0].count) : 1;

  // Duration trend (last 20 scans, newest first, reverse for display)
  const durationScans = recentScans.slice(0, 20).reverse();
  const maxDuration = Math.max(...durationScans.map((s) => s.duration ?? 0), 1);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Analytics</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-sm text-[var(--text-secondary)]">Avg Scan Duration</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {avgDuration > 0 ? `${(avgDuration / 1000).toFixed(1)}s` : "N/A"}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-[var(--text-secondary)]">Total Scans (Recent)</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{recentScans.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-[var(--text-secondary)]">Unique Rules Triggered</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{topRules.length}</p>
        </div>
      </div>

      {/* Grade distribution */}
      <div className="card space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Grade Distribution</h2>
        {gradeOrder.map((g) => {
          const cnt = gradeDistribution[g] ?? 0;
          if (cnt === 0) return null;
          return (
            <div key={g} className="flex items-center gap-3">
              <span className="w-8 text-sm font-medium text-[var(--text-primary)]">{g}</span>
              <div className="flex-1 h-5 rounded bg-[var(--bg-secondary)] overflow-hidden">
                <div
                  className={`h-full rounded ${gradeColors[g] ?? "bg-[var(--bg-tertiary)]"}`}
                  style={{ width: `${(cnt / maxGradeCount) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right text-sm text-[var(--text-secondary)]">{cnt}</span>
            </div>
          );
        })}
      </div>

      {/* Top triggered rules */}
      <div className="card space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Top Triggered Rules</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)]/50 text-left text-[var(--text-secondary)]">
                <th className="pb-2 pr-4">Rule</th>
                <th className="pb-2 pr-4">Title</th>
                <th className="pb-2 text-right">Hits</th>
              </tr>
            </thead>
            <tbody>
              {topRules.map((r) => (
                <tr key={r.ruleId} className="border-b border-[var(--card-border)]/50">
                  <td className="py-2 pr-4 font-mono text-xs text-[var(--text-secondary)]">{r.ruleId}</td>
                  <td className="py-2 pr-4 text-[var(--text-primary)]">{r.title}</td>
                  <td className="py-2 text-right text-[var(--text-secondary)]">{String(r.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scan duration trend */}
      <div className="card space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Scan Duration Trend</h2>
        <div className="flex items-end gap-1 h-24">
          {durationScans.map((s, i) => {
            const d = s.duration ?? 0;
            const height = Math.max(4, (d / maxDuration) * 96);
            return (
              <div
                key={i}
                className="flex-1 rounded-t bg-[var(--accent)]/60"
                style={{ height: `${height}px` }}
                title={`${(d / 1000).toFixed(1)}s`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

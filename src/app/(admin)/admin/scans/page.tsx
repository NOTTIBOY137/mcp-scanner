export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { scans, servers } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export default async function AdminScansPage() {
  const recentScans = await db
    .select({
      id: scans.id,
      status: scans.status,
      grade: scans.grade,
      score: scans.score,
      duration: scans.duration,
      createdAt: scans.createdAt,
      serverName: servers.name,
      owner: servers.owner,
      repo: servers.repo,
    })
    .from(scans)
    .leftJoin(servers, eq(scans.serverId, servers.id))
    .orderBy(desc(scans.createdAt))
    .limit(50);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Recent Scans</h1>
      <p className="text-sm text-[var(--text-secondary)]">{recentScans.length} scans</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--card-border)] text-left text-xs text-[var(--text-secondary)]">
              <th className="pb-2 pr-4">Server</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2 pr-4">Grade</th>
              <th className="pb-2 pr-4">Score</th>
              <th className="pb-2 pr-4">Duration</th>
              <th className="pb-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {recentScans.map((scan) => (
              <tr key={scan.id} className="border-b border-[var(--card-border)]/50">
                <td className="py-2 pr-4 font-medium">
                  {scan.owner && scan.repo
                    ? `${scan.owner}/${scan.repo}`
                    : scan.serverName ?? "\u2014"}
                </td>
                <td className="py-2 pr-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      scan.status === "completed"
                        ? "bg-green-500/15 text-green-400"
                        : scan.status === "failed"
                          ? "bg-red-500/15 text-red-400"
                          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {scan.status}
                  </span>
                </td>
                <td className="py-2 pr-4 font-bold">{scan.grade ?? "\u2014"}</td>
                <td className="py-2 pr-4">{scan.score ?? "\u2014"}</td>
                <td className="py-2 pr-4 text-xs">
                  {scan.duration ? `${(scan.duration / 1000).toFixed(1)}s` : "\u2014"}
                </td>
                <td className="py-2 text-xs text-[var(--text-secondary)]">
                  {scan.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

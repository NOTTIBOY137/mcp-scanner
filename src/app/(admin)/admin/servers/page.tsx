export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { servers } from "@/db/schema";
import { desc } from "drizzle-orm";
import { toggleServerVerified } from "@/actions/admin";

export default async function AdminServersPage() {
  const allServers = await db
    .select()
    .from(servers)
    .orderBy(desc(servers.updatedAt))
    .limit(100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Servers</h1>
      <p className="text-sm text-[var(--text-secondary)]">{allServers.length} servers</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--card-border)] text-left text-xs text-[var(--text-secondary)]">
              <th className="pb-2 pr-4">Name</th>
              <th className="pb-2 pr-4">Grade</th>
              <th className="pb-2 pr-4">Score</th>
              <th className="pb-2 pr-4">Registry</th>
              <th className="pb-2 pr-4">Verified</th>
              <th className="pb-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {allServers.map((server) => (
              <tr key={server.id} className="border-b border-[var(--card-border)]/50">
                <td className="py-2 pr-4">
                  <span className="font-medium">{server.owner}/{server.repo}</span>
                </td>
                <td className="py-2 pr-4 font-bold">{server.latestGrade ?? "\u2014"}</td>
                <td className="py-2 pr-4">{server.latestScore ?? "\u2014"}</td>
                <td className="py-2 pr-4 text-xs font-mono">{server.registrySlug ?? "\u2014"}</td>
                <td className="py-2 pr-4">
                  {server.isVerified ? (
                    <span className="text-green-400">Yes</span>
                  ) : (
                    <span className="text-[var(--text-tertiary)]">No</span>
                  )}
                </td>
                <td className="py-2">
                  <form action={toggleServerVerified}>
                    <input type="hidden" name="serverId" value={server.id} />
                    <input
                      type="hidden"
                      name="verified"
                      value={server.isVerified ? "false" : "true"}
                    />
                    <button
                      type="submit"
                      className="rounded bg-[var(--bg-secondary)] px-2 py-1 text-xs hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      {server.isVerified ? "Unverify" : "Verify"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

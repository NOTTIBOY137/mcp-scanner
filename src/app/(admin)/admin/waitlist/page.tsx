export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { waitlist } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function AdminWaitlistPage() {
  const entries = await db
    .select()
    .from(waitlist)
    .orderBy(desc(waitlist.createdAt))
    .limit(100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Waitlist</h1>
      <p className="text-sm text-[var(--text-secondary)]">{entries.length} entries</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--card-border)] text-left text-xs text-[var(--text-secondary)]">
              <th className="pb-2 pr-4">Email</th>
              <th className="pb-2 pr-4">Plan</th>
              <th className="pb-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-[var(--card-border)]/50">
                <td className="py-2 pr-4 font-mono text-xs">{entry.email}</td>
                <td className="py-2 pr-4">
                  <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-xs">
                    {entry.plan}
                  </span>
                </td>
                <td className="py-2 text-xs text-[var(--text-secondary)]">
                  {entry.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

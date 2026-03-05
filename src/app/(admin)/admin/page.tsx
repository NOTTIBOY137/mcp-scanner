export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { servers, scans, subscriptions, waitlist, apiKeys } from "@/db/schema";
import { sql } from "drizzle-orm";

async function getCount(table: Parameters<typeof db.select>[0] extends undefined ? any : any) {
  const result = await db.select({ count: sql<number>`count(*)` }).from(table);
  return Number(result[0]?.count ?? 0);
}

export default async function AdminOverviewPage() {
  const [serverCount, scanCount, subCount, waitlistCount, keyCount] =
    await Promise.all([
      getCount(servers),
      getCount(scans),
      getCount(subscriptions),
      getCount(waitlist),
      getCount(apiKeys),
    ]);

  const stats = [
    { label: "Servers", value: serverCount },
    { label: "Scans", value: scanCount },
    { label: "Subscriptions", value: subCount },
    { label: "Waitlist", value: waitlistCount },
    { label: "API Keys", value: keyCount },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <p className="text-sm text-[var(--text-secondary)]">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold">{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

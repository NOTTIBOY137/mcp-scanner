import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { apiKeys, serverClaims, servers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ApiKeyCard } from "@/components/dashboard/ApiKeyCard";
import { BillingCard } from "@/components/dashboard/BillingCard";
import { EmailPreferencesCard } from "@/components/dashboard/EmailPreferencesCard";
import { UsageCard } from "@/components/dashboard/UsageCard";
import { WebhooksCard } from "@/components/dashboard/WebhooksCard";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const userKeys = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.clerkUserId, userId));

  const userClaims = await db
    .select({
      id: serverClaims.id,
      serverId: serverClaims.serverId,
      verified: serverClaims.verified,
      verifiedAt: serverClaims.verifiedAt,
      createdAt: serverClaims.createdAt,
      serverName: servers.name,
      serverOwner: servers.owner,
      serverRepo: servers.repo,
    })
    .from(serverClaims)
    .leftJoin(servers, eq(serverClaims.serverId, servers.id))
    .where(eq(serverClaims.clerkUserId, userId));

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted">
          Manage your API keys and claimed servers.
        </p>
      </div>

      {/* Plan info */}
      <BillingCard />

      {/* Usage */}
      <section>
        <div className="rounded-xl border border-white/10 bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Usage</h2>
          <UsageCard />
        </div>
      </section>

      {/* API Keys */}
      <section>
        <div className="rounded-xl border border-white/10 bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">API Keys</h2>
          <ApiKeyCard keys={userKeys} maxKeys={3} />
        </div>
      </section>

      {/* Webhooks */}
      <section>
        <div className="rounded-xl border border-white/10 bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Webhooks</h2>
          <WebhooksCard />
        </div>
      </section>

      {/* Notifications */}
      <section>
        <div className="rounded-xl border border-white/10 bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Email Preferences</h2>
          <EmailPreferencesCard />
        </div>
      </section>

      {/* Claimed Servers */}
      <section>
        <div className="rounded-xl border border-white/10 bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Claimed Servers</h2>
          {userClaims.length === 0 ? (
            <p className="text-muted text-sm">
              No claimed servers yet. Visit a server page to claim ownership.
            </p>
          ) : (
            <div className="space-y-2">
              {userClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-zinc-900 px-4 py-3"
                >
                  <div>
                    <span className="font-medium text-foreground">
                      {claim.serverOwner}/{claim.serverRepo}
                    </span>
                    <span className="ml-2 text-xs text-muted">
                      {claim.serverName}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      claim.verified
                        ? "bg-green-500/15 text-green-400"
                        : "bg-yellow-500/15 text-yellow-400"
                    }`}
                  >
                    {claim.verified ? "Verified" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

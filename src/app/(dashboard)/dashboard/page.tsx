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
import { getUserSubscription, getEffectivePlan } from "@/lib/subscriptions";

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

  const subscription = await getUserSubscription(userId);
  const plan = getEffectivePlan(subscription);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Manage your API keys and claimed servers.
        </p>
      </div>

      {/* Plan info */}
      <BillingCard
        plan={plan}
        status={subscription.status}
        cancelAtPeriodEnd={subscription.cancelAtPeriodEnd ?? false}
        currentPeriodEnd={subscription.currentPeriodEnd?.toISOString() ?? null}
        hasStripeCustomer={!!subscription.stripeCustomerId}
      />

      {/* Usage */}
      <section id="usage">
        <h2 className="text-lg font-semibold mb-4">Usage</h2>
        <UsageCard />
      </section>

      {/* API Keys */}
      <section id="api-keys">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">API Keys</h2>
        </div>
        <ApiKeyCard keys={userKeys} maxKeys={3} />
      </section>

      {/* Webhooks */}
      <section id="webhooks">
        <h2 className="text-lg font-semibold mb-4">Webhooks</h2>
        <WebhooksCard plan={plan} />
      </section>

      {/* Notifications */}
      <section id="notifications">
        <h2 className="text-lg font-semibold mb-4">Notifications</h2>
        <EmailPreferencesCard />
      </section>

      {/* Claimed Servers */}
      <section id="claimed-servers">
        <h2 className="text-lg font-semibold mb-4">Claimed Servers</h2>
        {userClaims.length === 0 ? (
          <p className="text-[var(--text-secondary)] text-sm">
            No claimed servers yet. Visit a server page to claim ownership.
          </p>
        ) : (
          <div className="space-y-2">
            {userClaims.map((claim) => (
              <div key={claim.id} className="card flex items-center justify-between">
                <div>
                  <span className="font-medium">
                    {claim.serverOwner}/{claim.serverRepo}
                  </span>
                  <span className="ml-2 text-xs text-[var(--text-secondary)]">
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
      </section>
    </div>
  );
}

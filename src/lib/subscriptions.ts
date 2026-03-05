import { db } from "@/lib/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface Subscription {
  id: string;
  clerkUserId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  plan: string;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

const FREE_DEFAULT: Subscription = {
  id: "",
  clerkUserId: "",
  stripeCustomerId: "",
  stripeSubscriptionId: null,
  plan: "free",
  status: "active",
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export async function getUserSubscription(
  clerkUserId: string
): Promise<Subscription> {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.clerkUserId, clerkUserId));

  if (rows.length === 0) {
    return { ...FREE_DEFAULT, clerkUserId };
  }
  return rows[0] as Subscription;
}

export function getEffectivePlan(sub: Subscription): string {
  if (sub.status === "active" || sub.status === "trialing") {
    return sub.plan;
  }
  return "free";
}

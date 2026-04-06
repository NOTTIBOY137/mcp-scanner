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
  // All features are free — skip DB query, return team-tier for everyone
  return {
    ...FREE_DEFAULT,
    clerkUserId,
    plan: "team",
    status: "active",
  };
}

export function getEffectivePlan(_sub: Subscription): string {
  // All features are free — everyone is on the team plan
  return "team";
}

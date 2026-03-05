import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSelectResult: any[] = [];

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve(mockSelectResult),
      }),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  subscriptions: { clerkUserId: "clerk_user_id" },
}));

import {
  getUserSubscription,
  getEffectivePlan,
} from "@/lib/subscriptions";

describe("getUserSubscription", () => {
  beforeEach(() => {
    mockSelectResult.length = 0;
  });

  it("returns free defaults when no row exists", async () => {
    const sub = await getUserSubscription("user-1");
    expect(sub.plan).toBe("free");
    expect(sub.status).toBe("active");
    expect(sub.clerkUserId).toBe("user-1");
    expect(sub.stripeCustomerId).toBe("");
  });

  it("returns DB data when row exists", async () => {
    mockSelectResult.push({
      id: "sub-1",
      clerkUserId: "user-1",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_456",
      plan: "pro",
      status: "active",
      currentPeriodEnd: new Date("2025-12-01"),
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const sub = await getUserSubscription("user-1");
    expect(sub.plan).toBe("pro");
    expect(sub.stripeCustomerId).toBe("cus_123");
    expect(sub.stripeSubscriptionId).toBe("sub_456");
  });
});

describe("getEffectivePlan", () => {
  const baseSub = {
    id: "sub-1",
    clerkUserId: "user-1",
    stripeCustomerId: "cus_123",
    stripeSubscriptionId: "sub_456",
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("returns plan for active status", () => {
    expect(getEffectivePlan({ ...baseSub, plan: "pro", status: "active" })).toBe("pro");
  });

  it("returns plan for trialing status", () => {
    expect(getEffectivePlan({ ...baseSub, plan: "team", status: "trialing" })).toBe("team");
  });

  it('returns "free" for past_due status', () => {
    expect(getEffectivePlan({ ...baseSub, plan: "pro", status: "past_due" })).toBe("free");
  });

  it('returns "free" for canceled status', () => {
    expect(getEffectivePlan({ ...baseSub, plan: "team", status: "canceled" })).toBe("free");
  });
});

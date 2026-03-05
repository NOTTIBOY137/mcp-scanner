import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---
const mockHeaders = vi.fn();
vi.mock("next/headers", () => ({
  headers: () => mockHeaders(),
}));

const mockConstructEvent = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: (...args: any[]) => mockConstructEvent(...args),
    },
    subscriptions: {
      retrieve: (...args: any[]) => mockSubscriptionsRetrieve(...args),
    },
  }),
  priceToPlan: (priceId: string) => {
    if (priceId === "price_pro") return "pro";
    if (priceId === "price_team") return "team";
    return "free";
  },
}));

const mockInsert = vi.fn();
const mockUpdateSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockSelectResult: any[] = [];

vi.mock("@/lib/db", () => ({
  db: {
    insert: () => ({
      values: (...args: any[]) => ({
        onConflictDoUpdate: () => {
          mockInsert(...args);
          return Promise.resolve();
        },
      }),
    }),
    update: () => ({
      set: (...args: any[]) => {
        mockUpdateSet(...args);
        return {
          where: (...wargs: any[]) => {
            mockUpdateWhere(...wargs);
            return Promise.resolve();
          },
        };
      },
    }),
    select: () => ({
      from: () => ({
        where: () => Promise.resolve(mockSelectResult),
      }),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  subscriptions: { clerkUserId: "clerk_user_id", stripeCustomerId: "stripe_customer_id" },
  apiKeys: { clerkUserId: "clerk_user_id" },
}));

vi.mock("@paralleldrive/cuid2", () => ({
  createId: () => "mock-id",
}));

// Set env before importing route
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

import { POST } from "@/app/api/webhooks/stripe/route";

function makeRequest(body: string) {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectResult.length = 0;
    mockHeaders.mockReturnValue({
      get: (name: string) => {
        if (name === "stripe-signature") return "sig_test";
        return null;
      },
    });
  });

  it("returns 400 on invalid signature", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid signature/);
  });

  it("processes checkout.session.completed", async () => {
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { clerkUserId: "user-1", plan: "pro" },
          customer: "cus_123",
          subscription: "sub_456",
        },
      },
    });

    mockSubscriptionsRetrieve.mockResolvedValue({
      status: "active",
      current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
      cancel_at_period_end: false,
    });

    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
    // syncApiKeyPlans should have been called (update set with plan)
    expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ plan: "pro" }));
  });

  it("processes customer.subscription.deleted (downgrades to free)", async () => {
    mockSelectResult.push({ clerkUserId: "user-1", stripeCustomerId: "cus_123" });

    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_456",
          customer: "cus_123",
          status: "canceled",
          current_period_end: Math.floor(Date.now() / 1000),
          cancel_at_period_end: false,
          items: { data: [{ price: { id: "price_pro" } }] },
        },
      },
    });

    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(200);

    // Should set plan to "free" and status to "canceled"
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ plan: "free", status: "canceled" })
    );
  });

  it("processes invoice.payment_failed (sets past_due)", async () => {
    mockConstructEvent.mockReturnValue({
      type: "invoice.payment_failed",
      data: {
        object: {
          customer: "cus_123",
        },
      },
    });

    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(200);

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "past_due" })
    );
  });
});

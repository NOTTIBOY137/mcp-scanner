import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

const mockGetUserSubscription = vi.fn();
const mockGetEffectivePlan = vi.fn();
vi.mock("@/lib/subscriptions", () => ({
  getUserSubscription: (...args: any[]) => mockGetUserSubscription(...args),
  getEffectivePlan: (...args: any[]) => mockGetEffectivePlan(...args),
}));

const mockCheckoutCreate = vi.fn();
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        create: (...args: any[]) => mockCheckoutCreate(...args),
      },
    },
  }),
  PLAN_PRICE_MAP: { pro: "price_pro", team: "price_team" },
}));

import { POST } from "@/app/api/checkout/route";

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserSubscription.mockResolvedValue({ plan: "free", status: "active" });
    mockGetEffectivePlan.mockReturnValue("free");
    mockCheckoutCreate.mockResolvedValue({ url: "https://checkout.stripe.com/session123" });
  });

  it("returns checkout URL for valid plan + auth", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });

    const res = await POST(makeRequest({ plan: "pro" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.url).toBe("https://checkout.stripe.com/session123");
    expect(mockCheckoutCreate).toHaveBeenCalledTimes(1);
  });

  it("returns 400 for invalid plan", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });

    const res = await POST(makeRequest({ plan: "invalid" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid plan/);
  });

  it("returns 400 if already subscribed", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockGetEffectivePlan.mockReturnValue("pro");

    const res = await POST(makeRequest({ plan: "team" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/already have/i);
  });

  it("returns 401 without auth", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await POST(makeRequest({ plan: "pro" }));
    expect(res.status).toBe(401);
  });
});

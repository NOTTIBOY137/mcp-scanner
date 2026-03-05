import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockAuth = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          groupBy: () => ({
            orderBy: (..._args: any[]) => {
              const result = Promise.resolve([]);
              (result as any).limit = () => Promise.resolve([]);
              return result;
            },
          }),
        }),
      }),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  apiUsage: { clerkUserId: "clerk_user_id", date: "date", count: "count", endpoint: "endpoint" },
}));

vi.mock("@/lib/usage", () => ({
  getTodayUsage: vi.fn().mockResolvedValue({ total: 5, byEndpoint: { "v1/score": 5 } }),
}));

vi.mock("@/lib/subscriptions", () => ({
  getUserSubscription: vi.fn().mockResolvedValue({ plan: "pro", status: "active" }),
  getEffectivePlan: vi.fn().mockReturnValue("pro"),
}));

vi.mock("@/lib/api-keys", () => ({
  getPlanLimits: vi.fn().mockReturnValue({ daily: 1000, maxClaims: 10 }),
}));

import { GET } from "@/app/api/usage/route";

describe("GET /api/usage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without auth", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const req = new NextRequest("http://localhost/api/usage");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns usage data for authenticated user", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });
    const req = new NextRequest("http://localhost/api/usage?days=30");
    const res = await GET(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toHaveProperty("daily");
    expect(json).toHaveProperty("plan", "pro");
    expect(json).toHaveProperty("currentPeriodUsage");
  });
});

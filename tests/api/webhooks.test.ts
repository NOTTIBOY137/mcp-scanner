import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn().mockResolvedValue(undefined);

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => mockSelect(),
      }),
    }),
    insert: () => ({
      values: (...args: any[]) => mockInsert(...args),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  webhooks: { clerkUserId: "clerk_user_id", id: "id" },
}));

vi.mock("@/lib/subscriptions", () => ({
  getUserSubscription: vi.fn().mockResolvedValue({
    plan: "pro",
    status: "active",
    stripeCustomerId: "cus_1",
  }),
  getEffectivePlan: (sub: any) => sub.plan,
}));

vi.mock("@paralleldrive/cuid2", () => ({
  createId: () => "mock-cuid",
}));

import { GET, POST } from "@/app/api/webhooks/route";

describe("GET /api/webhooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without auth", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 403 for free plan users", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });
    const { getUserSubscription } = await import("@/lib/subscriptions");
    (getUserSubscription as any).mockResolvedValueOnce({
      plan: "free",
      status: "active",
      stripeCustomerId: "",
    });

    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns webhooks for pro user", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockSelect.mockResolvedValue([
      { id: "wh-1", url: "https://example.com", events: ["scan.completed"], active: true, secret: "s", createdAt: new Date() },
    ]);

    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toHaveLength(1);
    // Secret should be stripped
    expect(json[0]).not.toHaveProperty("secret");
  });
});

describe("POST /api/webhooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without auth", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(new Request("http://localhost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "https://example.com" }),
    }));
    expect(res.status).toBe(401);
  });

  it("creates webhook and returns secret", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockInsert.mockResolvedValue(undefined);

    const res = await POST(new Request("http://localhost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "https://example.com/hook" }),
    }));
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json).toHaveProperty("secret");
    expect(json).toHaveProperty("id");
    expect(json.url).toBe("https://example.com/hook");
  });

  it("returns 400 for invalid URL", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });

    const res = await POST(new Request("http://localhost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "not-a-url" }),
    }));
    expect(res.status).toBe(400);
  });
});

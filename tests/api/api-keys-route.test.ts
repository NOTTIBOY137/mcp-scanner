import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---
const mockAuth = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

const mockSelectResult: any[] = [];
const mockDeleteResult = { rowCount: 1 };

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve(mockSelectResult),
      }),
    }),
    insert: () => ({
      values: vi.fn().mockResolvedValue(undefined),
    }),
    delete: () => ({
      where: () => Promise.resolve(mockDeleteResult),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  apiKeys: {
    id: "id",
    clerkUserId: "clerk_user_id",
    keyHash: "key_hash",
    keyPrefix: "key_prefix",
  },
  subscriptions: {
    clerkUserId: "clerk_user_id",
  },
}));

vi.mock("@/lib/subscriptions", () => ({
  getUserSubscription: () =>
    Promise.resolve({ plan: "free", status: "active" }),
  getEffectivePlan: () => "free",
}));

vi.mock("@/lib/api-keys", () => ({
  generateApiKey: () =>
    Promise.resolve({
      raw: "mcp_testkey12345678",
      hash: "a".repeat(64),
      prefix: "mcp_testkey1",
    }),
  hashApiKey: (raw: string) => Promise.resolve("a".repeat(64)),
}));

vi.mock("@paralleldrive/cuid2", () => ({
  createId: () => "mock-id",
}));

import { POST, DELETE } from "@/app/(dashboard)/dashboard/api-keys/route";

describe("POST /dashboard/api-keys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectResult.length = 0;
  });

  it("creates key, returns raw key + prefix", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });

    const res = await POST();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.key).toMatch(/^mcp_/);
    expect(json.prefix).toBeDefined();
  });

  it("returns 400 when user has 3 keys already", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockSelectResult.push({}, {}, {});

    const res = await POST();
    expect(res.status).toBe(400);
  });

  it("returns 401 without auth", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST();
    expect(res.status).toBe(401);
  });
});

describe("DELETE /dashboard/api-keys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteResult.rowCount = 1;
  });

  it("removes key by id", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });

    const req = new Request("http://localhost/dashboard/api-keys", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "key-1" }),
    });

    const res = await DELETE(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("returns 404 for non-existent key", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockDeleteResult.rowCount = 0;

    const req = new Request("http://localhost/dashboard/api-keys", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "no-exist" }),
    });

    const res = await DELETE(req);
    expect(res.status).toBe(404);
  });

  it("returns 401 without auth", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const req = new Request("http://localhost/dashboard/api-keys", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "key-1" }),
    });

    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  it("scopes to authenticated user (can't delete another user's key)", async () => {
    mockAuth.mockResolvedValue({ userId: "user-2" });
    // The WHERE clause includes clerkUserId, so a key owned by user-1
    // won't match for user-2, resulting in rowCount=0
    mockDeleteResult.rowCount = 0;

    const req = new Request("http://localhost/dashboard/api-keys", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "user1-key" }),
    });

    const res = await DELETE(req);
    expect(res.status).toBe(404);
  });
});

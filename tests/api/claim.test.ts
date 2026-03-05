import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Shared state for mock tracking ---
let selectCallIndex = 0;
let selectResults: any[][] = [];
const mockFindFirst = vi.fn();

// --- Mocks ---
const mockAuth = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/db", () => {
  // Use a getter to reference the module-level variables at call time
  return {
    db: {
      query: {
        servers: {
          findFirst: (...args: any[]) => mockFindFirst(...args),
        },
      },
      select: () => {
        const idx = (globalThis as any).__claimTestSelectIdx++;
        const result = (globalThis as any).__claimTestSelectResults?.[idx] ?? [];
        return {
          from: () => ({
            where: (..._args: any[]) => {
              const arr: any = [...result];
              arr.then = (resolve: any) => resolve(result);
              arr.limit = () => Promise.resolve(result);
              return arr;
            },
          }),
        };
      },
      insert: () => ({
        values: vi.fn().mockResolvedValue(undefined),
      }),
    },
  };
});

vi.mock("@/db/schema", () => ({
  servers: { id: "id" },
  serverClaims: {
    serverId: "server_id",
    clerkUserId: "clerk_user_id",
    verified: "verified",
    verificationToken: "verification_token",
  },
  apiKeys: { clerkUserId: "clerk_user_id", plan: "plan" },
}));

vi.mock("@/lib/api-keys", () => ({
  getPlanLimits: (plan: string) => {
    switch (plan) {
      case "pro": return { daily: 1000, maxClaims: 10 };
      case "team": return { daily: 10000, maxClaims: 100 };
      default: return { daily: 100, maxClaims: 1 };
    }
  },
}));

vi.mock("@paralleldrive/cuid2", () => ({
  createId: () => "mock-cuid",
}));

import { POST } from "@/app/api/claim/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/claim", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

// The claim route does these db.select() calls in order:
// 0: existingVerified  (serverClaims where serverId=x AND verified=true) .limit(1)
// 1: userKey           (apiKeys where clerkUserId=userId) .limit(1)
// 2: verifiedClaims    (serverClaims where clerkUserId=userId AND verified=true) — NO .limit()
// 3: existingPending   (serverClaims where serverId=x AND clerkUserId=userId) .limit(1)

describe("POST /api/claim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__claimTestSelectIdx = 0;
    (globalThis as any).__claimTestSelectResults = [];
  });

  it("returns token for valid server + auth user", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockFindFirst.mockResolvedValue({ id: "s1", owner: "test-owner", repo: "test-repo" });
    (globalThis as any).__claimTestSelectResults = [
      [],                        // 0: existingVerified = none
      [{ plan: "free" }],        // 1: userKey
      [],                        // 2: verifiedClaims = none
      [],                        // 3: existingPending = none
    ];

    const res = await POST(makeRequest({ serverId: "s1" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.token).toMatch(/^mcptrust-verify-/);
    expect(json.owner).toBe("test-owner");
    expect(json.repo).toBe("test-repo");
  });

  it("returns 401 without auth", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(makeRequest({ serverId: "s1" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 for non-existent server", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockFindFirst.mockResolvedValue(null);

    const res = await POST(makeRequest({ serverId: "no-exist" }));
    expect(res.status).toBe(404);
  });

  it("returns 409 for already-verified server", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockFindFirst.mockResolvedValue({ id: "s1", owner: "o", repo: "r" });
    (globalThis as any).__claimTestSelectResults = [
      [{ verified: true }],  // 0: existingVerified — has a verified claim
    ];

    const res = await POST(makeRequest({ serverId: "s1" }));
    expect(res.status).toBe(409);
  });

  it("returns existing token for duplicate pending claim", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockFindFirst.mockResolvedValue({ id: "s1", owner: "o", repo: "r" });
    (globalThis as any).__claimTestSelectResults = [
      [],                        // 0: existingVerified = none
      [{ plan: "free" }],        // 1: userKey
      [],                        // 2: verifiedClaims = none
      [{ verificationToken: "mcptrust-verify-existing" }], // 3: existingPending
    ];

    const res = await POST(makeRequest({ serverId: "s1" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.token).toBe("mcptrust-verify-existing");
  });

  it("enforces per-plan claim limit (403 when exceeded)", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockFindFirst.mockResolvedValue({ id: "s1", owner: "o", repo: "r" });
    (globalThis as any).__claimTestSelectResults = [
      [],                        // 0: existingVerified = none
      [{ plan: "free" }],        // 1: userKey (free plan = maxClaims 1)
      [{ id: "claim-1" }],       // 2: verifiedClaims = already has 1
    ];

    const res = await POST(makeRequest({ serverId: "s1" }));
    expect(res.status).toBe(403);
  });
});

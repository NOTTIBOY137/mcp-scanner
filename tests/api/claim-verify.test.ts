import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---
const mockAuth = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

const mockFindFirst = vi.fn();
const mockSelectFrom = vi.fn();
const mockUpdateSet = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      servers: { findFirst: (...args: any[]) => mockFindFirst(...args) },
    },
    select: () => ({
      from: () => ({
        where: (...args: any[]) => ({
          limit: () => mockSelectFrom(...args),
        }),
      }),
    }),
    update: () => ({
      set: (...args: any[]) => ({
        where: () => mockUpdateSet(...args),
      }),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  servers: { id: "id" },
  serverClaims: {
    serverId: "server_id",
    clerkUserId: "clerk_user_id",
    verified: "verified",
    id: "id",
    verificationToken: "verification_token",
  },
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { POST } from "@/app/api/claim/verify/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/claim/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/claim/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns { verified: true } when token matches", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockSelectFrom.mockResolvedValue([
      { id: "c1", verificationToken: "mcptrust-verify-abc", verified: false },
    ]);
    mockFindFirst.mockResolvedValue({ id: "s1", owner: "test", repo: "repo" });
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("mcptrust-verify-abc"),
    });
    mockUpdateSet.mockResolvedValue(undefined);

    const res = await POST(makeRequest({ serverId: "s1" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.verified).toBe(true);
  });

  it("returns 400 when token doesn't match", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockSelectFrom.mockResolvedValue([
      { id: "c1", verificationToken: "mcptrust-verify-abc", verified: false },
    ]);
    mockFindFirst.mockResolvedValue({ id: "s1", owner: "test", repo: "repo" });
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("wrong-token"),
    });

    const res = await POST(makeRequest({ serverId: "s1" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when .mcptrust file not found (GitHub 404)", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockSelectFrom.mockResolvedValue([
      { id: "c1", verificationToken: "mcptrust-verify-abc", verified: false },
    ]);
    mockFindFirst.mockResolvedValue({ id: "s1", owner: "test", repo: "repo" });
    mockFetch.mockResolvedValue({ ok: false, status: 404 });

    const res = await POST(makeRequest({ serverId: "s1" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when no pending claim exists", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockSelectFrom.mockResolvedValue([]);

    const res = await POST(makeRequest({ serverId: "s1" }));
    expect(res.status).toBe(404);
  });

  it("returns 401 without auth", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(makeRequest({ serverId: "s1" }));
    expect(res.status).toBe(401);
  });
});

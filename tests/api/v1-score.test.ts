import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// --- Mocks using globalThis to avoid hoisting issues ---
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      servers: { findFirst: (...args: any[]) => (globalThis as any).__v1ScoreMocks.findFirstServer(...args) },
      scans: { findFirst: (...args: any[]) => (globalThis as any).__v1ScoreMocks.findFirstScan(...args) },
    },
    select: () => ({
      from: () => ({
        where: () => Promise.resolve([]),
      }),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  servers: { id: "id", owner: "owner", repo: "repo" },
  scans: { id: "id", serverId: "server_id", status: "status" },
  findings: { scanId: "scan_id", severity: "severity" },
}));

vi.mock("@/lib/api-keys", () => ({
  validateApiKey: (...args: any[]) => (globalThis as any).__v1ScoreMocks.validateApiKey(...args),
  getPlanLimits: (...args: any[]) => (globalThis as any).__v1ScoreMocks.getPlanLimits(...args),
}));

vi.mock("@/lib/rate-limit", () => ({
  createV1RateLimit: () => ({
    limit: (...args: any[]) => (globalThis as any).__v1ScoreMocks.rateLimit(...args),
  }),
  anonymousV1RateLimit: {
    limit: (...args: any[]) => (globalThis as any).__v1ScoreMocks.rateLimit(...args),
  },
}));

import { GET } from "@/app/api/v1/score/[owner]/[repo]/route";

// Set up mock functions
const mocks = {
  findFirstServer: vi.fn(),
  findFirstScan: vi.fn(),
  validateApiKey: vi.fn(),
  getPlanLimits: vi.fn(),
  rateLimit: vi.fn(),
};
(globalThis as any).__v1ScoreMocks = mocks;

function makeRequest(bearer?: string) {
  const headers: Record<string, string> = { "x-forwarded-for": "1.2.3.4" };
  if (bearer) headers["authorization"] = `Bearer ${bearer}`;
  return new NextRequest("http://localhost/api/v1/score/test-owner/test-repo", {
    headers,
  });
}

describe("GET /api/v1/score/[owner]/[repo]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue({ success: true, remaining: 99, reset: 0 });
    mocks.getPlanLimits.mockReturnValue({ daily: 1000, maxClaims: 10 });
  });

  it("returns JSON with correct shape for known server", async () => {
    mocks.validateApiKey.mockResolvedValue({ userId: "u1", plan: "pro" });
    mocks.findFirstServer.mockResolvedValue({
      id: "s1",
      owner: "test-owner",
      repo: "test-repo",
      latestGrade: "A",
      latestScore: 92,
    });
    mocks.findFirstScan.mockResolvedValue(null);

    const res = await GET(makeRequest("mcp_key123"), {
      params: Promise.resolve({ owner: "test-owner", repo: "test-repo" }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toHaveProperty("server", "test-owner/test-repo");
    expect(json).toHaveProperty("grade", "A");
    expect(json).toHaveProperty("score", 92);
    expect(json).toHaveProperty("findings");
    expect(json).toHaveProperty("badgeUrl");
  });

  it("returns 404 for unknown owner/repo", async () => {
    mocks.validateApiKey.mockResolvedValue({ userId: "u1", plan: "free" });
    mocks.findFirstServer.mockResolvedValue(null);

    const res = await GET(makeRequest("mcp_key123"), {
      params: Promise.resolve({ owner: "nope", repo: "nope" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 401 for invalid bearer token", async () => {
    mocks.validateApiKey.mockResolvedValue(null);

    const res = await GET(makeRequest("bad_key"), {
      params: Promise.resolve({ owner: "o", repo: "r" }),
    });
    expect(res.status).toBe(401);
  });

  it("includes X-RateLimit-Limit and X-RateLimit-Remaining headers", async () => {
    mocks.validateApiKey.mockResolvedValue({ userId: "u1", plan: "pro" });
    mocks.findFirstServer.mockResolvedValue({
      id: "s1",
      owner: "o",
      repo: "r",
      latestGrade: "B",
      latestScore: 80,
    });
    mocks.findFirstScan.mockResolvedValue(null);

    const res = await GET(makeRequest("mcp_key"), {
      params: Promise.resolve({ owner: "o", repo: "r" }),
    });

    expect(res.headers.get("X-RateLimit-Limit")).toBe("1000");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("99");
  });

  it("returns 429 when rate limit exceeded", async () => {
    mocks.validateApiKey.mockResolvedValue({ userId: "u1", plan: "free" });
    mocks.rateLimit.mockResolvedValue({ success: false, remaining: 0, reset: 9999 });

    const res = await GET(makeRequest("mcp_key"), {
      params: Promise.resolve({ owner: "o", repo: "r" }),
    });
    expect(res.status).toBe(429);
  });

  it("works without auth header (anonymous, 10/day limit)", async () => {
    mocks.findFirstServer.mockResolvedValue({
      id: "s1",
      owner: "o",
      repo: "r",
      latestGrade: "C",
      latestScore: 60,
    });
    mocks.findFirstScan.mockResolvedValue(null);

    const res = await GET(makeRequest(), {
      params: Promise.resolve({ owner: "o", repo: "r" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("10");
  });
});

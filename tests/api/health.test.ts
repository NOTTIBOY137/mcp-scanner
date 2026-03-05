import { describe, it, expect, vi } from "vitest";

// Mock db
vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        limit: () => Promise.resolve([{ id: "test" }]),
      }),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  servers: { id: "id" },
}));

// Mock Redis
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(() => ({
    ping: () => Promise.resolve("PONG"),
  })),
}));

process.env.UPSTASH_REDIS_REST_URL = "https://mock-redis.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns healthy status when all checks pass", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("healthy");
    expect(body.checks.database.status).toBe("ok");
    expect(body.checks.redis.status).toBe("ok");
  });

  it("returns degraded when DB fails", async () => {
    const { db } = await import("@/lib/db");
    vi.spyOn(db, "select").mockImplementationOnce(() => {
      throw new Error("DB down");
    });
    const res = await GET();
    const body = await res.json();
    expect(body.status).toBe("degraded");
    expect(body.checks.database.status).toBe("error");
  });

  it("includes timestamp", async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.timestamp).toBeDefined();
    expect(new Date(body.timestamp).getTime()).toBeGreaterThan(0);
  });
});

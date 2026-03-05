import { describe, it, expect, vi, beforeEach } from "vitest";

const mockIncr = vi.fn().mockResolvedValue(1);
const mockExpire = vi.fn().mockResolvedValue(true);
const mockScan = vi.fn();
const mockGet = vi.fn();
const mockDel = vi.fn().mockResolvedValue(1);
const mockInsert = vi.fn().mockResolvedValue(undefined);

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(() => ({
    incr: mockIncr,
    expire: mockExpire,
    scan: mockScan,
    get: mockGet,
    del: mockDel,
  })),
}));

vi.mock("@/lib/db", () => ({
  db: {
    insert: () => ({
      values: (...args: any[]) => mockInsert(...args),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  apiUsage: {},
}));

vi.mock("@paralleldrive/cuid2", () => ({
  createId: () => "mock-cuid",
}));

process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

import { incrementUsage, getTodayUsage, flushUsageToPostgres } from "@/lib/usage";

describe("usage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("incrementUsage", () => {
    it("calls Redis INCR and EXPIRE", async () => {
      await incrementUsage("user-1", "v1/score");
      expect(mockIncr).toHaveBeenCalledOnce();
      expect(mockExpire).toHaveBeenCalledOnce();
      expect(mockIncr.mock.calls[0][0]).toContain("usage:user-1:");
      expect(mockIncr.mock.calls[0][0]).toContain("v1/score");
    });
  });

  describe("getTodayUsage", () => {
    it("aggregates Redis keys for today", async () => {
      const today = new Date().toISOString().slice(0, 10);
      mockScan.mockResolvedValue([0, [`usage:user-1:${today}:v1/score`]]);
      mockGet.mockResolvedValue(42);

      const result = await getTodayUsage("user-1");
      expect(result.total).toBe(42);
      expect(result.byEndpoint["v1/score"]).toBe(42);
    });
  });

  describe("flushUsageToPostgres", () => {
    it("inserts Redis data into Postgres and deletes keys", async () => {
      mockScan.mockResolvedValue([0, ["usage:user-1:2026-03-04:v1/score"]]);
      mockGet.mockResolvedValue(100);

      const flushed = await flushUsageToPostgres();
      expect(flushed).toBe(1);
      expect(mockInsert).toHaveBeenCalledOnce();
      expect(mockDel).toHaveBeenCalledOnce();
    });
  });
});

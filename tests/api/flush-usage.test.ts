import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFlush = vi.fn();

vi.mock("@/lib/usage", () => ({
  flushUsageToPostgres: (...args: any[]) => mockFlush(...args),
}));

process.env.CRON_SECRET = "test-cron-secret";

import { GET } from "@/app/api/cron/flush-usage/route";

describe("GET /api/cron/flush-usage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without valid CRON_SECRET", async () => {
    const req = new NextRequest("http://localhost/api/cron/flush-usage", {
      headers: { authorization: "Bearer wrong-secret" },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("flushes usage with valid CRON_SECRET", async () => {
    mockFlush.mockResolvedValue(42);
    const req = new NextRequest("http://localhost/api/cron/flush-usage", {
      headers: { authorization: "Bearer test-cron-secret" },
    });
    const res = await GET(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.flushed).toBe(42);
  });
});

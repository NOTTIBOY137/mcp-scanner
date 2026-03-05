import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSelect = vi.fn();
const mockDeleteFindings = vi.fn().mockResolvedValue(undefined);
const mockDeleteScans = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => mockSelect(),
        }),
      }),
    }),
    delete: (table: any) => ({
      where: (...args: any[]) => {
        if (table === "findings_table") return mockDeleteFindings(...args);
        return mockDeleteScans(...args);
      },
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  scans: { id: "id", createdAt: "created_at" },
  findings: "findings_table",
}));

vi.mock("drizzle-orm", () => ({
  lt: vi.fn(),
  inArray: vi.fn(),
  sql: vi.fn(),
}));

import { GET } from "@/app/api/cron/cleanup/route";

describe("GET /api/cron/cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (process.env as any).CRON_SECRET;
  });

  it("returns 401 with wrong secret", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const req = new Request("http://localhost/api/cron/cleanup", {
      headers: { authorization: "Bearer wrong" },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 0 deleted when no old scans exist", async () => {
    mockSelect.mockResolvedValue([]);
    const req = new Request("http://localhost/api/cron/cleanup");
    const res = await GET(req);
    const json = await res.json();
    expect(json.deleted).toBe(0);
  });

  it("deletes findings before scans", async () => {
    const callOrder: string[] = [];
    mockSelect.mockResolvedValue([{ id: "s1" }, { id: "s2" }]);
    mockDeleteFindings.mockImplementation(() => {
      callOrder.push("findings");
      return Promise.resolve();
    });
    mockDeleteScans.mockImplementation(() => {
      callOrder.push("scans");
      return Promise.resolve();
    });

    const req = new Request("http://localhost/api/cron/cleanup");
    const res = await GET(req);
    const json = await res.json();
    expect(json.deleted).toBe(2);
    expect(callOrder[0]).toBe("findings");
  });

  it("returns 500 on DB error", async () => {
    mockSelect.mockRejectedValue(new Error("DB connection failed"));
    const req = new Request("http://localhost/api/cron/cleanup");
    const res = await GET(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain("DB connection failed");
  });

  it("allows when CRON_SECRET is unset", async () => {
    mockSelect.mockResolvedValue([]);
    const req = new Request("http://localhost/api/cron/cleanup", {
      headers: { authorization: "Bearer anything" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});

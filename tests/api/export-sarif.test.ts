import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      scans: {
        findFirst: vi.fn(),
      },
      findings: {
        findMany: vi.fn(),
      },
    },
  },
}));

vi.mock("@/db/schema", () => ({
  scans: { id: "id" },
  findings: { scanId: "scan_id" },
}));

import { GET } from "@/app/api/export/[scanId]/sarif/route";
import { db } from "@/lib/db";

describe("GET /api/export/[scanId]/sarif", () => {
  it("returns valid SARIF structure", async () => {
    vi.mocked(db.query.scans.findFirst).mockResolvedValue({
      id: "scan-1",
      status: "completed",
      grade: "B",
      score: 80,
    } as any);
    vi.mocked(db.query.findings.findMany).mockResolvedValue([
      {
        ruleId: "TP001",
        severity: "critical",
        title: "Hidden HTML tags",
        description: "Found hidden tags",
        filePath: "tool.ts",
        lineNumber: 5,
        snippet: "<hidden>evil</hidden>",
        confidence: "high",
        category: "tool-poisoning",
      },
    ] as any);

    const req = new Request("http://localhost/api/export/scan-1/sarif");
    const res = await GET(req, { params: Promise.resolve({ scanId: "scan-1" }) });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.version).toBe("2.1.0");
    expect(body.runs).toHaveLength(1);
    expect(body.runs[0].tool.driver.name).toBe("MCP Scanner");
    expect(body.runs[0].results).toHaveLength(1);
  });

  it("returns 404 for missing scan", async () => {
    vi.mocked(db.query.scans.findFirst).mockResolvedValue(undefined);

    const req = new Request("http://localhost/api/export/missing/sarif");
    const res = await GET(req, { params: Promise.resolve({ scanId: "missing" }) });
    expect(res.status).toBe(404);
  });

  it("sets correct Content-Type header", async () => {
    vi.mocked(db.query.scans.findFirst).mockResolvedValue({
      id: "scan-1",
      status: "completed",
    } as any);
    vi.mocked(db.query.findings.findMany).mockResolvedValue([]);

    const req = new Request("http://localhost/api/export/scan-1/sarif");
    const res = await GET(req, { params: Promise.resolve({ scanId: "scan-1" }) });
    expect(res.headers.get("Content-Type")).toBe("application/sarif+json");
  });
});

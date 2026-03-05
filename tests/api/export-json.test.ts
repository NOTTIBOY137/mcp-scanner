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

import { GET } from "@/app/api/export/[scanId]/json/route";
import { db } from "@/lib/db";

describe("GET /api/export/[scanId]/json", () => {
  it("returns valid JSON with scan and findings", async () => {
    vi.mocked(db.query.scans.findFirst).mockResolvedValue({
      id: "scan-1",
      status: "completed",
      grade: "A",
      score: 95,
      filesScanned: 10,
      findingsCount: 1,
      duration: 5000,
      completedAt: new Date(),
    } as any);
    vi.mocked(db.query.findings.findMany).mockResolvedValue([
      {
        ruleId: "CI001",
        category: "command-injection",
        severity: "critical",
        title: "exec with interpolation",
        description: "Dangerous",
        filePath: "cmd.ts",
        lineNumber: 1,
        snippet: "exec(`${cmd}`)",
        confidence: "high",
      },
    ] as any);

    const req = new Request("http://localhost/api/export/scan-1/json");
    const res = await GET(req, { params: Promise.resolve({ scanId: "scan-1" }) });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.scan.id).toBe("scan-1");
    expect(body.findings).toHaveLength(1);
  });

  it("returns 404 for missing scan", async () => {
    vi.mocked(db.query.scans.findFirst).mockResolvedValue(undefined);

    const req = new Request("http://localhost/api/export/missing/json");
    const res = await GET(req, { params: Promise.resolve({ scanId: "missing" }) });
    expect(res.status).toBe(404);
  });

  it("sets Content-Disposition header", async () => {
    vi.mocked(db.query.scans.findFirst).mockResolvedValue({
      id: "scan-1",
      status: "completed",
    } as any);
    vi.mocked(db.query.findings.findMany).mockResolvedValue([]);

    const req = new Request("http://localhost/api/export/scan-1/json");
    const res = await GET(req, { params: Promise.resolve({ scanId: "scan-1" }) });
    expect(res.headers.get("Content-Disposition")).toContain("scan-scan-1.json");
  });
});

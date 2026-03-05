import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockCompare = vi.fn();

vi.mock("@/lib/scan-compare", () => ({
  compareScanResults: (...args: any[]) => mockCompare(...args),
}));

import { GET } from "@/app/api/scan/compare/route";

describe("GET /api/scan/compare", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for missing params", async () => {
    const req = new NextRequest("http://localhost/api/scan/compare");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for partial params", async () => {
    const req = new NextRequest("http://localhost/api/scan/compare?oldScanId=abc");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 404 when scans not found", async () => {
    mockCompare.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/scan/compare?oldScanId=a&newScanId=b");
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it("returns comparison data", async () => {
    mockCompare.mockResolvedValue({
      oldScan: { id: "a", grade: "C", score: 60, findingsCount: 5, createdAt: new Date() },
      newScan: { id: "b", grade: "B", score: 80, findingsCount: 2, createdAt: new Date() },
      scoreDelta: 20,
      gradeChanged: true,
      newFindings: [],
      fixedFindings: [{ ruleId: "CI001", filePath: "src/a.ts", severity: "high", title: "Injection" }],
    });

    const req = new NextRequest("http://localhost/api/scan/compare?oldScanId=a&newScanId=b");
    const res = await GET(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.scoreDelta).toBe(20);
    expect(json.gradeChanged).toBe(true);
    expect(json.fixedFindings).toHaveLength(1);
  });
});

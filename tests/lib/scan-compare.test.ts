import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindFirst = vi.fn();
const mockSelectFindings = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      scans: { findFirst: (...args: any[]) => mockFindFirst(...args) },
    },
    select: () => ({
      from: () => ({
        where: () => mockSelectFindings(),
      }),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  scans: { id: "id" },
  findings: { scanId: "scan_id" },
}));

import { compareScanResults } from "@/lib/scan-compare";

describe("compareScanResults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when scan not found", async () => {
    mockFindFirst.mockResolvedValue(null);
    const result = await compareScanResults("old-1", "new-1");
    expect(result).toBeNull();
  });

  it("detects improved score", async () => {
    mockFindFirst
      .mockResolvedValueOnce({ id: "old-1", grade: "C", score: 60, findingsCount: 5, createdAt: new Date("2026-03-01") })
      .mockResolvedValueOnce({ id: "new-1", grade: "B", score: 80, findingsCount: 2, createdAt: new Date("2026-03-04") });

    mockSelectFindings
      .mockResolvedValueOnce([
        { ruleId: "CI001", filePath: "src/a.ts", severity: "high", title: "Command injection" },
        { ruleId: "SSRF001", filePath: "src/b.ts", severity: "medium", title: "SSRF" },
      ])
      .mockResolvedValueOnce([
        { ruleId: "SSRF001", filePath: "src/b.ts", severity: "medium", title: "SSRF" },
      ]);

    const result = await compareScanResults("old-1", "new-1");
    expect(result).not.toBeNull();
    expect(result!.scoreDelta).toBe(20);
    expect(result!.gradeChanged).toBe(true);
    expect(result!.fixedFindings).toHaveLength(1);
    expect(result!.fixedFindings[0].ruleId).toBe("CI001");
    expect(result!.newFindings).toHaveLength(0);
  });

  it("detects new findings", async () => {
    mockFindFirst
      .mockResolvedValueOnce({ id: "old-1", grade: "A", score: 95, findingsCount: 0, createdAt: new Date("2026-03-01") })
      .mockResolvedValueOnce({ id: "new-1", grade: "B", score: 75, findingsCount: 2, createdAt: new Date("2026-03-04") });

    mockSelectFindings
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { ruleId: "TP001", filePath: "src/tool.ts", severity: "critical", title: "Tool poisoning" },
      ]);

    const result = await compareScanResults("old-1", "new-1");
    expect(result!.scoreDelta).toBe(-20);
    expect(result!.newFindings).toHaveLength(1);
    expect(result!.newFindings[0].ruleId).toBe("TP001");
  });
});

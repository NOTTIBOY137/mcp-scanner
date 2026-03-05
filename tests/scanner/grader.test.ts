import { describe, it, expect } from "vitest";
import { calculateGrade } from "@/scanner/grader";
import type { RuleMatch } from "@/types/scan";

function makeMatch(
  overrides: Partial<RuleMatch> = {}
): RuleMatch {
  return {
    ruleId: "TEST001",
    category: "command-injection",
    severity: "medium",
    title: "Test finding",
    description: "Test description",
    filePath: "test.js",
    lineNumber: 1,
    snippet: "test code",
    confidence: "medium",
    ...overrides,
  };
}

describe("calculateGrade", () => {
  it("should return score 100 and grade A with no findings", () => {
    const result = calculateGrade([]);

    expect(result.score).toBe(100);
    expect(result.grade).toBe("A");
    expect(result.cappedBy).toBeUndefined();
  });

  it("should deduct 15 points per critical finding with high confidence", () => {
    const matches = [makeMatch({ severity: "critical", confidence: "high" })];
    const result = calculateGrade(matches);

    expect(result.score).toBe(69);
    expect(result.cappedBy).toContain("critical");
  });

  it("should deduct 8 points per high finding with high confidence", () => {
    const matches = [makeMatch({ severity: "high", confidence: "high" })];
    const result = calculateGrade(matches);

    expect(result.score).toBe(92);
    expect(result.grade).toBe("A");
  });

  it("should deduct 4 points per medium finding with high confidence", () => {
    const matches = [makeMatch({ severity: "medium", confidence: "high" })];
    const result = calculateGrade(matches);

    expect(result.score).toBe(96);
    expect(result.grade).toBe("A");
  });

  it("should deduct 2 points per low finding with high confidence", () => {
    const matches = [makeMatch({ severity: "low", confidence: "high" })];
    const result = calculateGrade(matches);

    expect(result.score).toBe(98);
    expect(result.grade).toBe("A");
  });

  it("should cap at C (max 69) for any critical finding", () => {
    const matches = [makeMatch({ severity: "critical", confidence: "high" })];
    const result = calculateGrade(matches);

    expect(result.score).toBeLessThanOrEqual(69);
    expect(["C", "D", "F"]).toContain(result.grade);
    expect(result.cappedBy).toContain("critical");
  });

  it("should cap at C (max 69) for 3+ high findings", () => {
    const matches = [
      makeMatch({ severity: "high", confidence: "high", ruleId: "H1" }),
      makeMatch({ severity: "high", confidence: "high", ruleId: "H2" }),
      makeMatch({ severity: "high", confidence: "high", ruleId: "H3" }),
    ];
    const result = calculateGrade(matches);

    expect(result.score).toBeLessThanOrEqual(69);
    expect(["C", "D", "F"]).toContain(result.grade);
    expect(result.cappedBy).toContain("3+ high");
  });

  it("should cap at D (max 49) for any tool-poisoning finding", () => {
    const matches = [
      makeMatch({
        category: "tool-poisoning",
        severity: "critical",
        confidence: "high",
      }),
    ];
    const result = calculateGrade(matches);

    expect(result.score).toBeLessThanOrEqual(49);
    expect(["D", "F"]).toContain(result.grade);
    expect(result.cappedBy).toContain("tool-poisoning");
  });

  it("should never go below 0", () => {
    const matches = Array.from({ length: 20 }, (_, i) =>
      makeMatch({
        severity: "critical",
        confidence: "high",
        ruleId: `CRIT${i}`,
      })
    );
    const result = calculateGrade(matches);

    expect(result.score).toBe(0);
    expect(result.grade).toBe("F");
  });

  it("should correctly accumulate multiple severity penalties", () => {
    const matches = [
      makeMatch({ severity: "high", confidence: "high", ruleId: "H1" }),
      makeMatch({ severity: "medium", confidence: "high", ruleId: "M1" }),
      makeMatch({ severity: "low", confidence: "high", ruleId: "L1" }),
    ];
    const result = calculateGrade(matches);

    // 100 - 8 - 4 - 2 = 86
    expect(result.score).toBe(86);
    expect(result.grade).toBe("B");
  });

  it("should include category scores for all categories", () => {
    const result = calculateGrade([]);

    expect(result.categoryScores.length).toBeGreaterThanOrEqual(8);
    const categories = result.categoryScores.map((c) => c.category);
    expect(categories).toContain("tool-poisoning");
    expect(categories).toContain("command-injection");
    expect(categories).toContain("path-traversal");
    expect(categories).toContain("ssrf");
    expect(categories).toContain("credential-theft");
    expect(categories).toContain("excessive-permissions");
    expect(categories).toContain("missing-auth");
    expect(categories).toContain("supply-chain");
  });

  it("should apply tool-poisoning cap over critical cap", () => {
    const matches = [
      makeMatch({
        category: "tool-poisoning",
        severity: "critical",
        confidence: "high",
      }),
      makeMatch({
        category: "command-injection",
        severity: "critical",
        confidence: "high",
      }),
    ];
    const result = calculateGrade(matches);

    expect(result.score).toBeLessThanOrEqual(49);
    expect(result.cappedBy).toContain("tool-poisoning");
  });

  it("should not cap for 2 high findings (below threshold)", () => {
    const matches = [
      makeMatch({ severity: "high", confidence: "high", ruleId: "H1" }),
      makeMatch({ severity: "high", confidence: "high", ruleId: "H2" }),
    ];
    const result = calculateGrade(matches);

    // 100 - 8 - 8 = 84
    expect(result.score).toBe(84);
    expect(result.grade).toBe("B");
    expect(result.cappedBy).toBeUndefined();
  });

  it("should deduct 50% penalty for medium confidence findings", () => {
    const matches = [
      makeMatch({ severity: "high", confidence: "medium", ruleId: "M1" }),
    ];
    const result = calculateGrade(matches);

    // high severity = 8 points, medium confidence = 50% -> 4 points deducted
    // 100 - 4 = 96
    expect(result.score).toBe(96);
    expect(result.grade).toBe("A");
  });

  it("should deduct 0 points for low confidence findings but still count them", () => {
    const matches = [
      makeMatch({ severity: "high", confidence: "low", ruleId: "L1" }),
      makeMatch({ severity: "critical", confidence: "low", ruleId: "L2" }),
    ];
    const result = calculateGrade(matches);

    // low confidence = 0 multiplier -> 0 points deducted
    expect(result.score).toBe(100);
    expect(result.grade).toBe("A");

    // But they should still appear in the findings count
    const ciCategory = result.categoryScores.find(
      (c) => c.category === "command-injection"
    );
    expect(ciCategory).toBeDefined();
    expect(ciCategory!.findingsCount).toBe(2);
  });

  it("should calculate correctly with a mix of high, medium, and low confidence", () => {
    const matches = [
      makeMatch({
        severity: "high",
        confidence: "high",
        ruleId: "H1",
      }),
      makeMatch({
        severity: "high",
        confidence: "medium",
        ruleId: "H2",
      }),
      makeMatch({
        severity: "high",
        confidence: "low",
        ruleId: "H3",
      }),
    ];
    const result = calculateGrade(matches);

    // high conf: 8 * 1.0 = 8
    // medium conf: 8 * 0.5 = 4
    // low conf: 8 * 0 = 0
    // total deduction = 12
    // 100 - 12 = 88
    expect(result.score).toBe(88);
    expect(result.grade).toBe("B");
  });

  it("should not apply cap for low confidence critical findings", () => {
    const matches = [
      makeMatch({ severity: "critical", confidence: "low", ruleId: "C1" }),
    ];
    const result = calculateGrade(matches);

    // low confidence critical: 0 points deducted, no cap applied
    expect(result.score).toBe(100);
    expect(result.grade).toBe("A");
    expect(result.cappedBy).toBeUndefined();
  });

  it("should apply medium confidence to medium severity correctly", () => {
    const matches = [
      makeMatch({ severity: "medium", confidence: "medium", ruleId: "MM1" }),
    ];
    const result = calculateGrade(matches);

    // medium severity = 4, medium confidence = 50% -> floor(4 * 0.5) = 2
    // 100 - 2 = 98
    expect(result.score).toBe(98);
    expect(result.grade).toBe("A");
  });
});

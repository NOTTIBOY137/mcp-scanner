import type { RuleMatch, VulnCategory } from "@/types/scan";
import type { GradeResult, CategoryScoreDetail } from "@/types/grade";
import { scoreToGrade } from "@/types/grade";

const SEVERITY_PENALTIES: Record<string, number> = {
  critical: 15,
  high: 8,
  medium: 4,
  low: 2,
  info: 0,
};

const CONFIDENCE_MULTIPLIERS: Record<string, number> = {
  high: 1.0,
  medium: 0.5,
  low: 0,
};

const ALL_CATEGORIES: VulnCategory[] = [
  "tool-poisoning",
  "command-injection",
  "path-traversal",
  "ssrf",
  "credential-theft",
  "excessive-permissions",
  "missing-auth",
  "supply-chain",
  "rug-pull",
  "data-exfiltration",
];

const MAX_SCORE_PER_CATEGORY = 12.5;

export function calculateGrade(matches: RuleMatch[]): GradeResult {
  let score = 100;
  let cappedBy: string | undefined;

  const categoryFindings = new Map<
    string,
    { count: number; penalty: number }
  >();

  for (const category of ALL_CATEGORIES) {
    categoryFindings.set(category, { count: 0, penalty: 0 });
  }

  for (const match of matches) {
    const basePenalty = SEVERITY_PENALTIES[match.severity] ?? 0;
    const multiplier = CONFIDENCE_MULTIPLIERS[match.confidence] ?? 1.0;
    const penalty = Math.floor(basePenalty * multiplier);

    score -= penalty;

    const existing = categoryFindings.get(match.category);
    if (existing) {
      existing.count += 1;
      existing.penalty += penalty;
    } else {
      categoryFindings.set(match.category, { count: 1, penalty });
    }
  }

  if (score < 0) {
    score = 0;
  }

  const hasCritical = matches.some(
    (m) => m.severity === "critical" && m.confidence !== "low"
  );
  const highCount = matches.filter(
    (m) => m.severity === "high" && m.confidence !== "low"
  ).length;
  const hasToolPoisoning = matches.some(
    (m) => m.category === "tool-poisoning" && m.confidence !== "low"
  );

  if (hasToolPoisoning) {
    if (score > 49) {
      score = 49;
    }
    cappedBy = "tool-poisoning finding caps grade at D";
  } else if (hasCritical) {
    if (score > 69) {
      score = 69;
    }
    cappedBy = "critical severity finding caps grade at C";
  } else if (highCount >= 3) {
    if (score > 69) {
      score = 69;
    }
    cappedBy = "3+ high severity findings cap grade at C";
  }

  const categoryScores: CategoryScoreDetail[] = ALL_CATEGORIES.map(
    (category) => {
      const data = categoryFindings.get(category) ?? {
        count: 0,
        penalty: 0,
      };
      const catScore = Math.max(0, MAX_SCORE_PER_CATEGORY - data.penalty);
      return {
        category,
        score: catScore,
        maxScore: MAX_SCORE_PER_CATEGORY,
        penalty: data.penalty,
        findingsCount: data.count,
      };
    }
  );

  return {
    grade: scoreToGrade(score),
    score,
    categoryScores,
    cappedBy,
  };
}

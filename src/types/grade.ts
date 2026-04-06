import type { OWASPComplianceSummary } from "./scan";

export type Grade = "A" | "B" | "C" | "D" | "F";

export interface GradeResult {
  grade: Grade;
  score: number;
  categoryScores: CategoryScoreDetail[];
  cappedBy?: string;
  owaspCompliance?: OWASPComplianceSummary[];
  compliancePercentage?: number;
}

export interface CategoryScoreDetail {
  category: string;
  score: number;
  maxScore: number;
  penalty: number;
  findingsCount: number;
}

export const GRADE_THRESHOLDS: Record<Grade, { min: number; color: string; label: string }> = {
  A: { min: 90, color: "#10b981", label: "Excellent" },
  B: { min: 75, color: "#3b82f6", label: "Good" },
  C: { min: 60, color: "#f59e0b", label: "Moderate Risk" },
  D: { min: 40, color: "#f97316", label: "High Risk" },
  F: { min: 0, color: "#ef4444", label: "Critical Risk" },
};

export function scoreToGrade(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

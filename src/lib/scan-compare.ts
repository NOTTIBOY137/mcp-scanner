import { db } from "@/lib/db";
import { scans, findings } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface FindingSummary {
  ruleId: string;
  filePath: string;
  severity: string;
  title: string;
}

export interface ScanComparison {
  oldScan: {
    id: string;
    grade: string | null;
    score: number | null;
    findingsCount: number | null;
    createdAt: Date;
  };
  newScan: {
    id: string;
    grade: string | null;
    score: number | null;
    findingsCount: number | null;
    createdAt: Date;
  };
  scoreDelta: number;
  gradeChanged: boolean;
  newFindings: FindingSummary[];
  fixedFindings: FindingSummary[];
}

export async function compareScanResults(
  oldScanId: string,
  newScanId: string
): Promise<ScanComparison | null> {
  const [oldScan, newScan] = await Promise.all([
    db.query.scans.findFirst({ where: eq(scans.id, oldScanId) }),
    db.query.scans.findFirst({ where: eq(scans.id, newScanId) }),
  ]);

  if (!oldScan || !newScan) return null;

  const [oldFindings, newFindings] = await Promise.all([
    db.select().from(findings).where(eq(findings.scanId, oldScanId)),
    db.select().from(findings).where(eq(findings.scanId, newScanId)),
  ]);

  // Match findings by ruleId + filePath
  const oldSet = new Set(oldFindings.map((f) => `${f.ruleId}::${f.filePath}`));
  const newSet = new Set(newFindings.map((f) => `${f.ruleId}::${f.filePath}`));

  const newFindingsList: FindingSummary[] = newFindings
    .filter((f) => !oldSet.has(`${f.ruleId}::${f.filePath}`))
    .map((f) => ({
      ruleId: f.ruleId,
      filePath: f.filePath,
      severity: f.severity,
      title: f.title,
    }));

  const fixedFindingsList: FindingSummary[] = oldFindings
    .filter((f) => !newSet.has(`${f.ruleId}::${f.filePath}`))
    .map((f) => ({
      ruleId: f.ruleId,
      filePath: f.filePath,
      severity: f.severity,
      title: f.title,
    }));

  return {
    oldScan: {
      id: oldScan.id,
      grade: oldScan.grade,
      score: oldScan.score,
      findingsCount: oldScan.findingsCount,
      createdAt: oldScan.createdAt,
    },
    newScan: {
      id: newScan.id,
      grade: newScan.grade,
      score: newScan.score,
      findingsCount: newScan.findingsCount,
      createdAt: newScan.createdAt,
    },
    scoreDelta: (newScan.score ?? 0) - (oldScan.score ?? 0),
    gradeChanged: oldScan.grade !== newScan.grade,
    newFindings: newFindingsList,
    fixedFindings: fixedFindingsList,
  };
}

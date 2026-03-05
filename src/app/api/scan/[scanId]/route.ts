import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scans, findings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCachedScanResult, cacheScanResult } from "@/lib/redis";
import type { ScanResponse, RuleMatch, VulnCategory, Severity, Confidence } from "@/types/scan";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await params;

  // Check Redis cache first
  try {
    const cached = await getCachedScanResult<ScanResponse>(scanId);
    if (cached && cached.status === "completed") {
      return NextResponse.json(cached);
    }
  } catch {
    // Cache miss, continue to DB
  }

  const scan = await db.query.scans.findFirst({
    where: eq(scans.id, scanId),
  });

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  const response: ScanResponse = {
    id: scan.id,
    status: scan.status as ScanResponse["status"],
    grade: scan.grade ?? undefined,
    score: scan.score ?? undefined,
    filesScanned: scan.filesScanned ?? undefined,
    findingsCount: scan.findingsCount ?? undefined,
    categoryScores: scan.categoryScores as ScanResponse["categoryScores"],
    error: scan.errorMessage ?? undefined,
  };

  if (scan.status === "completed") {
    const scanFindings = await db.query.findings.findMany({
      where: eq(findings.scanId, scanId),
    });

    response.findings = scanFindings.map((f) => ({
      ruleId: f.ruleId,
      category: f.category as VulnCategory,
      severity: f.severity as Severity,
      title: f.title,
      description: f.description,
      filePath: f.filePath,
      lineNumber: f.lineNumber ?? 0,
      snippet: f.snippet ?? "",
      confidence: f.confidence as Confidence,
    })) satisfies RuleMatch[];

    // Cache the completed result
    cacheScanResult(scanId, response).catch(() => {});
  }

  return NextResponse.json(response);
}

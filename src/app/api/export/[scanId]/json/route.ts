import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scans, findings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await params;

  const scan = await db.query.scans.findFirst({
    where: eq(scans.id, scanId),
  });

  if (!scan || scan.status !== "completed") {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  const scanFindings = await db.query.findings.findMany({
    where: eq(findings.scanId, scanId),
  });

  const payload = {
    scan: {
      id: scan.id,
      status: scan.status,
      grade: scan.grade,
      score: scan.score,
      filesScanned: scan.filesScanned,
      findingsCount: scan.findingsCount,
      duration: scan.duration,
      completedAt: scan.completedAt,
    },
    findings: scanFindings.map((f) => ({
      ruleId: f.ruleId,
      category: f.category,
      severity: f.severity,
      title: f.title,
      description: f.description,
      filePath: f.filePath,
      lineNumber: f.lineNumber,
      snippet: f.snippet,
      confidence: f.confidence,
    })),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="scan-${scanId}.json"`,
    },
  });
}

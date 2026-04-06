import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { scans, findings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { OWASP_MCP_TOP_10, CATEGORY_TO_OWASP } from "@/scanner/owasp-mapping";
import type { VulnCategory } from "@/types/scan";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await params;

  const scan = await db.query.scans.findFirst({
    where: eq(scans.id, scanId),
  });

  if (!scan || scan.status !== "completed") {
    return NextResponse.json({ error: "Scan not found or not completed" }, { status: 404 });
  }

  const scanFindings = await db
    .select()
    .from(findings)
    .where(eq(findings.scanId, scanId));

  const report = OWASP_MCP_TOP_10.map((owasp) => {
    const related = scanFindings.filter((f) => {
      const mapped = CATEGORY_TO_OWASP[f.category as VulnCategory];
      return mapped === owasp.id;
    });

    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const f of related) {
      const sev = f.severity as keyof typeof severityCounts;
      if (sev in severityCounts) severityCounts[sev]++;
    }

    return {
      id: owasp.id,
      title: owasp.title,
      description: owasp.description,
      compliant: related.length === 0,
      findingsCount: related.length,
      severityBreakdown: severityCounts,
      findings: related.map((f) => ({
        ruleId: f.ruleId,
        title: f.title,
        severity: f.severity,
        filePath: f.filePath,
        lineNumber: f.lineNumber,
        cweIds: f.cweIds,
      })),
    };
  });

  const compliantCount = report.filter((r) => r.compliant).length;

  return NextResponse.json({
    scanId,
    grade: scan.grade,
    score: scan.score,
    generatedAt: new Date().toISOString(),
    framework: "OWASP MCP Top 10",
    compliancePercentage: Math.round((compliantCount / 10) * 100),
    categories: report,
  });
}

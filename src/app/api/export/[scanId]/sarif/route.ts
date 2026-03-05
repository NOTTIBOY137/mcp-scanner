import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scans, findings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function mapSeverity(severity: string): string {
  switch (severity) {
    case "critical":
    case "high":
      return "error";
    case "medium":
      return "warning";
    default:
      return "note";
  }
}

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

  // Build unique rules
  const ruleMap = new Map<
    string,
    { id: string; shortDescription: string; fullDescription: string }
  >();
  for (const f of scanFindings) {
    if (!ruleMap.has(f.ruleId)) {
      ruleMap.set(f.ruleId, {
        id: f.ruleId,
        shortDescription: f.title,
        fullDescription: f.description,
      });
    }
  }

  const rules = Array.from(ruleMap.values()).map((r) => ({
    id: r.id,
    shortDescription: { text: r.shortDescription },
    fullDescription: { text: r.fullDescription },
  }));

  // Build results
  const results = scanFindings.map((f) => ({
    ruleId: f.ruleId,
    level: mapSeverity(f.severity),
    message: { text: f.description },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: f.filePath },
          region: { startLine: f.lineNumber ?? 1 },
        },
      },
    ],
  }));

  // Build unique artifacts
  const uniquePaths = [...new Set(scanFindings.map((f) => f.filePath))];
  const artifacts = uniquePaths.map((p) => ({ location: { uri: p } }));

  const sarif = {
    $schema:
      "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/sarif-2.1/schema/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "MCP Scanner",
            version: "1.0.0",
            rules,
          },
        },
        results,
        artifacts,
      },
    ],
  };

  return new NextResponse(JSON.stringify(sarif, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/sarif+json",
      "Content-Disposition": `attachment; filename="scan-${scanId}.sarif.json"`,
    },
  });
}

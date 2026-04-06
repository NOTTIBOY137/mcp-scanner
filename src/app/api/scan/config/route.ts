import { NextResponse } from "next/server";
import { z } from "zod";
import { scanMcpConfig } from "@/scanner/config-scanner";

const schema = z.object({
  config: z.string().min(1, "Config JSON is required"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const findings = scanMcpConfig(parsed.data.config);

  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) {
    severityCounts[f.severity]++;
  }

  return NextResponse.json({
    findingsCount: findings.length,
    severityBreakdown: severityCounts,
    findings,
  });
}

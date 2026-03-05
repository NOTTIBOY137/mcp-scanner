import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { compareScanResults } from "@/lib/scan-compare";

export async function GET(request: NextRequest) {
  const oldScanId = request.nextUrl.searchParams.get("oldScanId");
  const newScanId = request.nextUrl.searchParams.get("newScanId");

  if (!oldScanId || !newScanId) {
    return NextResponse.json(
      { error: "Missing oldScanId or newScanId query parameters" },
      { status: 400 }
    );
  }

  const comparison = await compareScanResults(oldScanId, newScanId);
  if (!comparison) {
    return NextResponse.json(
      { error: "One or both scans not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(comparison);
}

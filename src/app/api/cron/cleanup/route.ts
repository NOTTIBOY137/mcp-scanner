import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scans, findings } from "@/db/schema";
import { lt, inArray, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    // Find old scans
    const oldScans = await db
      .select({ id: scans.id })
      .from(scans)
      .where(lt(scans.createdAt, cutoff))
      .limit(500);

    if (oldScans.length === 0) {
      return NextResponse.json({ message: "No old scans to clean up", deleted: 0 });
    }

    const scanIds = oldScans.map((s) => s.id);

    // Delete findings first (FK constraint)
    await db.delete(findings).where(inArray(findings.scanId, scanIds));

    // Delete old scans
    const result = await db.delete(scans).where(inArray(scans.id, scanIds));

    return NextResponse.json({
      message: "Cleanup complete",
      deleted: scanIds.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cleanup failed" },
      { status: 500 }
    );
  }
}

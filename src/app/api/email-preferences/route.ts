import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { emailPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(emailPreferences)
    .where(eq(emailPreferences.clerkUserId, userId))
    .limit(1);

  if (rows.length === 0) {
    // Upsert defaults
    const id = createId();
    await db.insert(emailPreferences).values({
      id,
      clerkUserId: userId,
      scanAlerts: true,
      marketingEmails: false,
    });
    return NextResponse.json({ scanAlerts: true, marketingEmails: false });
  }

  return NextResponse.json({
    scanAlerts: rows[0].scanAlerts,
    marketingEmails: rows[0].marketingEmails,
  });
}

export async function PUT(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.scanAlerts === "boolean") updates.scanAlerts = body.scanAlerts;
  if (typeof body.marketingEmails === "boolean") updates.marketingEmails = body.marketingEmails;

  // Upsert: check if row exists
  const existing = await db
    .select()
    .from(emailPreferences)
    .where(eq(emailPreferences.clerkUserId, userId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(emailPreferences).values({
      id: createId(),
      clerkUserId: userId,
      scanAlerts: body.scanAlerts ?? true,
      marketingEmails: body.marketingEmails ?? false,
    });
  } else {
    await db
      .update(emailPreferences)
      .set(updates)
      .where(eq(emailPreferences.clerkUserId, userId));
  }

  const row = await db
    .select()
    .from(emailPreferences)
    .where(eq(emailPreferences.clerkUserId, userId))
    .limit(1);

  return NextResponse.json({
    scanAlerts: row[0].scanAlerts,
    marketingEmails: row[0].marketingEmails,
  });
}

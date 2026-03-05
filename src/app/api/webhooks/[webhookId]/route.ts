import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { webhooks, webhookDeliveries } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { webhookId } = await params;

  const wh = await db
    .select()
    .from(webhooks)
    .where(and(eq(webhooks.id, webhookId), eq(webhooks.clerkUserId, userId)))
    .limit(1);

  if (wh.length === 0) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  const deliveries = await db
    .select()
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.webhookId, webhookId))
    .orderBy(desc(webhookDeliveries.createdAt))
    .limit(10);

  const { secret: _, ...safe } = wh[0];
  return NextResponse.json({ ...safe, deliveries });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { webhookId } = await params;

  const wh = await db
    .select()
    .from(webhooks)
    .where(and(eq(webhooks.id, webhookId), eq(webhooks.clerkUserId, userId)))
    .limit(1);

  if (wh.length === 0) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.url === "string") updates.url = body.url;
  if (Array.isArray(body.events)) updates.events = body.events;
  if (typeof body.active === "boolean") updates.active = body.active;

  await db
    .update(webhooks)
    .set(updates)
    .where(eq(webhooks.id, webhookId));

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { webhookId } = await params;

  const wh = await db
    .select()
    .from(webhooks)
    .where(and(eq(webhooks.id, webhookId), eq(webhooks.clerkUserId, userId)))
    .limit(1);

  if (wh.length === 0) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  await db.delete(webhooks).where(eq(webhooks.id, webhookId));
  return NextResponse.json({ success: true });
}

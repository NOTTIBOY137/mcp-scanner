import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { apiKeys } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateApiKey, hashApiKey } from "@/lib/api-keys";
import { getUserSubscription, getEffectivePlan } from "@/lib/subscriptions";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check key count (max 3)
  const existing = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.clerkUserId, userId));

  if (existing.length >= 3) {
    return NextResponse.json(
      { error: "Maximum 3 API keys allowed. Revoke an existing key first." },
      { status: 400 }
    );
  }

  const { raw, hash, prefix } = await generateApiKey();

  await db.insert(apiKeys).values({
    id: createId(),
    clerkUserId: userId,
    keyHash: hash,
    keyPrefix: prefix,
    name: `Key ${existing.length + 1}`,
    plan: getEffectivePlan(await getUserSubscription(userId)),
  });

  // Return the raw key — this is the only time it's visible
  return NextResponse.json({ key: raw, prefix });
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing key id" }, { status: 400 });
  }

  const deleted = await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.clerkUserId, userId)));

  if ((deleted as any).rowCount === 0) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

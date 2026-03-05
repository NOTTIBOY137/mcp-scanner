import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { serverClaims, servers, apiKeys } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getPlanLimits } from "@/lib/api-keys";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const serverId = body?.serverId;
  if (!serverId || typeof serverId !== "string") {
    return NextResponse.json({ error: "Missing serverId" }, { status: 400 });
  }

  // Verify server exists
  const server = await db.query.servers.findFirst({
    where: eq(servers.id, serverId),
  });
  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  // Check if already claimed by anyone (verified)
  const existingVerified = await db
    .select()
    .from(serverClaims)
    .where(
      and(eq(serverClaims.serverId, serverId), eq(serverClaims.verified, true))
    )
    .limit(1);

  if (existingVerified.length > 0) {
    return NextResponse.json(
      { error: "This server has already been claimed." },
      { status: 409 }
    );
  }

  // Enforce per-plan claim limits
  const userKey = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.clerkUserId, userId))
    .limit(1);
  const plan = userKey.length > 0 ? (userKey[0].plan ?? "free") : "free";
  const limits = getPlanLimits(plan);

  const verifiedClaims = await db
    .select()
    .from(serverClaims)
    .where(
      and(
        eq(serverClaims.clerkUserId, userId),
        eq(serverClaims.verified, true)
      )
    );

  if (verifiedClaims.length >= limits.maxClaims) {
    return NextResponse.json(
      {
        error: `Claim limit reached. Your ${plan} plan allows ${limits.maxClaims} verified claim(s). Upgrade to claim more servers.`,
      },
      { status: 403 }
    );
  }

  // Check if this user already has a pending claim
  const existingPending = await db
    .select()
    .from(serverClaims)
    .where(
      and(
        eq(serverClaims.serverId, serverId),
        eq(serverClaims.clerkUserId, userId)
      )
    )
    .limit(1);

  if (existingPending.length > 0) {
    return NextResponse.json({
      token: existingPending[0].verificationToken,
      owner: server.owner,
      repo: server.repo,
    });
  }

  const token = `mcptrust-verify-${createId()}`;

  await db.insert(serverClaims).values({
    id: createId(),
    serverId,
    clerkUserId: userId,
    verificationToken: token,
  });

  // Send verification email (best-effort)
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.emailAddresses?.[0]?.emailAddress;
    if (email) {
      const { sendClaimVerificationEmail } = await import("@/lib/email");
      await sendClaimVerificationEmail(email, {
        token,
        owner: server.owner,
        repo: server.repo,
      });
    }
  } catch {
    // Email failure should not block the claim
  }

  return NextResponse.json({
    token,
    owner: server.owner,
    repo: server.repo,
  });
}

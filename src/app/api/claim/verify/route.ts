import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { serverClaims, servers } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

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

  // Get the user's pending claim
  const claim = await db
    .select()
    .from(serverClaims)
    .where(
      and(
        eq(serverClaims.serverId, serverId),
        eq(serverClaims.clerkUserId, userId),
        eq(serverClaims.verified, false)
      )
    )
    .limit(1);

  if (claim.length === 0) {
    return NextResponse.json(
      { error: "No pending claim found for this server." },
      { status: 404 }
    );
  }

  // Get the server to fetch owner/repo
  const server = await db.query.servers.findFirst({
    where: eq(servers.id, serverId),
  });
  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  // Fetch .mcptrust file from GitHub
  const githubToken = process.env.GITHUB_TOKEN;
  try {
    const res = await fetch(
      `https://api.github.com/repos/${server.owner}/${server.repo}/contents/.mcptrust`,
      {
        headers: {
          Accept: "application/vnd.github.v3.raw",
          ...(githubToken
            ? { Authorization: `Bearer ${githubToken}` }
            : {}),
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            "Could not find .mcptrust file in the repository. Make sure it exists in the repo root.",
        },
        { status: 400 }
      );
    }

    const content = (await res.text()).trim();
    if (content !== claim[0].verificationToken) {
      return NextResponse.json(
        {
          error:
            "Verification token does not match. Check that the .mcptrust file contains the exact token.",
        },
        { status: 400 }
      );
    }

    // Verified!
    await db
      .update(serverClaims)
      .set({ verified: true, verifiedAt: sql`now()` })
      .where(eq(serverClaims.id, claim[0].id));

    return NextResponse.json({ verified: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to verify. Please try again." },
      { status: 500 }
    );
  }
}

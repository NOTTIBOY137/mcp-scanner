import { NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { servers, scans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { runScanInBackground } from "@/lib/scan-runner";

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

  const server = await db.query.servers.findFirst({
    where: eq(servers.id, serverId),
  });

  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  const scanId = createId();

  await db.insert(scans).values({
    id: scanId,
    serverId,
    status: "pending",
  });

  after(() =>
    runScanInBackground({
      scanId,
      serverId,
      owner: server.owner,
      repo: server.repo,
    })
  );

  return NextResponse.json({ id: scanId, status: "pending" });
}

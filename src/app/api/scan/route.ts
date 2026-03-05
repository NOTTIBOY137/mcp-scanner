import { NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { servers, scans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parseGithubUrl } from "@/lib/github";
import { runScanInBackground } from "@/lib/scan-runner";

const scanRequestSchema = z.object({
  repoUrl: z.string().min(1, "Repository URL is required"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = scanRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  let owner: string;
  let repo: string;
  try {
    ({ owner, repo } = parseGithubUrl(parsed.data.repoUrl));
  } catch {
    return NextResponse.json(
      { error: "Invalid GitHub URL" },
      { status: 400 }
    );
  }

  const repoUrl = `https://github.com/${owner}/${repo}`;
  const scanId = createId();
  const serverId = createId();

  // Upsert server
  const existing = await db.query.servers.findFirst({
    where: eq(servers.repoUrl, repoUrl),
  });

  const actualServerId = existing?.id ?? serverId;

  if (!existing) {
    await db.insert(servers).values({
      id: serverId,
      name: repo,
      repoUrl,
      owner,
      repo,
    });
  }

  // Create scan record
  await db.insert(scans).values({
    id: scanId,
    serverId: actualServerId,
    status: "pending",
  });

  // Run scan in background using after()
  after(() =>
    runScanInBackground({
      scanId,
      serverId: actualServerId,
      owner,
      repo,
    })
  );

  return NextResponse.json({ id: scanId, status: "pending" });
}

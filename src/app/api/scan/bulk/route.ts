import { NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { servers, scans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parseGithubUrl } from "@/lib/github";
import { runScanInBackground } from "@/lib/scan-runner";

const schema = z.object({
  repoUrls: z.array(z.string().min(1)).min(1).max(20),
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

  const results: { repoUrl: string; scanId?: string; error?: string }[] = [];

  for (const repoUrl of parsed.data.repoUrls) {
    let owner: string;
    let repo: string;
    try {
      ({ owner, repo } = parseGithubUrl(repoUrl));
    } catch {
      results.push({ repoUrl, error: "Invalid GitHub URL" });
      continue;
    }

    const normalizedUrl = `https://github.com/${owner}/${repo}`;
    const scanId = createId();
    const serverId = createId();

    const existing = await db.query.servers.findFirst({
      where: eq(servers.repoUrl, normalizedUrl),
    });

    const actualServerId = existing?.id ?? serverId;

    if (!existing) {
      await db.insert(servers).values({
        id: serverId,
        name: repo,
        repoUrl: normalizedUrl,
        owner,
        repo,
      });
    }

    await db.insert(scans).values({
      id: scanId,
      serverId: actualServerId,
      status: "pending",
    });

    after(() =>
      runScanInBackground({
        scanId,
        serverId: actualServerId,
        owner,
        repo,
      })
    );

    results.push({ repoUrl: normalizedUrl, scanId });
  }

  return NextResponse.json({ scans: results });
}

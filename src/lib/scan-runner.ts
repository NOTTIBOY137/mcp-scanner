import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import {
  servers,
  scans,
  findings,
  toolHashes,
  serverClaims,
  emailPreferences,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getRepoTree, batchFetchFiles, getRepoInfo } from "@/lib/github";
import { scanFiles } from "@/scanner/engine";
import { allRules } from "@/scanner/rules";
import { calculateGrade } from "@/scanner/grader";
import { detectToolDefinitions } from "@/scanner/hasher";
import { cacheScanResult } from "@/lib/redis";
import { deliverWebhooks } from "@/lib/webhooks";
import { sendScanCompletionEmail } from "@/lib/email";
import { createLogger } from "@/lib/logger";

const log = createLogger("scan-runner");

export async function runScanInBackground(params: {
  scanId: string;
  serverId: string;
  owner: string;
  repo: string;
}): Promise<void> {
  const { scanId, serverId, owner, repo } = params;
  const startTime = Date.now();
  log.info("Scan started", { scanId, serverId, owner, repo });

  try {
    await db.update(scans).set({ status: "scanning" }).where(eq(scans.id, scanId));

    const repoInfo = await getRepoInfo(owner, repo);

    await db
      .update(servers)
      .set({
        name: repoInfo.name,
        description: repoInfo.description,
        stars: repoInfo.stars,
        language: repoInfo.language,
        updatedAt: new Date(),
      })
      .where(eq(servers.id, serverId));

    const tree = await getRepoTree(owner, repo);
    const paths = tree.map((t) => t.path);

    const mcpIndicators = paths.some(
      (p) =>
        p === "server.json" ||
        p.includes("mcp-server") ||
        p.includes("mcp_server")
    );

    const fileContents = await batchFetchFiles(owner, repo, paths);

    const isMcpServer =
      mcpIndicators ||
      fileContents.some((f) => {
        const c = f.content;
        return (
          c.includes("@modelcontextprotocol/sdk") ||
          c.includes("mcp-framework") ||
          c.includes("McpServer") ||
          (c.includes("MCP") &&
            (c.includes("registerTool") ||
              c.includes("server.tool") ||
              c.includes("server.resource"))) ||
          (c.includes('"mcp"') &&
            (f.path.endsWith("package.json") || f.path.endsWith("pyproject.toml")))
        );
      });

    await db
      .update(servers)
      .set({ isVerified: isMcpServer })
      .where(eq(servers.id, serverId));

    const matches = scanFiles(fileContents, allRules);

    await db.update(scans).set({ status: "grading" }).where(eq(scans.id, scanId));
    const gradeResult = calculateGrade(matches);

    if (matches.length > 0) {
      await db.insert(findings).values(
        matches.map((m) => ({
          id: createId(),
          scanId,
          ruleId: m.ruleId,
          category: m.category,
          severity: m.severity,
          title: m.title,
          description: m.description,
          filePath: m.filePath,
          lineNumber: m.lineNumber,
          snippet: m.snippet.slice(0, 500),
          confidence: m.confidence,
          owaspMcpTop10: m.owaspMcpTop10,
          cweIds: m.cweIds,
        }))
      );
    }

    for (const file of fileContents) {
      const tools = detectToolDefinitions(file.content);
      if (tools.length > 0) {
        await db.insert(toolHashes).values(
          tools.map((t) => ({
            id: createId(),
            serverId,
            toolName: t.name,
            hash: t.hash,
            scanId,
          }))
        );
      }
    }

    const duration = Date.now() - startTime;

    await db
      .update(scans)
      .set({
        status: "completed",
        grade: gradeResult.grade,
        score: gradeResult.score,
        filesScanned: fileContents.length,
        findingsCount: matches.length,
        categoryScores: gradeResult.categoryScores,
        owaspCompliance: gradeResult.owaspCompliance,
        compliancePercentage: gradeResult.compliancePercentage,
        duration,
        completedAt: new Date(),
      })
      .where(eq(scans.id, scanId));

    await db
      .update(servers)
      .set({
        latestGrade: gradeResult.grade,
        latestScore: gradeResult.score,
        latestScanId: scanId,
        updatedAt: new Date(),
      })
      .where(eq(servers.id, serverId));

    log.info("Scan completed", { scanId, grade: gradeResult.grade, score: gradeResult.score, findings: matches.length, duration });

    await cacheScanResult(scanId, {
      id: scanId,
      status: "completed",
      grade: gradeResult.grade,
      score: gradeResult.score,
      filesScanned: fileContents.length,
      findingsCount: matches.length,
      categoryScores: gradeResult.categoryScores,
      findings: matches,
      owaspCompliance: gradeResult.owaspCompliance,
      compliancePercentage: gradeResult.compliancePercentage,
    }).catch((err) => log.error("Failed to cache scan result", { error: String(err) }));

    // Deliver webhooks
    deliverWebhooks("scan.completed", {
      scanId,
      serverId,
      grade: gradeResult.grade,
      score: gradeResult.score,
      findingsCount: matches.length,
    }).catch((err) => log.error("Failed to deliver webhooks", { error: String(err) }));

    // Send email to claimed owners with scan alerts enabled
    sendScanAlertEmails(serverId, {
      serverName: repoInfo.name ?? `${owner}/${repo}`,
      grade: gradeResult.grade,
      score: gradeResult.score,
      scanId,
    }).catch((err) => log.error("Failed to send scan alert emails", { error: String(err) }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error("Scan failed", { scanId, error: message });
    await db
      .update(scans)
      .set({
        status: "failed",
        errorMessage: message,
        duration: Date.now() - startTime,
        completedAt: new Date(),
      })
      .where(eq(scans.id, scanId));

    deliverWebhooks("scan.failed", { scanId, serverId }).catch((err) => log.error("Failed to deliver webhooks", { error: String(err) }));
  }
}

async function sendScanAlertEmails(
  serverId: string,
  data: { serverName: string; grade: string; score: number; scanId: string }
): Promise<void> {
  const claims = await db
    .select()
    .from(serverClaims)
    .where(
      and(eq(serverClaims.serverId, serverId), eq(serverClaims.verified, true))
    );

  for (const claim of claims) {
    // Check if user has scan alerts enabled
    const prefs = await db
      .select()
      .from(emailPreferences)
      .where(eq(emailPreferences.clerkUserId, claim.clerkUserId))
      .limit(1);

    const scanAlerts = prefs.length === 0 ? true : prefs[0].scanAlerts;
    if (!scanAlerts) continue;

    // Get user email from Clerk
    try {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      const user = await client.users.getUser(claim.clerkUserId);
      const email = user.emailAddresses?.[0]?.emailAddress;
      if (email) {
        await sendScanCompletionEmail(email, data);
      }
    } catch {
      // Email sending is best-effort
    }
  }
}

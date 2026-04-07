import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { webhooks, webhookDeliveries, serverClaims } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createLogger } from "@/lib/logger";

const log = createLogger("webhooks");

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function signPayload(payload: string, secret: string): string {
  const encoder = new TextEncoder();
  // Use Node.js crypto for HMAC since Web Crypto is async
  const crypto = require("crypto");
  return crypto
    .createHmac("sha256", secret)
    .update(encoder.encode(payload))
    .digest("hex");
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: {
    scanId?: string;
    serverId?: string;
    grade?: string;
    score?: number;
    findingsCount?: number;
    reportUrl?: string;
  };
}

export async function deliverWebhooks(
  event: string,
  scanData: {
    scanId?: string;
    serverId?: string;
    grade?: string;
    score?: number;
    findingsCount?: number;
  }
): Promise<void> {
  if (!scanData.serverId) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mcptrust.dev";

  // Find claimed server owners
  const claims = await db
    .select()
    .from(serverClaims)
    .where(
      and(
        eq(serverClaims.serverId, scanData.serverId),
        eq(serverClaims.verified, true)
      )
    );

  if (claims.length === 0) return;

  const ownerIds = claims.map((c) => c.clerkUserId);

  // Find active webhooks for these owners that subscribe to this event
  for (const ownerId of ownerIds) {
    const userWebhooks = await db
      .select()
      .from(webhooks)
      .where(and(eq(webhooks.clerkUserId, ownerId), eq(webhooks.active, true)));

    for (const wh of userWebhooks) {
      const events = (wh.events as string[]) ?? ["scan.completed", "scan.failed"];
      if (!events.includes(event)) continue;

      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data: {
          ...scanData,
          reportUrl: scanData.scanId ? `${appUrl}/results/${scanData.scanId}` : undefined,
        },
      };

      const payloadStr = JSON.stringify(payload);
      const signature = signPayload(payloadStr, wh.secret);

      const deliveryId = createId();
      let statusCode: number | null = null;
      let attempts = 0;
      const maxAttempts = 3;
      const backoffDelays = [0, 1000, 5000];

      while (attempts < maxAttempts) {
        if (attempts > 0) {
          await sleep(backoffDelays[attempts]);
        }
        attempts++;
        log.info("Webhook delivery attempt", { webhookId: wh.id, attempt: attempts, url: wh.url });
        try {
          const res = await fetch(wh.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Signature": signature,
              "X-Webhook-Event": event,
            },
            body: payloadStr,
            signal: AbortSignal.timeout(10000),
          });
          statusCode = res.status;
          if (res.ok) {
            log.info("Webhook delivered successfully", { webhookId: wh.id, statusCode });
            break;
          }
          log.warn("Webhook delivery failed", { webhookId: wh.id, statusCode, attempt: attempts });
        } catch (err) {
          statusCode = 0;
          log.warn("Webhook delivery error", { webhookId: wh.id, attempt: attempts, error: String(err) });
        }
      }

      if (statusCode !== null && (statusCode < 200 || statusCode >= 300)) {
        log.error("Webhook delivery exhausted retries", { webhookId: wh.id, attempts, lastStatusCode: statusCode });
      }

      // Log delivery
      await db.insert(webhookDeliveries).values({
        id: deliveryId,
        webhookId: wh.id,
        event,
        payload,
        statusCode,
        attempts,
        lastAttemptAt: new Date(),
      });
    }
  }
}

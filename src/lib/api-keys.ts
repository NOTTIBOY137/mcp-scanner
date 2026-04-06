import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { apiKeys } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function generateApiKey(): Promise<{ raw: string; hash: string; prefix: string }> {
  const raw = `mcp_${createId()}${createId()}`;
  const hash = await hashApiKey(raw);
  const prefix = raw.slice(0, 12);
  return { raw, hash, prefix };
}

export async function hashApiKey(raw: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function validateApiKey(
  raw: string
): Promise<{ userId: string; plan: string } | null> {
  const hash = await hashApiKey(raw);
  const results = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, hash))
    .limit(1);

  if (results.length === 0) return null;

  const key = results[0];

  // Update lastUsedAt (fire-and-forget)
  db.update(apiKeys)
    .set({ lastUsedAt: sql`now()` })
    .where(eq(apiKeys.id, key.id))
    .catch(() => {});

  return { userId: key.clerkUserId, plan: key.plan ?? "free" };
}

export type PlanLimits = { daily: number; maxClaims: number };

export function getPlanLimits(_plan?: string): PlanLimits {
  // All features are free — everyone gets top-tier limits
  return { daily: 10_000, maxClaims: 100 };
}

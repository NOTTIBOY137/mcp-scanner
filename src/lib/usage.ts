import { Redis } from "@upstash/redis";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { apiUsage } from "@/db/schema";
import { createLogger } from "@/lib/logger";

const log = createLogger("usage");

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      log.warn("Redis not configured — usage tracking disabled");
      return null;
    }
    redis = new Redis({ url, token });
  }
  return redis;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function usageKey(userId: string, date: string, endpoint: string): string {
  return `usage:${userId}:${date}:${endpoint}`;
}

export async function incrementUsage(
  userId: string,
  endpoint: string
): Promise<void> {
  try {
    const r = getRedis();
    if (!r) return;
    const key = usageKey(userId, todayStr(), endpoint);
    await r.incr(key);
    await r.expire(key, 48 * 60 * 60);
  } catch (err) {
    log.warn("Failed to increment usage", { error: String(err) });
  }
}

export async function getTodayUsage(
  userId: string
): Promise<{ total: number; byEndpoint: Record<string, number> }> {
  const r = getRedis();
  if (!r) return { total: 0, byEndpoint: {} };

  const prefix = `usage:${userId}:${todayStr()}:`;
  const byEndpoint: Record<string, number> = {};
  let total = 0;
  let cursor = 0;

  try {
    do {
      const [nextCursor, keys] = await r.scan(cursor, {
        match: `${prefix}*`,
        count: 100,
      });
      cursor = typeof nextCursor === "string" ? parseInt(nextCursor, 10) : nextCursor;

      for (const key of keys) {
        const val = await r.get<number>(key);
        const count = val ?? 0;
        const endpoint = (key as string).replace(prefix, "");
        byEndpoint[endpoint] = count;
        total += count;
      }
    } while (cursor !== 0);
  } catch (err) {
    log.warn("Failed to get usage", { error: String(err) });
  }

  return { total, byEndpoint };
}

export async function flushUsageToPostgres(): Promise<number> {
  const r = getRedis();
  if (!r) return 0;

  let flushed = 0;
  let cursor = 0;

  try {
    do {
      const [nextCursor, keys] = await r.scan(cursor, {
        match: "usage:*",
        count: 100,
      });
      cursor = typeof nextCursor === "string" ? parseInt(nextCursor, 10) : nextCursor;

      for (const key of keys) {
        const val = await r.get<number>(key);
        if (val == null || val === 0) continue;

        const parts = (key as string).split(":");
        if (parts.length < 4) continue;

        const userId = parts[1];
        const date = parts[2];
        const endpoint = parts.slice(3).join(":");

        await db.insert(apiUsage).values({
          id: createId(),
          clerkUserId: userId,
          date,
          endpoint,
          count: val,
        });

        await r.del(key as string);
        flushed++;
      }
    } while (cursor !== 0);
  } catch (err) {
    log.error("Failed to flush usage", { error: String(err) });
  }

  return flushed;
}

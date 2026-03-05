import { Redis } from "@upstash/redis";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { apiUsage } from "@/db/schema";

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
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
  const key = usageKey(userId, todayStr(), endpoint);
  const r = getRedis();
  await r.incr(key);
  await r.expire(key, 48 * 60 * 60); // 48h TTL
}

export async function getTodayUsage(
  userId: string
): Promise<{ total: number; byEndpoint: Record<string, number> }> {
  const r = getRedis();
  const prefix = `usage:${userId}:${todayStr()}:`;
  const byEndpoint: Record<string, number> = {};
  let total = 0;
  let cursor = 0;

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

  return { total, byEndpoint };
}

export async function flushUsageToPostgres(): Promise<number> {
  const r = getRedis();
  let flushed = 0;
  let cursor = 0;

  do {
    const [nextCursor, keys] = await r.scan(cursor, {
      match: "usage:*",
      count: 100,
    });
    cursor = typeof nextCursor === "string" ? parseInt(nextCursor, 10) : nextCursor;

    for (const key of keys) {
      const val = await r.get<number>(key);
      if (val == null || val === 0) continue;

      // Parse key: usage:{userId}:{date}:{endpoint}
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

  return flushed;
}

import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Lazy-initialised client (avoid importing env.ts at module level)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Scan result cache (1 hour TTL)
// ---------------------------------------------------------------------------

const SCAN_TTL_SECONDS = 60 * 60; // 1 hour

export async function cacheScanResult(
  scanId: string,
  data: unknown,
): Promise<void> {
  await getRedis().set(`scan:${scanId}`, JSON.stringify(data), {
    ex: SCAN_TTL_SECONDS,
  });
}

export async function getCachedScanResult<T>(
  scanId: string,
): Promise<T | null> {
  const raw = await getRedis().get<string>(`scan:${scanId}`);
  if (raw == null) return null;
  return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
}

// ---------------------------------------------------------------------------
// General-purpose server list cache (default 5 minute TTL)
// ---------------------------------------------------------------------------

const DEFAULT_LIST_TTL_SECONDS = 5 * 60; // 5 minutes

export async function cacheServerList(
  key: string,
  data: unknown,
  ttl: number = DEFAULT_LIST_TTL_SECONDS,
): Promise<void> {
  await getRedis().set(key, JSON.stringify(data), { ex: ttl });
}

export async function getCachedServerList<T>(
  key: string,
): Promise<T | null> {
  const raw = await getRedis().get<string>(key);
  if (raw == null) return null;
  return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
}

// ---------------------------------------------------------------------------
// Cache invalidation by pattern (SCAN + DEL)
// ---------------------------------------------------------------------------

export async function invalidateCache(pattern: string): Promise<void> {
  const client = getRedis();
  let cursor = 0;

  do {
    const [nextCursor, keys] = await client.scan(cursor, {
      match: pattern,
      count: 100,
    });
    cursor = typeof nextCursor === "string" ? parseInt(nextCursor, 10) : nextCursor;

    if (keys.length > 0) {
      const pipeline = client.pipeline();
      for (const key of keys) {
        pipeline.del(key);
      }
      await pipeline.exec();
    }
  } while (cursor !== 0);
}

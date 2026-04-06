import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Lazy Redis factory (avoid importing env.ts at module level)
// ---------------------------------------------------------------------------

function createRedis(): Redis {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

// ---------------------------------------------------------------------------
// Scan endpoint: 5 scans per hour per identifier (IP)
// ---------------------------------------------------------------------------

export const scanRateLimit = new Ratelimit({
  redis: createRedis(),
  limiter: Ratelimit.slidingWindow(30, "1 h"),
  prefix: "ratelimit:scan",
});

// ---------------------------------------------------------------------------
// API endpoint: 60 requests per minute per identifier (IP)
// ---------------------------------------------------------------------------

export const apiRateLimit = new Ratelimit({
  redis: createRedis(),
  limiter: Ratelimit.slidingWindow(300, "1 m"),
  prefix: "ratelimit:api",
});

// ---------------------------------------------------------------------------
// API v1 endpoint: daily sliding window per API key or IP
// ---------------------------------------------------------------------------

const v1LimitCache = new Map<number, Ratelimit>();

export function createV1RateLimit(limit: number) {
  let limiter = v1LimitCache.get(limit);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: createRedis(),
      limiter: Ratelimit.slidingWindow(limit, "1 d"),
      prefix: "ratelimit:v1",
    });
    v1LimitCache.set(limit, limiter);
  }
  return limiter;
}

// Anonymous v1 rate limit: 500/day per IP
export const anonymousV1RateLimit = new Ratelimit({
  redis: createRedis(),
  limiter: Ratelimit.slidingWindow(500, "1 d"),
  prefix: "ratelimit:v1:anon",
});

// Waitlist rate limit: 3/hour per IP
export const waitlistRateLimit = new Ratelimit({
  redis: createRedis(),
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "ratelimit:waitlist",
});

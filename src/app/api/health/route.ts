import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { servers } from "@/db/schema";
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { status: string; latencyMs: number }> = {};
  let overall: "healthy" | "degraded" = "healthy";

  // Check database
  const dbStart = Date.now();
  try {
    await db.select({ id: servers.id }).from(servers).limit(1);
    checks.database = { status: "ok", latencyMs: Date.now() - dbStart };
  } catch {
    checks.database = { status: "error", latencyMs: Date.now() - dbStart };
    overall = "degraded";
  }

  // Check Redis
  const redisStart = Date.now();
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    await redis.ping();
    checks.redis = { status: "ok", latencyMs: Date.now() - redisStart };
  } catch {
    checks.redis = { status: "error", latencyMs: Date.now() - redisStart };
    overall = "degraded";
  }

  const body = {
    status: overall,
    timestamp: new Date().toISOString(),
    checks,
  };

  return NextResponse.json(body, { status: overall === "healthy" ? 200 : 503 });
}

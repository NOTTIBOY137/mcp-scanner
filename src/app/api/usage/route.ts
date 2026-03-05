import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { apiUsage } from "@/db/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { getTodayUsage } from "@/lib/usage";
import { getUserSubscription, getEffectivePlan } from "@/lib/subscriptions";
import { getPlanLimits } from "@/lib/api-keys";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = parseInt(request.nextUrl.searchParams.get("days") ?? "30", 10);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().slice(0, 10);

  // Query historical data from Postgres
  const rows = await db
    .select({
      date: apiUsage.date,
      totalCount: sql<number>`sum(${apiUsage.count})`.as("total_count"),
    })
    .from(apiUsage)
    .where(
      and(
        eq(apiUsage.clerkUserId, userId),
        gte(apiUsage.date, startDateStr)
      )
    )
    .groupBy(apiUsage.date)
    .orderBy(apiUsage.date);

  // Get today's live Redis counters
  const todayData = await getTodayUsage(userId).catch(() => ({
    total: 0,
    byEndpoint: {} as Record<string, number>,
  }));

  const todayStr = new Date().toISOString().slice(0, 10);
  const daily = rows.map((r) => ({ date: r.date, count: Number(r.totalCount) }));

  // Merge today's Redis data
  const todayEntry = daily.find((d) => d.date === todayStr);
  if (todayEntry) {
    todayEntry.count += todayData.total;
  } else if (todayData.total > 0) {
    daily.push({ date: todayStr, count: todayData.total });
  }

  // Top endpoints
  const topEndpoints = await db
    .select({
      endpoint: apiUsage.endpoint,
      totalCount: sql<number>`sum(${apiUsage.count})`.as("total_count"),
    })
    .from(apiUsage)
    .where(
      and(
        eq(apiUsage.clerkUserId, userId),
        gte(apiUsage.date, startDateStr)
      )
    )
    .groupBy(apiUsage.endpoint)
    .orderBy(desc(sql`sum(${apiUsage.count})`))
    .limit(5);

  // Merge today's Redis endpoint data
  const endpointMap = new Map(
    topEndpoints.map((e) => [e.endpoint, Number(e.totalCount)])
  );
  for (const [ep, count] of Object.entries(todayData.byEndpoint)) {
    endpointMap.set(ep, (endpointMap.get(ep) ?? 0) + count);
  }

  const mergedEndpoints = Array.from(endpointMap.entries())
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Get plan info
  const subscription = await getUserSubscription(userId);
  const plan = getEffectivePlan(subscription);
  const limits = getPlanLimits(plan);

  // Current period usage (this month)
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().slice(0, 10);
  const periodRows = await db
    .select({
      totalCount: sql<number>`sum(${apiUsage.count})`.as("total_count"),
    })
    .from(apiUsage)
    .where(
      and(
        eq(apiUsage.clerkUserId, userId),
        gte(apiUsage.date, monthStartStr)
      )
    );

  const currentPeriodUsage =
    Number(periodRows[0]?.totalCount ?? 0) + todayData.total;

  return NextResponse.json({
    daily,
    currentPeriodUsage,
    limit: limits.daily * 30,
    plan,
    topEndpoints: mergedEndpoints,
  });
}

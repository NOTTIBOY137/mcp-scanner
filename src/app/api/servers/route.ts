import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { servers } from "@/db/schema";
import { desc, ilike, eq, isNotNull, and } from "drizzle-orm";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  const grade = url.searchParams.get("grade");
  const sort = url.searchParams.get("sort") ?? "score";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(50, parseInt(url.searchParams.get("pageSize") ?? "20", 10));

  const gradeFilter = grade && ["A", "B", "C", "D", "F"].includes(grade)
    ? eq(servers.latestGrade, grade)
    : undefined;
  const queryFilter = query ? ilike(servers.name, `%${query}%`) : undefined;
  const where = and(isNotNull(servers.latestGrade), gradeFilter, queryFilter);

  const orderBy = sort === "stars"
    ? desc(servers.stars)
    : sort === "name"
      ? servers.name
      : sort === "recent"
        ? desc(servers.updatedAt)
        : desc(servers.latestScore);

  const results = await db
    .select({
      id: servers.id,
      name: servers.name,
      owner: servers.owner,
      repo: servers.repo,
      description: servers.description,
      stars: servers.stars,
      language: servers.language,
      latestGrade: servers.latestGrade,
      latestScore: servers.latestScore,
    })
    .from(servers)
    .where(where)
    .orderBy(orderBy)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return NextResponse.json({
    servers: results,
    page,
    pageSize,
    hasMore: results.length === pageSize,
  });
}

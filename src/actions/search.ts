"use server";

import { db } from "@/lib/db";
import { servers } from "@/db/schema";
import { desc, ilike, isNotNull, and } from "drizzle-orm";

export async function searchServers(query: string) {
  const results = await db
    .select({
      id: servers.id,
      name: servers.name,
      owner: servers.owner,
      repo: servers.repo,
      description: servers.description,
      stars: servers.stars,
      latestGrade: servers.latestGrade,
      latestScore: servers.latestScore,
    })
    .from(servers)
    .where(and(isNotNull(servers.latestGrade), ilike(servers.name, `%${query}%`)))
    .orderBy(desc(servers.latestScore))
    .limit(20);

  return results;
}

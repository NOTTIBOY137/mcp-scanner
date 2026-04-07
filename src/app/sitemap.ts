import { db } from "@/lib/db";
import { servers } from "@/db/schema";
import { isNotNull } from "drizzle-orm";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";

  let allServers: { id: string; updatedAt: Date }[] = [];
  try {
    allServers = await db
      .select({ id: servers.id, updatedAt: servers.updatedAt })
      .from(servers)
      .where(isNotNull(servers.latestGrade));
  } catch {
    // DB may be unavailable
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: appUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${appUrl}/scan`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${appUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${appUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${appUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${appUrl}/config-scan`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${appUrl}/bulk-scan`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${appUrl}/integrations`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${appUrl}/badges`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const serverRoutes: MetadataRoute.Sitemap = allServers.map((s) => ({
    url: `${appUrl}/server/${s.id}`,
    lastModified: s.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...serverRoutes];
}

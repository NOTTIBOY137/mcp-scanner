import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/sign-in/", "/sign-up/", "/dashboard/"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}

import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://*.clerk.accounts.dev https://*.clerk.dev; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: https://img.clerk.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com https://*.clerk.accounts.dev https://*.clerk.dev; frame-ancestors 'none';",
  },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ClerkProvider } from "@clerk/nextjs";
import { NavBar } from "@/components/scanner/NavBar";
import { JsonLd } from "@/components/JsonLd";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mcpscanner.cloud";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MCP Scanner — Security Scanner for MCP Servers",
    template: "%s | MCP Scanner",
  },
  description:
    "Free open-source security scanner for Model Context Protocol (MCP) servers. Detects tool poisoning, prompt injection, rug pulls, and cross-origin attacks. View the MCP security leaderboard.",
  keywords: [
    "MCP scanner", "MCP security", "Model Context Protocol",
    "AI agent security", "tool poisoning", "MCP vulnerability scanner",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "MCP Scanner",
    title: "MCP Scanner — Security Scanner for MCP Servers",
    description: "Free open-source security scanner for Model Context Protocol servers.",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MCP Scanner",
    description: "Security scanner for MCP servers",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#6366F1",
          colorBackground: "#0a0a0a",
          colorText: "#f5f5f5",
          colorInputBackground: "#111111",
          colorInputText: "#f5f5f5",
        },
      }}
    >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
        >
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "MCP Scanner",
              url: siteUrl,
              logo: `${siteUrl}/logo.svg`,
              description: "Free open-source security scanner for MCP servers",
              sameAs: ["https://github.com/NOTTIBOY137/mcp-scanner"],
            }}
          />
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "MCP Scanner",
              url: siteUrl,
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${siteUrl}/scan?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }}
          />
          <NavBar />
          <main className="mx-auto max-w-5xl px-6 lg:px-8">{children}</main>
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}

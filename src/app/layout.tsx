import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ClerkProvider } from "@clerk/nextjs";
import { NavBar } from "@/components/scanner/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MCP Scanner",
    template: "%s — MCP Scanner",
  },
  description:
    "Free security scanning for MCP servers. 122 rules, OWASP mapped, CI/CD ready.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000"
  ),
  openGraph: {
    title: "MCP Scanner",
    description: "Free security scanning for MCP servers.",
    type: "website",
    siteName: "MCP Scanner",
  },
  twitter: {
    card: "summary_large_image",
    title: "MCP Scanner",
    description: "Free security scanning for MCP servers.",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
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
          colorPrimary: "#06b6d4",
          colorBackground: "#09090b",
          colorText: "#fafafa",
          colorInputBackground: "#18181b",
          colorInputText: "#fafafa",
        },
      }}
    >
      <html lang="en">
        <body>
          <NavBar />
          <main className="mx-auto max-w-5xl px-6 lg:px-8">{children}</main>
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}

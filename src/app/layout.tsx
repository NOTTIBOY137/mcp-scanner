import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ClerkProvider } from "@clerk/nextjs";
import { NavBar } from "@/components/scanner/NavBar";
import { Footer } from "@/components/scanner/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "MCP Scanner — Security Registry for MCP Servers",
    template: "%s | MCP Scanner",
  },
  description:
    "Scan Model Context Protocol servers for vulnerabilities. Free security grades, badges, and reports for the MCP ecosystem.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000"
  ),
  openGraph: {
    title: "MCP Scanner — Security Registry for MCP Servers",
    description:
      "Security grades for MCP servers. Scan before you install.",
    type: "website",
    siteName: "MCP Scanner",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "MCP Scanner — Security Registry for MCP Servers",
    description:
      "Security grades for MCP servers. Scan before you install.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
          colorBackground: "#080b12",
          colorText: "#e2e8f0",
          colorInputBackground: "#161b22",
          colorInputText: "#e2e8f0",
        },
      }}
    >
      <html lang="en">
        <body
          className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} ${inter.className}`}
        >
          <NavBar />
          <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
          <Footer />
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}

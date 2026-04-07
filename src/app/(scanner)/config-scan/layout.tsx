import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Config Scanner",
  description:
    "Scan MCP configuration files for hardcoded secrets, dangerous commands, and insecure settings.",
  alternates: { canonical: "/config-scan" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

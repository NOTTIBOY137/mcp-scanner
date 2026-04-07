import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CI/CD Integration",
  description:
    "Generate GitHub Actions workflows for automated MCP security scanning.",
  alternates: { canonical: "/integrations" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

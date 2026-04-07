import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "API documentation, scanning guides, CI/CD integration, and OWASP MCP Top 10 reference for MCP Scanner.",
  alternates: { canonical: "/docs" },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

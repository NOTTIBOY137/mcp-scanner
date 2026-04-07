import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bulk Scan",
  description: "Scan up to 20 MCP server repositories at once.",
  alternates: { canonical: "/bulk-scan" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

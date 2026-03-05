import { Suspense } from "react";
import { Shield } from "lucide-react";
import { ScanForm } from "@/components/scanner/ScanForm";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scan a Server",
  description:
    "Enter a GitHub repository URL to scan any MCP server for security vulnerabilities. Results in seconds.",
};

export default function ScanPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Scan an MCP Server</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Enter a GitHub repository URL to scan for security vulnerabilities.
          We check for 10 vulnerability categories including tool poisoning,
          command injection, path traversal, SSRF, and more.
        </p>
      </div>
      <div className="card">
        <Suspense>
          <ScanForm />
        </Suspense>
      </div>
      <div className="flex items-start gap-2 text-xs text-[var(--text-tertiary)]">
        <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Scans analyze your public source code for security patterns. Results
          are cached for 1 hour. Only public repositories can be scanned.
        </p>
      </div>
    </div>
  );
}

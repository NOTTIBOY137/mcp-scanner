import { Suspense } from "react";
import { Shield } from "lucide-react";
import { ScanForm } from "@/components/scanner/ScanForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scan a Server",
  description: "Scan any MCP server for security vulnerabilities. 122 rules across 15 categories.",
  alternates: { canonical: "/scan" },
};

export default function ScanPage() {
  return (
    <div className="mx-auto max-w-lg pt-20 pb-24">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          Scan an MCP server
        </h1>
        <p className="mt-3 text-muted leading-relaxed">
          Enter a GitHub repository URL. We check for 15 vulnerability categories
          including tool poisoning, command injection, and credential theft.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-card p-6">
        <Suspense>
          <ScanForm />
        </Suspense>
      </div>

      <div className="flex items-start gap-2.5 mt-6 text-xs text-muted-foreground">
        <Shield className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <p>
          Scans analyze public source code for security patterns.
          Results are cached for 1 hour. Only public repositories can be scanned.
        </p>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground mb-4">Popular servers to try</p>
        <div className="flex flex-wrap justify-center gap-2">
          {["modelcontextprotocol/servers", "anthropics/anthropic-cookbook", "firebase/firebase-mcp", "stripe/agent-toolkit", "supabase-community/supabase-mcp"].map((repo) => (
            <a key={repo} href={`/scan?url=https://github.com/${repo}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted hover:bg-white/10 hover:text-foreground transition-colors">
              {repo}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

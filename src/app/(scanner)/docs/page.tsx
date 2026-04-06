"use client";

import { useState } from "react";
import Link from "next/link";

const nav = [
  { group: "Getting Started", items: [{ id: "intro", label: "Introduction" }, { id: "quick-start", label: "Quick Start" }] },
  { group: "Scanner", items: [{ id: "source-scan", label: "Source Code Scan" }, { id: "config-scanner", label: "Config Scanner" }, { id: "bulk-scan", label: "Bulk Scan" }] },
  { group: "Integrations", items: [{ id: "github-actions", label: "GitHub Actions" }, { id: "mcpguard", label: "MCPGuard App" }, { id: "vscode", label: "VS Code Extension" }] },
  { group: "API Reference", items: [
    { id: "api-score", label: "GET /v1/score/:owner/:repo" },
    { id: "api-badge", label: "GET /badge/:owner/:repo.svg" },
    { id: "api-scan", label: "POST /scan" },
    { id: "api-config", label: "POST /scan/config" },
    { id: "api-bulk", label: "POST /scan/bulk" },
    { id: "api-owasp", label: "GET /export/:id/owasp" },
  ]},
  { group: "Security", items: [{ id: "owasp", label: "OWASP MCP Top 10" }, { id: "rules", label: "Detection Rules" }, { id: "cwe", label: "CWE Mapping" }] },
];

function Code({ children, title }: { children: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group my-4">
      {title && <div className="text-xs text-muted-foreground border border-white/10 border-b-0 rounded-t-lg px-4 py-2" style={{ background: "rgba(255,255,255,0.03)" }}>{title}</div>}
      <pre className={`code-block ${title ? "!rounded-t-none !border-t-0" : ""}`}><code>{children}</code></pre>
      <button onClick={() => { navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="absolute top-2 right-2 text-xs text-muted-foreground hover:text-muted opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded border border-white/10" style={{ background: "#111111" }}>{copied ? "Copied" : "Copy"}</button>
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-muted leading-relaxed text-pretty mb-4">{children}</p>;
}

function Inline({ children }: { children: string }) {
  return <code className="text-[13px] px-1.5 py-0.5 rounded border border-white/10" style={{ background: "rgba(255,255,255,0.03)", fontFamily: "'Geist Mono', monospace" }}>{children}</code>;
}

export default function DocsPage() {
  const [active, setActive] = useState("intro");

  return (
    <div className="flex gap-12 py-12 -mx-6 lg:-mx-8 px-6 lg:px-8 min-h-[80vh]">
      <aside className="hidden lg:block w-52 shrink-0">
        <nav className="sticky top-24 space-y-6" aria-label="Documentation">
          {nav.map((s) => (
            <div key={s.group}>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">{s.group}</p>
              <ul className="space-y-0.5">
                {s.items.map((item) => (
                  <li key={item.id}>
                    <button onClick={() => { setActive(item.id); document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                      className={`block w-full text-left text-[13px] py-1.5 px-3 rounded-md transition-colors ${active === item.id ? "text-foreground bg-white/5" : "text-muted-foreground hover:text-muted"}`}>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <article className="flex-1 min-w-0 max-w-3xl">
        <section id="intro" className="mb-20">
          <h1 className="text-3xl font-medium tracking-tight mb-6">Documentation</h1>
          <P>MCP Scanner is a free security scanner for Model Context Protocol servers. It analyzes GitHub repositories for 122 vulnerability patterns across 15 categories, maps findings to the OWASP MCP Top 10 with CWE references, and exports SARIF, JSON, and OWASP compliance reports.</P>
        </section>

        <section id="quick-start" className="mb-20">
          <h2 className="text-xl font-medium tracking-tight mb-4">Quick Start</h2>
          <P>Scan any public GitHub repository with a single API call:</P>
          <Code title="Terminal">{`curl https://mcp-scanner-kappa.vercel.app/api/v1/score/modelcontextprotocol/servers`}</Code>
          <P>Or use the <Link href="/scan" className="text-brand-400 hover:underline">web interface</Link> — paste a GitHub URL and get results in seconds.</P>
        </section>

        <section id="source-scan" className="mb-20">
          <h2 className="text-xl font-medium tracking-tight mb-4">Source Code Scan</h2>
          <P>Submit a GitHub repository URL to scan its source code.</P>
          <Code title="POST /api/scan">{`{
  "repoUrl": "https://github.com/owner/repo"
}

// Response: { "id": "scan_abc123", "status": "pending" }`}</Code>
          <P>Poll <Inline>GET /api/scan/:scanId</Inline> for results. Scans typically complete in 5–15 seconds.</P>
        </section>

        <section id="config-scanner" className="mb-20">
          <h2 className="text-xl font-medium tracking-tight mb-4">Config Scanner</h2>
          <P>Scan MCP client configuration files for hardcoded secrets, dangerous commands, and insecure settings. No GitHub repo required.</P>
          <Code title="POST /api/scan/config">{`{
  "config": "{ \\"mcpServers\\": { ... } }"
}`}</Code>
          <P>Or use the <Link href="/config-scan" className="text-brand-400 hover:underline">web interface</Link> to paste your config.</P>
        </section>

        <section id="bulk-scan" className="mb-20">
          <h2 className="text-xl font-medium tracking-tight mb-4">Bulk Scan</h2>
          <P>Scan up to 20 repositories in a single request.</P>
          <Code title="POST /api/scan/bulk">{`{
  "repoUrls": [
    "https://github.com/owner/repo1",
    "https://github.com/owner/repo2"
  ]
}`}</Code>
        </section>

        <section id="github-actions" className="mb-20">
          <h2 className="text-xl font-medium tracking-tight mb-4">GitHub Actions</h2>
          <P>Add MCP security scanning to your CI/CD pipeline. Use the <Link href="/integrations" className="text-brand-400 hover:underline">generator</Link> or copy this workflow:</P>
          <Code title=".github/workflows/mcp-scan.yml">{`name: MCP Security Scan
on: [push, pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - name: Check MCP Security Score
        run: |
          RESULT=$(curl -sf $URL/api/v1/score/\$OWNER/\$REPO)
          GRADE=$(echo "$RESULT" | jq -r '.grade')
          if [ "$GRADE" = "F" ] || [ "$GRADE" = "D" ]; then
            echo "::error::Grade $GRADE below threshold"
            exit 1
          fi`}</Code>
        </section>

        <section id="mcpguard" className="mb-20">
          <h2 className="text-xl font-medium tracking-tight mb-4">MCPGuard GitHub App</h2>
          <P>MCPGuard automatically scans PRs for insecure MCP configuration files. It posts inline review comments with fix suggestions and blocks merges when critical issues are found.</P>
        </section>

        <section id="vscode" className="mb-20">
          <h2 className="text-xl font-medium tracking-tight mb-4">VS Code Extension</h2>
          <P>MCP Config Guardian provides real-time inline warnings as you edit MCP config files. Compatible with VS Code, Cursor, and Windsurf.</P>
          <p className="text-sm text-muted-foreground">Coming soon to the VS Code Marketplace and Open VSX.</p>
        </section>

        <section id="api-score" className="mb-20">
          <h2 className="text-xl font-medium tracking-tight mb-4">GET /api/v1/score/:owner/:repo</h2>
          <P>Returns the latest security grade and score. Supports optional Bearer token for higher rate limits.</P>
          <Code title="Response">{`{
  "server": "owner/repo",
  "grade": "B",
  "score": 78,
  "findings": { "critical": 0, "high": 2, "medium": 3, "low": 1 },
  "lastScanned": "2026-04-05T...",
  "reportUrl": "...",
  "badgeUrl": "..."
}`}</Code>
        </section>

        <section id="api-badge" className="mb-20">
          <h2 className="text-xl font-medium tracking-tight mb-4">GET /api/badge/:owner/:repo.svg</h2>
          <P>SVG badge for READMEs. Cached for 1 hour.</P>
          <Code title="Markdown">{`![MCP Security](https://mcp-scanner-kappa.vercel.app/api/badge/owner/repo.svg)`}</Code>
        </section>

        <section id="api-scan" className="mb-20">
          <h2 className="text-xl font-medium tracking-tight mb-4">POST /api/scan</h2>
          <P>Initiate a new scan. Rate limited to 30/hour per IP.</P>
          <Code>{`POST /api/scan
{ "repoUrl": "https://github.com/owner/repo" }

// Returns: { "id": "...", "status": "pending" }`}</Code>
        </section>

        <section id="api-config" className="mb-20">
          <h2 className="text-xl font-medium tracking-tight mb-4">POST /api/scan/config</h2>
          <P>Scan an MCP configuration JSON string. No authentication required.</P>
        </section>

        <section id="api-bulk" className="mb-20">
          <h2 className="text-xl font-medium tracking-tight mb-4">POST /api/scan/bulk</h2>
          <P>Scan up to 20 repositories. Returns an array of scan IDs.</P>
        </section>

        <section id="api-owasp" className="mb-20">
          <h2 className="text-xl font-medium tracking-tight mb-4">GET /api/export/:scanId/owasp</h2>
          <P>Export OWASP MCP Top 10 compliance report for a completed scan.</P>
        </section>

        <section id="owasp" className="mb-20">
          <h2 className="text-xl font-medium tracking-tight mb-6">OWASP MCP Top 10</h2>
          <div className="space-y-3">
            {[
              ["MCP01", "Token Mismanagement & Secret Exposure"],
              ["MCP02", "Scope Mismanagement & Privilege Escalation"],
              ["MCP03", "Tool Poisoning (Description-time)"],
              ["MCP04", "Tool Poisoning (Runtime)"],
              ["MCP05", "Excessive Data Exposure"],
              ["MCP06", "Insecure Input Handling / Injection"],
              ["MCP07", "Insufficient Authentication & Authorization"],
              ["MCP08", "Insecure Communication"],
              ["MCP09", "Shadow MCP Servers"],
              ["MCP10", "Logging & Monitoring Deficiencies"],
            ].map(([id, title]) => (
              <div key={id} className="flex items-center gap-3 text-sm">
                <span className="text-brand-400 w-14 shrink-0" style={{ fontFamily: "'Geist Mono', monospace", fontSize: 13 }}>{id}</span>
                <span className="text-muted">{title}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="rules" className="mb-20">
          <h2 className="text-xl font-medium tracking-tight mb-4">Detection Rules</h2>
          <P>122 rules across 15 categories: tool poisoning, command injection, path traversal, SSRF, credential theft, excessive permissions, missing auth, supply chain, rug pull, data exfiltration, insecure communication, excessive data exposure, logging deficiency, runtime tool poisoning, and shadow MCP server detection.</P>
        </section>

        <section id="cwe" className="mb-20">
          <h2 className="text-xl font-medium tracking-tight mb-4">CWE Mapping</h2>
          <P>Every rule includes CWE identifiers. 180+ unique CWEs mapped, with MITRE ATLAS technique references where applicable.</P>
        </section>
      </article>
    </div>
  );
}

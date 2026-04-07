"use client";

import { useState } from "react";
import { Shield, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import type { ConfigFinding } from "@/scanner/config-scanner";

export default function ConfigScanPage() {
  const [config, setConfig] = useState("");
  const [findings, setFindings] = useState<ConfigFinding[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleScan() {
    setLoading(true);
    setError("");
    setFindings(null);
    try {
      const res = await fetch("/api/scan/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Scan failed"); return; }
      setFindings(data.findings);
    } catch { setError("Failed to connect"); }
    finally { setLoading(false); }
  }

  const sevIcon = (s: string) => {
    if (s === "critical") return <XCircle className="size-4 text-critical shrink-0" aria-hidden="true" />;
    if (s === "high") return <AlertTriangle className="size-4 text-warning shrink-0" aria-hidden="true" />;
    return <AlertTriangle className="size-4 text-amber-400 shrink-0" aria-hidden="true" />;
  };

  return (
    <div className="mx-auto max-w-2xl pt-20 pb-24">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          Config Scanner
        </h1>
        <p className="mt-3 text-muted leading-relaxed max-w-lg mx-auto">
          Paste your <code className="text-xs font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">claude_desktop_config.json</code> or{" "}
          <code className="text-xs font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">.cursor/mcp.json</code> to
          find hardcoded secrets, dangerous commands, and insecure settings.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-card p-6 space-y-4">
        <label htmlFor="config-input" className="block text-sm text-muted">
          MCP Configuration JSON
        </label>
        <textarea
          id="config-input" value={config}
          onChange={(e) => setConfig(e.target.value)}
          placeholder={`{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["server.js"],
      "env": { "API_KEY": "sk-..." }
    }
  }
}`}
          className="input w-full h-56 font-mono text-sm resize-y"
        />

        {error && (
          <div className="rounded-lg border border-critical/30 bg-critical/5 p-3">
            <p className="text-sm text-critical">{error}</p>
          </div>
        )}

        <button
          onClick={handleScan}
          disabled={!config.trim() || loading}
          className="w-full rounded-lg bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Scanning...
            </span>
          ) : (
            "Scan Configuration"
          )}
        </button>
      </div>

      {/* Results */}
      {findings !== null && (
        <div className="mt-10 space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground">Results</h2>
            {findings.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-secure/20 bg-secure/5 px-3 py-1 text-xs font-medium text-secure">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                No issues found
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-critical/20 bg-critical/5 px-3 py-1 text-xs font-medium text-critical">
                {findings.length} issue{findings.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {findings.map((f, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-card p-4">
              <div className="flex items-start gap-3">
                {sevIcon(f.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-medium text-foreground">{f.title}</h3>
                    <span className="font-mono text-[10px] text-muted-foreground">{f.owaspMcpTop10}</span>
                    {f.cweIds.map((cwe) => (
                      <a key={cwe} href={`https://cwe.mitre.org/data/definitions/${cwe.replace("CWE-", "")}.html`}
                        target="_blank" rel="noopener noreferrer"
                        className="font-mono text-[10px] text-brand-400 hover:underline"
                      >{cwe}</a>
                    ))}
                  </div>
                  <p className="mt-1 text-sm text-muted">{f.description}</p>
                  {f.server && <p className="mt-1 text-xs text-muted-foreground">Server: <code className="font-mono">{f.server}</code></p>}
                  <p className="mt-2 text-xs text-secure">{f.remediation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* What we check */}
      <div className="mt-10 rounded-xl border border-white/10 bg-card p-6">
        <h3 className="text-sm font-medium text-foreground mb-4">What we check</h3>
        <div className="grid gap-2 sm:grid-cols-2 text-sm text-muted">
          {[
            "Hardcoded API keys and secrets",
            "Non-HTTPS server endpoints",
            "Tunneling services (ngrok, localtunnel)",
            "Excessive environment variables",
            "Shell injection in arguments",
            "Servers running with sudo/root",
            "Excessive configured servers",
            "OWASP MCP Top 10 mapping",
          ].map((check) => (
            <div key={check} className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 shrink-0 text-secure" aria-hidden="true" />
              {check}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

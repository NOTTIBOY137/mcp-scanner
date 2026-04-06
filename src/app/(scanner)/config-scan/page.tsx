"use client";

import { useState } from "react";
import { ShieldAlert, FileJson, Upload, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
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
      if (!res.ok) {
        setError(data.error || "Scan failed");
        return;
      }
      setFindings(data.findings);
    } catch {
      setError("Failed to connect to scanner");
    } finally {
      setLoading(false);
    }
  }

  const severityIcon = (sev: string) => {
    if (sev === "critical") return <XCircle className="h-4 w-4 text-red-400" />;
    if (sev === "high") return <AlertTriangle className="h-4 w-4 text-orange-400" />;
    if (sev === "medium") return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    return <CheckCircle2 className="h-4 w-4 text-cyan-400" />;
  };

  const severityBg = (sev: string) => {
    if (sev === "critical") return "border-red-500/20 bg-red-500/5";
    if (sev === "high") return "border-orange-500/20 bg-orange-500/5";
    if (sev === "medium") return "border-amber-500/20 bg-amber-500/5";
    return "border-cyan-500/20 bg-cyan-500/5";
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/5 px-3 py-1 text-xs font-medium text-cyan-400 mb-4">
          <FileJson className="h-3.5 w-3.5" />
          Config Scanner
        </div>
        <h1 className="font-display text-3xl font-bold">
          Scan Your MCP Configuration
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Paste your <code className="font-mono text-xs bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">claude_desktop_config.json</code>,{" "}
          <code className="font-mono text-xs bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">.cursor/mcp.json</code>, or any MCP client config.
          We check for hardcoded secrets, non-HTTPS endpoints, excessive permissions, and more.
        </p>
      </div>

      <div className="card space-y-4">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          MCP Configuration JSON
        </label>
        <textarea
          value={config}
          onChange={(e) => setConfig(e.target.value)}
          placeholder={`{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["server.js"],
      "env": {
        "API_KEY": "sk-..."
      }
    }
  }
}`}
          className="input w-full h-64 font-mono text-sm resize-y"
        />

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={handleScan}
          disabled={!config.trim() || loading}
          className="btn-primary w-full py-3 text-base font-semibold rounded-xl disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Scanning...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Scan Configuration
            </span>
          )}
        </button>
      </div>

      {findings !== null && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-bold">Results</h2>
            {findings.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                No issues found
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs font-medium text-red-400">
                <ShieldAlert className="h-3.5 w-3.5" />
                {findings.length} issue{findings.length !== 1 ? "s" : ""} found
              </span>
            )}
          </div>

          {findings.map((f, i) => (
            <div key={i} className={`rounded-lg border p-4 ${severityBg(f.severity)}`}>
              <div className="flex items-start gap-3">
                {severityIcon(f.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-[var(--text-primary)]">{f.title}</h3>
                    <span className="font-mono text-xs text-[var(--text-tertiary)]">{f.owaspMcpTop10}</span>
                    {f.cweIds.map((cwe) => (
                      <a
                        key={cwe}
                        href={`https://cwe.mitre.org/data/definitions/${cwe.replace("CWE-", "")}.html`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-[var(--accent)] hover:underline"
                      >
                        {cwe}
                      </a>
                    ))}
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{f.description}</p>
                  {f.server && (
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                      Server: <code className="font-mono">{f.server}</code>
                    </p>
                  )}
                  <p className="mt-2 text-xs text-emerald-400">{f.remediation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card bg-[var(--bg-secondary)]">
        <h3 className="font-display font-semibold mb-3">What we check</h3>
        <div className="grid gap-2 sm:grid-cols-2 text-sm text-[var(--text-secondary)]">
          {[
            "Hardcoded API keys and secrets",
            "Non-HTTPS server endpoints",
            "Tunneling services (ngrok, localtunnel)",
            "Excessive environment variable pass-through",
            "Shell injection in server arguments",
            "Servers running with sudo/root",
            "Excessive number of configured servers",
            "OWASP MCP Top 10 mapping on every finding",
          ].map((check) => (
            <div key={check} className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              {check}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

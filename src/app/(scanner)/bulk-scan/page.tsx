"use client";

import { useState } from "react";
import Link from "next/link";
import { Layers, ArrowRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface ScanResult {
  repoUrl: string;
  scanId?: string;
  error?: string;
}

export default function BulkScanPage() {
  const [urls, setUrls] = useState("");
  const [results, setResults] = useState<ScanResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleScan() {
    setLoading(true);
    setError("");
    setResults(null);
    const repoUrls = urls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    if (repoUrls.length === 0) {
      setError("Enter at least one repository URL");
      setLoading(false);
      return;
    }
    if (repoUrls.length > 20) {
      setError("Maximum 20 repositories per bulk scan");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/scan/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrls }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Bulk scan failed");
        return;
      }
      setResults(data.scans);
    } catch {
      setError("Failed to connect to scanner");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/5 px-3 py-1 text-xs font-medium text-blue-400 mb-4">
          <Layers className="h-3.5 w-3.5" />
          Bulk Scanner
        </div>
        <h1 className="font-display text-3xl font-bold">Bulk Scan</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Scan up to 20 MCP server repositories at once. Enter one GitHub URL per line.
        </p>
      </div>

      <div className="card space-y-4">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Repository URLs (one per line)
        </label>
        <textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder={`https://github.com/modelcontextprotocol/servers
https://github.com/anthropics/anthropic-cookbook
owner/repo`}
          className="input w-full h-48 font-mono text-sm resize-y"
        />

        <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
          <span>
            {urls.split("\n").filter((u) => u.trim()).length} / 20 repos
          </span>
          <span>Results appear as scans complete</span>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={handleScan}
          disabled={!urls.trim() || loading}
          className="btn-primary w-full py-3 text-base font-semibold rounded-xl disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Starting scans...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Layers className="h-5 w-5" />
              Scan All Repositories
            </span>
          )}
        </button>
      </div>

      {results && (
        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold">
            Scan Jobs ({results.length})
          </h2>
          {results.map((r, i) => (
            <div
              key={i}
              className={`card flex items-center justify-between gap-4 ${
                r.error ? "border-red-500/20" : "border-emerald-500/20"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm text-[var(--text-primary)] truncate">
                  {r.repoUrl}
                </p>
                {r.error && (
                  <p className="text-xs text-red-400 mt-1">{r.error}</p>
                )}
              </div>
              {r.scanId ? (
                <Link
                  href={`/results/${r.scanId}`}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  View Results <ArrowRight className="h-3 w-3" />
                </Link>
              ) : (
                <span className="shrink-0 inline-flex items-center gap-1.5 text-xs text-red-400">
                  <XCircle className="h-3.5 w-3.5" />
                  Failed
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

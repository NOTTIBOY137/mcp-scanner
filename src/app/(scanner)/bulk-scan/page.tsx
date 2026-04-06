"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface ScanResult { repoUrl: string; scanId?: string; error?: string; }

export default function BulkScanPage() {
  const [urls, setUrls] = useState("");
  const [results, setResults] = useState<ScanResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleScan() {
    setLoading(true);
    setError("");
    setResults(null);
    const repoUrls = urls.split("\n").map((u) => u.trim()).filter(Boolean);
    if (repoUrls.length === 0) { setError("Enter at least one URL"); setLoading(false); return; }
    if (repoUrls.length > 20) { setError("Maximum 20 repositories"); setLoading(false); return; }
    try {
      const res = await fetch("/api/scan/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ repoUrls }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      setResults(data.scans);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-2xl pt-20 pb-24">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">Bulk Scan</h1>
        <p className="mt-3 text-muted leading-relaxed">Scan up to 20 MCP server repositories at once. One GitHub URL per line.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-card p-6 space-y-4">
        <label className="block text-sm text-muted">Repository URLs (one per line)</label>
        <textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder={`modelcontextprotocol/servers\nanthropics/anthropic-cookbook\nowner/repo`}
          className="input w-full h-40 font-mono text-sm resize-y"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{urls.split("\n").filter((u) => u.trim()).length} / 20 repos</span>
          <span>Results appear as scans complete</span>
        </div>
        {error && <div className="rounded-lg border border-critical/30 bg-critical/5 p-3"><p className="text-sm text-critical">{error}</p></div>}
        <button
          onClick={handleScan}
          disabled={!urls.trim() || loading}
          className="w-full rounded-lg bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" aria-hidden="true" />Starting scans...</span>
          ) : "Scan All Repositories"}
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Rate limited to 30 scans per hour. Results typically complete in 10-30 seconds.
      </p>

      {results && (
        <div className="mt-10 space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Scan Jobs ({results.length})</h2>
          {results.map((r, i) => (
            <div key={i} className={`rounded-xl border border-white/10 bg-card flex items-center justify-between gap-4 p-4 ${r.error ? "border-critical/20" : ""}`}>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm text-foreground truncate">{r.repoUrl}</p>
                {r.error && <p className="text-xs text-critical mt-1">{r.error}</p>}
              </div>
              {r.scanId ? (
                <Link href={`/results/${r.scanId}`} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-secure/20 bg-secure/5 px-3 py-1.5 text-xs font-medium text-secure hover:bg-secure/10 transition-colors">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" /> View <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              ) : (
                <span className="shrink-0 inline-flex items-center gap-1.5 text-xs text-critical"><XCircle className="size-3.5" aria-hidden="true" /> Failed</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

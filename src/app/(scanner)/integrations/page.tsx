"use client";

import { useState } from "react";
import { Copy, CheckCircle2 } from "lucide-react";

export default function IntegrationsPage() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [threshold, setThreshold] = useState("D");
  const [yaml, setYaml] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/generate/github-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ owner, repo, failBelow: threshold }) });
      const data = await res.json();
      if (data.yaml) setYaml(data.yaml);
    } finally { setLoading(false); }
  }

  function copyYaml() { navigator.clipboard.writeText(yaml); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  return (
    <div className="mx-auto max-w-2xl pt-20 pb-24">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">CI/CD Integration</h1>
        <p className="mt-3 text-muted leading-relaxed">Generate a GitHub Actions workflow that scans your MCP server on every push and blocks PRs below your threshold.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-card p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-muted mb-1.5">Repository Owner</label>
            <input type="text" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="modelcontextprotocol" className="input" />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1.5">Repository Name</label>
            <input type="text" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="servers" className="input" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-muted mb-1.5">Fail Below Grade</label>
          <div className="flex gap-2">
            {["A", "B", "C", "D", "F"].map((g) => (
              <button key={g} onClick={() => setThreshold(g)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                  threshold === g ? "border-brand-500 bg-brand-500/10 text-brand-400" : "border-white/10 text-muted-foreground hover:bg-white/5"
                }`}
              >{g}</button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">CI will fail if grade is at or below this.</p>
        </div>
        <button onClick={generate} disabled={!owner || !repo || loading}
          className="w-full rounded-lg bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >{loading ? "Generating..." : "Generate Workflow"}</button>
      </div>

      {yaml && (
        <div className="mt-10 rounded-xl border border-white/10 bg-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">.github/workflows/mcp-scan.yml</h2>
            <button onClick={copyYaml} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-muted transition-colors cursor-pointer">
              {copied ? <><CheckCircle2 className="size-3.5" aria-hidden="true" /> Copied</> : <><Copy className="size-3.5" aria-hidden="true" /> Copy</>}
            </button>
          </div>
          <pre className="code-block">{yaml}</pre>
          <p className="text-xs text-muted-foreground">Save to <code className="font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10">.github/workflows/mcp-scan.yml</code></p>
        </div>
      )}

      <div className="mt-10 rounded-xl border border-white/10 bg-card p-6">
        <h3 className="text-sm font-medium text-foreground mb-3">Other CI/CD Platforms</h3>
        <p className="text-sm text-muted mb-4">Our API works with any CI/CD platform. Use the score endpoint:</p>
        <pre className="code-block">{`curl -s https://mcp-scanner-kappa.vercel.app/api/v1/score/{owner}/{repo}\n\n# Returns: { "grade": "A", "score": 95, "findings": {...} }`}</pre>
      </div>
    </div>
  );
}

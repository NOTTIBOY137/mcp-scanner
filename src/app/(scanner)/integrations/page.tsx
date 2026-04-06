"use client";

import { useState } from "react";
import { GitBranch, Copy, CheckCircle2 } from "lucide-react";

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
      const res = await fetch("/api/generate/github-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, failBelow: threshold }),
      });
      const data = await res.json();
      if (data.yaml) setYaml(data.yaml);
    } finally {
      setLoading(false);
    }
  }

  function copyYaml() {
    navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/5 px-3 py-1 text-xs font-medium text-purple-400 mb-4">
          <GitBranch className="h-3.5 w-3.5" />
          CI/CD Integration
        </div>
        <h1 className="font-display text-3xl font-bold">
          GitHub Actions Integration
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Generate a GitHub Actions workflow that scans your MCP server on every push
          and blocks PRs that fall below your security threshold.
        </p>
      </div>

      <div className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Repository Owner
            </label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="modelcontextprotocol"
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Repository Name
            </label>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="servers"
              className="input w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
            Fail Below Grade
          </label>
          <div className="flex gap-2">
            {["A", "B", "C", "D", "F"].map((g) => (
              <button
                key={g}
                onClick={() => setThreshold(g)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  threshold === g
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
            CI will fail if the scan grade is at or below this threshold.
          </p>
        </div>

        <button
          onClick={generate}
          disabled={!owner || !repo || loading}
          className="btn-primary w-full py-3 text-base font-semibold rounded-xl disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Workflow"}
        </button>
      </div>

      {yaml && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold">
              .github/workflows/mcp-scan.yml
            </h2>
            <button
              onClick={copyYaml}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--accent)] hover:text-[var(--accent-glow)] transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-4 font-mono text-xs text-[var(--text-secondary)] leading-relaxed">
            {yaml}
          </pre>
          <p className="text-xs text-[var(--text-tertiary)]">
            Save this file to your repository at{" "}
            <code className="font-mono bg-[var(--bg-tertiary)] px-1 py-0.5 rounded">
              .github/workflows/mcp-scan.yml
            </code>{" "}
            and it will run on every push and pull request.
          </p>
        </div>
      )}

      <div className="card bg-[var(--bg-secondary)]">
        <h3 className="font-display font-semibold mb-3">Other CI/CD Platforms</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Our API works with any CI/CD platform. Use the score endpoint:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-3 font-mono text-xs text-[var(--text-secondary)]">
{`curl -s https://mcp-scanner-kappa.vercel.app/api/v1/score/{owner}/{repo}

# Returns: { "grade": "A", "score": 95, "findings": {...} }`}
        </pre>
      </div>
    </div>
  );
}

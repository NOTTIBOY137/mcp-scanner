"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function BadgeGenerator({ appUrl }: { appUrl: string }) {
  const [input, setInput] = useState("");
  const [tab, setTab] = useState<"markdown" | "html">("markdown");
  const [copied, setCopied] = useState(false);

  const parts = input.trim().split("/");
  const isValid = parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
  const owner = parts[0] ?? "";
  const repo = parts[1] ?? "";

  const badgeUrl = `${appUrl}/api/badge/${owner}/${repo}.svg`;
  const reportUrl = `${appUrl}/report/SCAN_ID`;

  const markdown = `[![MCP Security](${badgeUrl})](${reportUrl})`;
  const html = `<a href="${reportUrl}"><img src="${badgeUrl}" alt="MCP Security Score"></a>`;

  const codeText = tab === "markdown" ? markdown : html;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(codeText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = codeText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="badge-repo"
          className="mb-2 block text-sm font-medium text-[var(--text-secondary)]"
        >
          Enter your repository
        </label>
        <input
          id="badge-repo"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="owner/repo"
          className="input max-w-sm"
        />
      </div>

      {isValid && (
        <>
          {/* Live preview */}
          <div className="card flex flex-col items-center gap-3">
            <p className="text-xs text-[var(--text-tertiary)]">Live preview</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={badgeUrl}
              alt={`MCP Security badge for ${owner}/${repo}`}
              height={20}
            />
          </div>

          {/* Embed code */}
          <div className="space-y-3">
            <div className="flex gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] p-1 w-fit">
              <button
                onClick={() => setTab("markdown")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  tab === "markdown"
                    ? "bg-[var(--bg-hover)] text-[var(--text-primary)]"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                }`}
              >
                Markdown
              </button>
              <button
                onClick={() => setTab("html")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  tab === "html"
                    ? "bg-[var(--bg-hover)] text-[var(--text-primary)]"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                }`}
              >
                HTML
              </button>
            </div>

            <div className="relative overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)]">
              <pre className="overflow-x-auto p-4 font-mono text-sm text-[var(--text-secondary)]">
                {codeText}
              </pre>
              <button
                onClick={copyCode}
                className="absolute top-2 right-2 btn-ghost inline-flex items-center gap-1.5 text-xs"
              >
                {copied ? (
                  <><Check className="h-3.5 w-3.5 text-emerald-400" /> Copied!</>
                ) : (
                  <><Copy className="h-3.5 w-3.5" /> Copy</>
                )}
              </button>
            </div>

            <p className="text-xs text-[var(--text-tertiary)]">
              Replace <code className="text-[var(--text-secondary)] font-mono">SCAN_ID</code> with your
              actual scan ID from the results page.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

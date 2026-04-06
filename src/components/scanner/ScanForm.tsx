"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

type InputFormat = "github-url" | "owner-repo" | "npm" | "unknown";

function detectFormat(input: string): { type: InputFormat; normalized?: string } {
  const trimmed = input.trim();
  if (!trimmed) return { type: "unknown" };
  if (trimmed.startsWith("@") || /^[a-z][a-z0-9-]*$/.test(trimmed)) {
    if (trimmed.startsWith("@")) return { type: "npm" };
  }
  const urlMatch = trimmed.match(/^https?:\/\/(www\.)?github\.com\/([^/\s]+)\/([^/\s]+)/);
  if (urlMatch) return { type: "github-url", normalized: `https://github.com/${urlMatch[2]}/${urlMatch[3].replace(/\.git$/, "")}` };
  const shortMatch = trimmed.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (shortMatch) return { type: "owner-repo", normalized: `https://github.com/${shortMatch[1]}/${shortMatch[2]}` };
  const noProto = trimmed.match(/^github\.com\/([^/\s]+)\/([^/\s]+)/);
  if (noProto) return { type: "github-url", normalized: `https://github.com/${noProto[1]}/${noProto[2].replace(/\.git$/, "")}` };
  return { type: "unknown" };
}

export function ScanForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const prefill = searchParams.get("url");
    if (prefill) setUrl(prefill);
  }, [searchParams]);

  const format = detectFormat(url);
  const isValid = format.type === "github-url" || format.type === "owner-repo";
  const isNpm = format.type === "npm";
  const showValidation = url.trim().length > 2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: format.normalized }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(res.status === 429 ? "Rate limited. Try again in a few minutes." : data.error ?? "Scan failed.");
        return;
      }
      router.push(`/results/${data.id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="repo-url" className="mb-2 block text-sm text-muted">
          GitHub Repository
        </label>
        <div className="relative">
          <input
            id="repo-url"
            type="text"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(null); }}
            placeholder="github.com/owner/repo or owner/repo"
            className="input pr-10"
            required
          />
          {showValidation && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {isValid ? <CheckCircle2 className="size-4 text-secure" /> : <XCircle className="size-4 text-critical" />}
            </span>
          )}
        </div>
        {showValidation && isNpm && (
          <p className="mt-2 text-xs text-warning">npm package scanning coming soon. Enter a GitHub URL instead.</p>
        )}
        {showValidation && !isValid && !isNpm && (
          <p className="mt-2 text-xs text-muted-foreground">Accepts: https://github.com/owner/repo or owner/repo</p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-critical/30 bg-critical/5 p-3">
          <p className="text-sm text-critical">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !isValid}
        className="w-full rounded-lg bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Scanning...
          </span>
        ) : (
          "Scan Now"
        )}
      </button>
    </form>
  );
}

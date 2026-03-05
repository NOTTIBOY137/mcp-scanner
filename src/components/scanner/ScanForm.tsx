"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

type InputFormat = "github-url" | "owner-repo" | "npm" | "unknown";

function detectFormat(input: string): {
  type: InputFormat;
  normalized?: string;
} {
  const trimmed = input.trim();
  if (!trimmed) return { type: "unknown" };

  if (trimmed.startsWith("@") || /^[a-z][a-z0-9-]*$/.test(trimmed)) {
    if (trimmed.startsWith("@")) return { type: "npm" };
  }

  const urlMatch = trimmed.match(
    /^https?:\/\/(www\.)?github\.com\/([^/\s]+)\/([^/\s]+)/
  );
  if (urlMatch) {
    return {
      type: "github-url",
      normalized: `https://github.com/${urlMatch[2]}/${urlMatch[3].replace(/\.git$/, "")}`,
    };
  }

  const shortMatch = trimmed.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (shortMatch) {
    return {
      type: "owner-repo",
      normalized: `https://github.com/${shortMatch[1]}/${shortMatch[2]}`,
    };
  }

  const noProtocol = trimmed.match(
    /^github\.com\/([^/\s]+)\/([^/\s]+)/
  );
  if (noProtocol) {
    return {
      type: "github-url",
      normalized: `https://github.com/${noProtocol[1]}/${noProtocol[2].replace(/\.git$/, "")}`,
    };
  }

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
        if (res.status === 429) {
          setError("Rate limited. Too many scans right now. Try again in a few minutes.");
        } else if (res.status === 404) {
          setError("Repository not found. Check the URL and try again.");
        } else {
          setError(data.error ?? "Scan failed. Please try again.");
        }
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
        <label
          htmlFor="repo-url"
          className="mb-2 block text-sm font-medium text-[var(--text-secondary)]"
        >
          GitHub Repository
        </label>
        <div className="relative">
          <input
            id="repo-url"
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="https://github.com/owner/repo  or  owner/repo"
            className="input pr-10"
            required
          />
          {showValidation && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {isValid ? (
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
              ) : (
                <XCircle className="h-4.5 w-4.5 text-red-400" />
              )}
            </span>
          )}
        </div>
        {showValidation && isNpm && (
          <p className="mt-2 text-xs text-amber-400">
            npm package scanning coming soon. Enter a GitHub URL instead.
          </p>
        )}
        {showValidation && !isValid && !isNpm && (
          <p className="mt-2 text-xs text-[var(--text-tertiary)]">
            Accepts: https://github.com/owner/repo or owner/repo
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !isValid}
        className="btn-primary w-full py-3"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Scanning
          </span>
        ) : (
          "Start Security Scan"
        )}
      </button>
    </form>
  );
}

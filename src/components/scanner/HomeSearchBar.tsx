"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const EXAMPLES = [
  { label: "modelcontextprotocol/servers", url: "modelcontextprotocol/servers" },
  { label: "anthropics/claude-code", url: "anthropics/claude-code" },
  { label: "langchain-ai/langchain", url: "langchain-ai/langchain" },
];

export function HomeSearchBar() {
  const [url, setUrl] = useState("");
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    router.push(`/scan?url=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <form onSubmit={handleSubmit}>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-brand-500" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="github.com/owner/repo or owner/repo"
            className="w-full h-14 rounded-xl border border-brand-500/20 bg-card py-4 pl-12 pr-28 text-base text-foreground placeholder-muted-foreground outline-none transition-all focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-gradient-to-r from-brand-500 to-cyan-400 px-3 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-cyan-500/25 hover:brightness-110"
          >
            Scan
          </button>
        </div>
      </form>
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span>Try:</span>
        {EXAMPLES.map((ex, i) => (
          <button
            key={ex.url}
            onClick={() => {
              setUrl(ex.url);
              router.push(`/scan?url=${encodeURIComponent(ex.url)}`);
            }}
            className="text-brand-500 hover:text-brand-400 transition-colors"
          >
            {ex.label}{i < EXAMPLES.length - 1 ? "," : ""}
          </button>
        ))}
      </div>
    </div>
  );
}

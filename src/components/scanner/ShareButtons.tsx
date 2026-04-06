"use client";

import { useState } from "react";
import { Twitter, Linkedin, Link as LinkIcon, Check } from "lucide-react";

export function ShareButtons({
  scanId,
  serverName,
  grade,
  score,
}: {
  scanId: string;
  serverName: string;
  grade: string;
  score: number;
}) {
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/report/${scanId}`
      : `https://localhost:3000/report/${scanId}`;

  const tweetText = `Just scanned ${serverName} for MCP security vulnerabilities — scored ${grade} (${score}/100). Check your MCP servers:`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(url)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const btnClass =
    "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all hover:scale-[1.02]";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btnClass} bg-[#0f1419] text-white ring-1 ring-white/10 hover:ring-white/20`}
      >
        <Twitter className="h-4 w-4" />
        Share on X
      </a>

      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btnClass} bg-[#0a66c2] text-white hover:bg-[#0b77e0]`}
      >
        <Linkedin className="h-4 w-4" />
        LinkedIn
      </a>

      <button
        type="button"
        onClick={copyLink}
        className={`${btnClass} bg-zinc-900 text-foreground ring-1 ring-white/10 hover:ring-brand-500/20`}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-emerald-400" />
            Copied!
          </>
        ) : (
          <>
            <LinkIcon className="h-4 w-4" />
            Copy Link
          </>
        )}
      </button>
    </div>
  );
}

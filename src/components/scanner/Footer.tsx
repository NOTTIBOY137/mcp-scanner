import { Github, Twitter } from "lucide-react";
import { LogoIcon } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-[var(--text-tertiary)] sm:flex-row">
        <div className="flex items-center gap-2">
          <LogoIcon size="sm" />
          <span>MCP Scanner — The MCP Trust Registry</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/nicholasgriffintn/mcp-security-scanner"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[var(--text-secondary)]"
            aria-label="GitHub"
          >
            <Github className="h-4 w-4" />
          </a>
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[var(--text-secondary)]"
            aria-label="X (Twitter)"
          >
            <Twitter className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}

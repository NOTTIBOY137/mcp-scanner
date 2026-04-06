"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/scan", label: "Scan" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/docs", label: "Docs" },
];

export function NavBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-[var(--border)] bg-[#09090b]/80 backdrop-blur-xl">
      <nav
        className="mx-auto flex h-full max-w-5xl items-center justify-between px-6 lg:px-8"
        aria-label="Main"
      >
        <Link
          href="/"
          className="text-[15px] font-semibold text-[var(--fg)] tracking-tight"
        >
          MCP Scanner
        </Link>

        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                isActive(link.href)
                  ? "text-[var(--fg)]"
                  : "text-[var(--fg-faint)] hover:text-[var(--fg-muted)]"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <a
            href="https://github.com/NOTTIBOY137/mcp-scanner"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--fg-faint)] hover:text-[var(--fg-muted)] transition-colors"
            aria-label="GitHub repository"
          >
            <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          </a>

          {isSignedIn ? (
            <div className="flex items-center gap-4 ml-2 pl-4 border-l border-[var(--border)]">
              <Link
                href="/dashboard"
                className={`text-sm transition-colors ${
                  isActive("/dashboard")
                    ? "text-[var(--fg)]"
                    : "text-[var(--fg-faint)] hover:text-[var(--fg-muted)]"
                }`}
              >
                Dashboard
              </Link>
              <UserButton />
            </div>
          ) : (
            <Link
              href="/sign-in"
              className="text-sm text-[var(--fg-faint)] hover:text-[var(--fg-muted)] transition-colors ml-2 pl-4 border-l border-[var(--border)]"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile */}
        <button
          onClick={() => setOpen(!open)}
          className="sm:hidden p-2 text-[var(--fg-faint)]"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open && (
        <div className="sm:hidden border-t border-[var(--border)] bg-[var(--bg)] px-6 py-4 space-y-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block text-sm ${
                isActive(link.href) ? "text-[var(--fg)]" : "text-[var(--fg-faint)]"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={isSignedIn ? "/dashboard" : "/sign-in"}
            onClick={() => setOpen(false)}
            className="block text-sm text-[var(--accent)]"
          >
            {isSignedIn ? "Dashboard" : "Sign in"}
          </Link>
        </div>
      )}
    </header>
  );
}

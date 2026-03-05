"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

const links = [
  { href: "/scan", label: "Scan" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/badges", label: "Badges" },
  { href: "/pricing", label: "Pricing" },
];

export function NavBar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav
      className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors ${
        scrolled
          ? "border-[var(--border-subtle)] bg-[#080b12]/95"
          : "border-transparent bg-[#080b12]/85"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Logo size="sm" showText />
        </Link>

        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "text-[var(--accent-glow)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute inset-x-2 -bottom-3 h-0.5 rounded-full bg-[var(--accent)]" />
              )}
            </Link>
          ))}

          {isSignedIn ? (
            <>
              <Link
                href="/dashboard"
                className={`relative rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "text-[var(--accent-glow)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                Dashboard
                {isActive("/dashboard") && (
                  <span className="absolute inset-x-2 -bottom-3 h-0.5 rounded-full bg-[var(--accent)]" />
                )}
              </Link>
              <div className="ml-2">
                <UserButton />
              </div>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="ml-2 btn-ghost text-sm"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="sm:hidden rounded-md p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden border-t border-[var(--border-subtle)] px-6 py-3 space-y-1 bg-[var(--bg-primary)]">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "text-[var(--accent-glow)] bg-[var(--accent)]/5"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isSignedIn ? (
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive("/dashboard")
                  ? "text-[var(--accent-glow)] bg-[var(--accent)]/5"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-glow)]"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

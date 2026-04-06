"use client";

import Link from "next/link";

export function SubscribeButton({
  recommended,
}: {
  plan?: string;
  recommended?: boolean;
}) {
  return (
    <Link
      href="/sign-up"
      className={`block w-full rounded-md px-4 py-2.5 text-center text-sm font-medium transition-colors ${
        recommended
          ? "bg-[var(--accent)] text-white hover:brightness-110"
          : "bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
      }`}
    >
      Get Started Free
    </Link>
  );
}

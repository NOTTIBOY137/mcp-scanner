import Link from "next/link";
import { HomeSearchBar } from "@/components/scanner/HomeSearchBar";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="font-mono text-[8rem] font-bold leading-none text-[var(--bg-tertiary)]">
        404
      </div>
      <h1 className="mt-2 font-display text-xl font-bold text-[var(--text-primary)]">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-[var(--text-secondary)]">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-8 w-full max-w-lg">
        <HomeSearchBar />
      </div>
      <Link
        href="/"
        className="mt-6 text-sm text-[var(--accent)] hover:text-[var(--accent-glow)] transition-colors"
      >
        &larr; Back to home
      </Link>
    </div>
  );
}

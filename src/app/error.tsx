"use client";

import { AlertCircle } from "lucide-react";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
        <AlertCircle className="h-7 w-7 text-red-400" />
      </div>
      <h1 className="font-display text-xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-[var(--text-secondary)] max-w-md">
        An unexpected error occurred. This has been logged and we will look
        into it.
      </p>
      <button onClick={reset} className="btn-primary mt-6">
        Try Again
      </button>
    </div>
  );
}

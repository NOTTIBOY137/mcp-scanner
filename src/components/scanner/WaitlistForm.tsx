"use client";

import { useState } from "react";

export function WaitlistForm({
  plan,
  buttonLabel,
  recommended,
}: {
  plan: string;
  buttonLabel: string;
  recommended: boolean;
}) {
  const [email, setEmail] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plan }),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Something went wrong");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-center text-sm text-green-400 py-2.5">
        You&apos;re on the list! We&apos;ll email you when ready.
      </p>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className={`w-full rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
          recommended
            ? "bg-brand-500 text-white hover:brightness-110"
            : "bg-card text-foreground hover:bg-zinc-900"
        }`}
      >
        {buttonLabel}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        className="w-full rounded-md border border-white/10 bg-card/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
      />
      {status === "error" && (
        <p className="text-xs text-red-400">{errorMsg}</p>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className={`w-full rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
          recommended
            ? "bg-brand-500 text-white hover:brightness-110"
            : "bg-card text-foreground hover:bg-zinc-900"
        }`}
      >
        {status === "loading" ? "Joining..." : "Join Waitlist"}
      </button>
    </form>
  );
}

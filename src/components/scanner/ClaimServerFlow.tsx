"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ClaimServerFlow({ serverId }: { serverId: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "token" | "verifying" | "success" | "error">("idle");
  const [token, setToken] = useState("");
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function startClaim() {
    setLoading(true);
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId }),
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setOwner(data.owner);
        setRepo(data.repo);
        setStep("token");
      } else {
        setErrorMsg(data.error);
        setStep("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStep("error");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setStep("verifying");
    try {
      const res = await fetch("/api/claim/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId }),
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        setStep("success");
        router.refresh();
      } else {
        setErrorMsg(data.error || "Verification failed");
        setStep("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStep("error");
    }
  }

  function copyToken() {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (step === "success") {
    return (
      <div className="mt-4 rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-3">
        <p className="text-sm font-medium text-green-400">
          Server claimed successfully! You are now the verified owner.
        </p>
      </div>
    );
  }

  if (step === "token") {
    return (
      <div className="mt-4 space-y-4 rounded-lg border border-white/10 bg-card/30 p-4">
        <h3 className="text-sm font-semibold">Claim Verification</h3>
        <ol className="space-y-3 text-sm text-foreground">
          <li>
            <span className="font-medium text-foreground">Step 1:</span> Add a
            file called{" "}
            <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-xs">
              .mcptrust
            </code>{" "}
            to the root of{" "}
            <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-xs">
              {owner}/{repo}
            </code>{" "}
            with this content:
          </li>
        </ol>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded bg-background px-3 py-2 text-sm font-mono text-foreground break-all">
            {token}
          </code>
          <button
            onClick={copyToken}
            className="shrink-0 rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-foreground hover:brightness-110 transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <ol start={2} className="space-y-3 text-sm text-foreground">
          <li>
            <span className="font-medium text-foreground">Step 2:</span> Commit
            and push the file to your repository.
          </li>
          <li>
            <span className="font-medium text-foreground">Step 3:</span> Click
            &quot;Verify&quot; below.
          </li>
        </ol>
        <button
          onClick={verify}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:brightness-110 transition-colors"
        >
          Verify
        </button>
      </div>
    );
  }

  if (step === "verifying") {
    return (
      <div className="mt-4 text-sm text-muted">
        Verifying... checking your repository for the .mcptrust file.
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="mt-4 space-y-2">
        <p className="text-sm text-red-400">{errorMsg}</p>
        <button
          onClick={() => setStep("idle")}
          className="text-xs text-muted hover:text-foreground"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startClaim}
      disabled={loading}
      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-500/15 px-4 py-2 text-sm font-medium text-green-400 ring-1 ring-green-500/30 hover:bg-green-500/25 transition-colors disabled:opacity-50"
    >
      {loading ? "Starting claim..." : "Claim This Server"}
    </button>
  );
}

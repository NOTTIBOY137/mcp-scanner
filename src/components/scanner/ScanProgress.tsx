"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import type { ScanResponse } from "@/types/scan";

const STEPS = [
  { id: "fetch", label: "Fetching repository metadata" },
  { id: "analyze", label: "Analyzing file structure" },
  { id: "rules", label: "Running security rules" },
  { id: "score", label: "Calculating security score" },
  { id: "report", label: "Generating report" },
];

function getActiveStep(status: string): number {
  switch (status) {
    case "pending":
      return 0;
    case "scanning":
      return 2;
    case "grading":
      return 3;
    case "completed":
      return 5;
    case "failed":
      return -1;
    default:
      return 0;
  }
}

export function ScanProgress({ scanId }: { scanId: string }) {
  const [data, setData] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/scan/${scanId}`);
        if (!res.ok) throw new Error("Failed to fetch scan status");
        const result: ScanResponse = await res.json();
        if (cancelled) return;
        setData(result);

        if (result.status === "completed") {
          setTimeout(() => router.refresh(), 800);
          return;
        }

        if (result.status === "failed") return;
        setTimeout(poll, 2000);
      } catch {
        if (!cancelled) setError("Failed to load scan results. Please refresh.");
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [scanId, router]);

  if (error) {
    return (
      <div className="card border-red-500/30 bg-red-500/5">
        <p className="font-medium text-red-400">{error}</p>
        <button
          onClick={() => {
            setError(null);
            router.refresh();
          }}
          className="btn-primary mt-3"
        >
          Retry
        </button>
      </div>
    );
  }

  const activeStep = data ? getActiveStep(data.status) : 0;
  const isComplete = data?.status === "completed";
  const isFailed = data?.status === "failed";

  return (
    <div className="card space-y-6">
      <div className="space-y-4">
        {STEPS.map((step, i) => {
          const isDone = i < activeStep;
          const isActive = i === activeStep && !isComplete && !isFailed;

          return (
            <div key={step.id} className="flex items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                {isDone || isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 text-[var(--accent)] animate-spin" />
                ) : (
                  <Circle className="h-4 w-4 text-[var(--text-tertiary)]" />
                )}
              </div>
              <span
                className={`text-sm ${
                  isDone || isComplete
                    ? "text-[var(--text-secondary)]"
                    : isActive
                      ? "text-[var(--accent)] font-medium"
                      : "text-[var(--text-tertiary)]"
                }`}
              >
                {step.label}
                {isActive && (
                  <span className="inline-flex ml-1 animate-pulse">...</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {isComplete && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
          <p className="text-sm font-medium text-emerald-400">
            Scan complete! Loading results...
          </p>
        </div>
      )}

      {isFailed && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400" />
            <p className="text-sm font-medium text-red-400">
              {data?.error ?? "Something went wrong during the scan."}
            </p>
          </div>
          <button
            onClick={() => router.push("/scan")}
            className="btn-secondary mt-3 text-xs"
          >
            Try another scan
          </button>
        </div>
      )}

      {!isComplete && !isFailed && (
        <p className="text-center text-xs text-[var(--text-tertiary)]">
          Usually takes 10-30 seconds
        </p>
      )}
    </div>
  );
}

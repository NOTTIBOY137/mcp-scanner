"use client";

import { CheckCircle2 } from "lucide-react";

export function BillingCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-card p-6">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-brand-500" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Free Plan</h2>
          <p className="text-sm text-muted">
            All features included — no upgrade required.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

const PLAN_LIMITS: Record<string, string> = {
  free: "100 API calls/day",
  pro: "1,000 API calls/day",
  team: "10,000 API calls/day",
};

export function BillingCard({
  plan,
  status,
  cancelAtPeriodEnd,
  currentPeriodEnd,
  hasStripeCustomer,
}: {
  plan: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  hasStripeCustomer: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold capitalize">{plan} Plan</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        {PLAN_LIMITS[plan] ?? PLAN_LIMITS.free}
      </p>

      {status === "past_due" && (
        <p className="mt-2 text-sm text-red-400">
          Payment failed. Please update your billing info to keep your plan.
        </p>
      )}

      {cancelAtPeriodEnd && currentPeriodEnd && (
        <p className="mt-2 text-sm text-yellow-400">
          Your subscription will cancel on{" "}
          {new Date(currentPeriodEnd).toLocaleDateString()}.
        </p>
      )}

      <div className="mt-4 flex gap-3">
        {hasStripeCustomer ? (
          <button
            onClick={openPortal}
            disabled={loading}
            className="rounded-md bg-[var(--bg-secondary)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
          >
            {loading ? "Loading..." : "Manage Billing"}
          </button>
        ) : null}

        {plan === "free" && (
          <Link
            href="/pricing"
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:brightness-110"
          >
            Upgrade
          </Link>
        )}
      </div>
    </div>
  );
}

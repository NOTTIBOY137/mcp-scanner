import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { SubscribeButton } from "@/components/billing/SubscribeButton";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Choose a plan for MCP Scanner. Free security scans, API access, and server ownership verification.",
};

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For individual developers exploring MCP security.",
    features: [
      { text: "10 API calls/day (anonymous)", included: true },
      { text: "100 API calls/day (signed up)", included: true },
      { text: "5 scans/hour", included: true },
      { text: "Security grades & badges", included: true },
      { text: "1 server claim", included: true },
      { text: "Priority support", included: false },
      { text: "Custom integrations", included: false },
    ],
    cta: { label: "Get Started", href: "/sign-up" },
    recommended: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For teams shipping MCP integrations in production.",
    features: [
      { text: "1,000 API calls/day", included: true },
      { text: "Unlimited scans", included: true },
      { text: "Security grades & badges", included: true },
      { text: "10 server claims", included: true },
      { text: "Priority support", included: true },
      { text: "Webhook notifications", included: true },
      { text: "Custom integrations", included: false },
    ],
    cta: { label: "Subscribe", plan: "pro" },
    recommended: true,
  },
  {
    name: "Team",
    price: "$99",
    period: "/mo",
    description: "For organizations managing multiple MCP servers.",
    features: [
      { text: "10,000 API calls/day", included: true },
      { text: "Unlimited scans", included: true },
      { text: "Security grades & badges", included: true },
      { text: "Unlimited server claims", included: true },
      { text: "Priority support", included: true },
      { text: "Webhook notifications", included: true },
      { text: "Custom integrations", included: true },
    ],
    cta: { label: "Subscribe", plan: "team" },
    recommended: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations with custom requirements.",
    features: [
      { text: "Unlimited API calls", included: true },
      { text: "Unlimited scans", included: true },
      { text: "Security grades & badges", included: true },
      { text: "Unlimited server claims", included: true },
      { text: "Dedicated support", included: true },
      { text: "Webhook notifications", included: true },
      { text: "Custom integrations & SLA", included: true },
    ],
    cta: {
      label: "Contact Us",
      href: "mailto:enterprise@mcptrust.dev",
    },
    recommended: false,
  },
];

export default function PricingPage() {
  return (
    <div className="space-y-10">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">Pricing</h1>
        <p className="mt-2 text-[var(--text-secondary)] max-w-lg mx-auto">
          Secure your MCP ecosystem. Start free, scale as you grow.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`card relative flex flex-col ${
              tier.recommended
                ? "ring-2 ring-[var(--accent)]/50 border-[var(--accent)]/30"
                : ""
            }`}
          >
            {tier.recommended && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-medium text-white">
                Most Popular
              </span>
            )}

            <div className="mb-4">
              <h2 className="font-display text-lg font-semibold">{tier.name}</h2>
              <div className="mt-2">
                <span className="font-mono text-3xl font-bold">{tier.price}</span>
                <span className="text-sm text-[var(--text-secondary)]">
                  {tier.period}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {tier.description}
              </p>
            </div>

            <ul className="flex-1 space-y-2 mb-6">
              {tier.features.map((feature) => (
                <li
                  key={feature.text}
                  className="flex items-start gap-2 text-sm"
                >
                  {feature.included ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <Minus className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
                  )}
                  <span
                    className={
                      feature.included
                        ? "text-[var(--text-secondary)]"
                        : "text-[var(--text-tertiary)]"
                    }
                  >
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            {"href" in tier.cta ? (
              <Link
                href={tier.cta.href!}
                className={`block w-full rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-colors ${
                  tier.recommended
                    ? "bg-[var(--accent)] text-white hover:bg-cyan-500"
                    : "bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                {tier.cta.label}
              </Link>
            ) : (
              <SubscribeButton
                plan={tier.cta.plan!}
                recommended={tier.recommended}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

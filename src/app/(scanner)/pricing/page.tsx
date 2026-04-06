import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { WaitlistForm } from "@/components/scanner/WaitlistForm";

export const metadata: Metadata = {
  title: "Pricing — MCP Scanner",
  description:
    "MCP Scanner is free for everyone. Pro tier coming soon with advanced features.",
};

const freeFeatures = [
  "122 security rules",
  "OWASP MCP Top 10 mapping",
  "Config scanner",
  "Bulk scanning",
  "CI/CD integration",
  "SARIF & JSON exports",
  "Webhooks & API keys",
  "Security badges",
];

const proFeatures = [
  "Private repository scanning",
  "Daily continuous monitoring",
  "AI-powered fix suggestions",
  "Team dashboard & analytics",
  "SSO / SAML",
  "Priority support",
];

export default function PricingPage() {
  return (
    <div className="py-24">
      <div className="mx-auto max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--border)]">
        {/* Free Tier */}
        <div className="bg-[var(--bg)] p-10 flex flex-col">
          <h2 className="text-3xl font-medium text-balance">Free</h2>
          <div className="mt-4 flex items-baseline gap-2">
            <span
              className="text-4xl font-semibold text-[var(--fg)]"
              style={{ fontFamily: "'Geist Mono', monospace" }}
            >
              $0
            </span>
            <span className="text-[var(--fg-faint)]">/ forever</span>
          </div>
          <p className="mt-3 text-sm text-[var(--fg-muted)] text-pretty">
            Everything. No limits. No catch.
          </p>

          <ul className="mt-8 space-y-3 flex-1">
            {freeFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm">
                <Check
                  className="size-4 shrink-0 text-[var(--fg-ghost)]"
                  aria-hidden="true"
                />
                <span className="text-[var(--fg-muted)]">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <Link href="/scan" className="btn-primary inline-block text-center w-full">
              Get Started
            </Link>
          </div>
        </div>

        {/* Pro Tier */}
        <div className="bg-[var(--bg)] p-10 flex flex-col">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-medium text-balance">Pro</h2>
            <span className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-xs text-[var(--fg-ghost)]">
              Coming Soon
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-[var(--fg-muted)] text-pretty">
              Private repos, continuous monitoring, team dashboard.
            </p>
          </div>

          <ul className="mt-8 space-y-3 flex-1">
            {proFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm">
                <Check
                  className="size-4 shrink-0 text-[var(--fg-ghost)]"
                  aria-hidden="true"
                />
                <span className="text-[var(--fg-muted)]">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <WaitlistForm
              plan="pro"
              buttonLabel="Join Waitlist"
              recommended={false}
            />
          </div>
        </div>
      </div>

      {/* Bottom line */}
      <p className="mt-16 text-center text-sm text-[var(--fg-ghost)]">
        Free for open source. Forever.
      </p>
    </div>
  );
}

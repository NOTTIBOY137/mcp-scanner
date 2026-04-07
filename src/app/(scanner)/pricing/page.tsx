import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { WaitlistForm } from "@/components/scanner/WaitlistForm";

export const metadata: Metadata = {
  title: "Pricing",
  description: "MCP Scanner is free for everyone. Pro tier coming soon.",
  alternates: { canonical: "/pricing" },
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
    <div className="pt-20 pb-24">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          Pricing
        </h1>
        <p className="mt-3 text-muted">
          Everything you need to secure MCP servers. Free forever.
        </p>
      </div>

      <div className="mx-auto max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free */}
        <div className="rounded-xl border border-white/10 bg-card p-8 flex flex-col">
          <h2 className="text-2xl font-semibold text-foreground">Free</h2>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-bold font-mono tabular-nums text-foreground">$0</span>
            <span className="text-muted-foreground">/ forever</span>
          </div>
          <p className="mt-3 text-sm text-muted">
            Everything. No limits. No catch.
          </p>

          <ul className="mt-8 space-y-3 flex-1">
            {freeFeatures.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm">
                <Check className="size-4 shrink-0 text-secure" aria-hidden="true" />
                <span className="text-muted">{f}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Link
              href="/scan"
              className="block w-full rounded-lg bg-white px-6 py-3 text-sm font-medium text-black text-center transition hover:bg-gray-200"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Pro */}
        <div className="rounded-xl border border-white/10 bg-card p-8 flex flex-col">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-foreground">Pro</h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              Coming Soon
            </span>
          </div>
          <p className="mt-3 text-sm text-muted">
            Private repos, continuous monitoring, team dashboard.
          </p>

          <ul className="mt-8 space-y-3 flex-1">
            {proFeatures.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm">
                <Check className="size-4 shrink-0 text-brand-400" aria-hidden="true" />
                <span className="text-muted">{f}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <WaitlistForm plan="pro" buttonLabel="Join Waitlist" recommended={false} />
          </div>
        </div>
      </div>

      <p className="mt-16 text-center text-sm text-muted-foreground">
        Free for open source. Forever.
      </p>
    </div>
  );
}

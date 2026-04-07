import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How MCP Scanner collects, uses, and protects your data. Learn about our privacy practices, third-party services, and your GDPR rights.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl pt-20 pb-24">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
        Privacy Policy
      </h1>
      <p className="text-sm text-muted-foreground mb-12">
        Last updated: April 2026
      </p>

      <div className="space-y-12">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            What We Collect
          </h2>
          <p className="text-muted leading-relaxed mb-3">
            When you use MCP Scanner we collect the minimum data needed to
            operate the service:
          </p>
          <ul className="list-disc pl-5 text-muted leading-relaxed space-y-1.5">
            <li>
              <strong className="text-foreground">GitHub repository URLs</strong>{" "}
              you submit for scanning.
            </li>
            <li>
              <strong className="text-foreground">Scan results</strong> —
              findings, grades, and metadata produced by the scanner.
            </li>
            <li>
              <strong className="text-foreground">Email address</strong>{" "}
              provided through Clerk when you create an account.
            </li>
            <li>
              <strong className="text-foreground">Basic analytics</strong>{" "}
              collected by Vercel Analytics (page views, web vitals).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            What We Do Not Collect
          </h2>
          <p className="text-muted leading-relaxed">
            We do not store source code. The scanner fetches repository contents
            at scan time, evaluates them against our detection rules, and retains
            only the resulting findings. Once the scan completes, no source code
            remains on our infrastructure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Cookies
          </h2>
          <p className="text-muted leading-relaxed">
            MCP Scanner uses a small number of cookies that are strictly
            necessary or analytical:
          </p>
          <ul className="list-disc pl-5 text-muted leading-relaxed space-y-1.5 mt-3">
            <li>
              <strong className="text-foreground">Clerk session cookie</strong>{" "}
              — keeps you signed in.
            </li>
            <li>
              <strong className="text-foreground">Vercel Analytics</strong>{" "}
              — anonymous performance and usage metrics.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Third-Party Services
          </h2>
          <p className="text-muted leading-relaxed mb-3">
            We rely on the following providers to deliver the service:
          </p>
          <ul className="list-disc pl-5 text-muted leading-relaxed space-y-1.5">
            <li>
              <strong className="text-foreground">Clerk</strong> —
              authentication and user management.
            </li>
            <li>
              <strong className="text-foreground">Neon</strong> — PostgreSQL
              database for scan results and server data.
            </li>
            <li>
              <strong className="text-foreground">Upstash</strong> — Redis
              caching and rate limiting.
            </li>
            <li>
              <strong className="text-foreground">Vercel</strong> — hosting,
              edge network, and analytics.
            </li>
            <li>
              <strong className="text-foreground">Resend</strong> — transactional
              email delivery.
            </li>
          </ul>
          <p className="text-muted leading-relaxed mt-3">
            Each provider operates under its own privacy policy. We encourage you
            to review them independently.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Data Retention
          </h2>
          <p className="text-muted leading-relaxed">
            Scan results are retained for 90 days from the date of the scan.
            After that period, findings and associated metadata are permanently
            deleted. Account data is kept for as long as your account remains
            active.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Your Rights (GDPR)
          </h2>
          <p className="text-muted leading-relaxed">
            If you are located in the European Economic Area, you have the right
            to access, correct, or delete your personal data. To submit a data
            deletion or access request, email{" "}
            <a
              href="mailto:security@mcpscanner.cloud"
              className="text-brand-400 hover:underline"
            >
              security@mcpscanner.cloud
            </a>
            . We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Contact
          </h2>
          <p className="text-muted leading-relaxed">
            For privacy-related questions or concerns, reach us at{" "}
            <a
              href="mailto:security@mcpscanner.cloud"
              className="text-brand-400 hover:underline"
            >
              security@mcpscanner.cloud
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

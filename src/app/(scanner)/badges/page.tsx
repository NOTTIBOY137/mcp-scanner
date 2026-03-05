import { db } from "@/lib/db";
import { servers } from "@/db/schema";
import { desc, isNotNull } from "drizzle-orm";
import { Award, Scan, Copy, FileText } from "lucide-react";
import { BadgeGenerator } from "@/components/scanner/BadgeGenerator";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Badges for MCP Servers",
  description:
    "Add a security badge to your MCP server README. Show users your server has been independently scanned.",
};

export const revalidate = 3600;

export default async function BadgesPage() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";

  let examples: { owner: string; repo: string; latestGrade: string | null; latestScore: number | null }[] = [];
  try {
    examples = await db
      .select({
        owner: servers.owner,
        repo: servers.repo,
        latestGrade: servers.latestGrade,
        latestScore: servers.latestScore,
      })
      .from(servers)
      .where(isNotNull(servers.latestGrade))
      .orderBy(desc(servers.latestScore))
      .limit(3);
  } catch {
    // DB may be unavailable
  }

  return (
    <div className="mx-auto max-w-3xl space-y-16">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h1 className="font-display text-3xl font-bold">Security Badges</h1>
        <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
          Show the world your MCP server is safe. Add a live-updating security
          badge to your README.
        </p>
      </div>

      {/* Live Examples */}
      {examples.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
            Live Examples
          </h2>
          <div className="flex flex-wrap gap-4">
            {examples.map((s) => (
              <a
                key={`${s.owner}/${s.repo}`}
                href={`/server/${s.owner}/${s.repo}`}
                className="card flex items-center gap-3 px-4 py-3 hover:border-[var(--border-accent)] transition-colors"
              >
                <img
                  src={`/api/badge/${s.owner}/${s.repo}.svg`}
                  alt={`${s.owner}/${s.repo} security badge`}
                  height={20}
                />
                <span className="text-sm text-[var(--text-secondary)]">
                  {s.owner}/{s.repo}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Badge Generator */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
          Generate Your Badge
        </h2>
        <BadgeGenerator appUrl={appUrl} />
      </section>

      {/* How it Works */}
      <section className="space-y-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
          How It Works
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              step: "1",
              icon: Scan,
              title: "Scan your server",
              desc: "Submit your GitHub repo URL on the scan page.",
            },
            {
              step: "2",
              icon: Award,
              title: "Get your grade",
              desc: "We analyze your server for 30+ security checks.",
            },
            {
              step: "3",
              icon: Copy,
              title: "Copy the badge code",
              desc: "Use the generator above to get Markdown or HTML.",
            },
            {
              step: "4",
              icon: FileText,
              title: "Add to your README",
              desc: "Badge updates automatically on every rescan.",
            },
          ].map((item) => (
            <div key={item.step} className="card p-4 flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10">
                <item.icon className="h-4 w-4 text-[var(--accent)]" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[var(--text-primary)]">{item.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
          FAQ
        </h2>
        <div className="space-y-2">
          {[
            {
              q: "How often does the badge update?",
              a: "Badges are cached for 1 hour (Cache-Control: max-age=3600). After a rescan, the badge will reflect the new grade within an hour.",
            },
            {
              q: "What if my server hasn't been scanned?",
              a: "The badge will show 'Not Scanned' with a gray background. Scan your server first to get a grade.",
            },
            {
              q: "Can I customize the badge style?",
              a: "Currently we offer the standard flat badge style. More styles may be added in the future.",
            },
            {
              q: "Does the badge affect my SEO?",
              a: "No. The badge is an SVG image served with proper caching headers. It won't affect your page load or SEO.",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="card group"
            >
              <summary className="cursor-pointer p-4 font-medium text-sm select-none list-none flex items-center justify-between text-[var(--text-primary)]">
                {item.q}
                <svg
                  className="h-4 w-4 text-[var(--text-tertiary)] transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="px-4 pb-4 text-sm text-[var(--text-secondary)]">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="text-center space-y-4 pb-8">
        <p className="text-[var(--text-secondary)]">
          Don&apos;t have a grade yet?
        </p>
        <a href="/scan" className="btn-primary inline-block">
          Scan Your Server
        </a>
      </div>
    </div>
  );
}

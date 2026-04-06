import { db } from "@/lib/db";
import { servers } from "@/db/schema";
import { desc, isNotNull } from "drizzle-orm";
import Link from "next/link";
import { BadgeGenerator } from "@/components/scanner/BadgeGenerator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Badges",
  description: "Add a security badge to your MCP server README.",
};

export const revalidate = 3600;

export default async function BadgesPage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";

  let examples: { owner: string; repo: string; latestGrade: string | null; latestScore: number | null }[] = [];
  try {
    examples = await db
      .select({ owner: servers.owner, repo: servers.repo, latestGrade: servers.latestGrade, latestScore: servers.latestScore })
      .from(servers)
      .where(isNotNull(servers.latestGrade))
      .orderBy(desc(servers.latestScore))
      .limit(3);
  } catch { /* DB may be unavailable */ }

  return (
    <div className="mx-auto max-w-2xl pt-20 pb-24">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">Security Badges</h1>
        <p className="mt-3 text-muted leading-relaxed">Add a live-updating security badge to your README.</p>
      </div>

      {/* Live Examples */}
      {examples.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Live examples</h2>
          <div className="flex flex-wrap gap-3">
            {examples.map((s) => (
              <div key={`${s.owner}/${s.repo}`} className="rounded-xl border border-white/10 bg-card flex items-center gap-3 px-4 py-3">
                <img src={`/api/badge/${s.owner}/${s.repo}.svg`} alt={`${s.owner}/${s.repo} badge`} height={20} />
                <span className="text-sm text-muted">{s.owner}/{s.repo}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generator */}
      <div className="mb-10">
        <h2 className="text-sm font-medium text-muted-foreground mb-4">Generate your badge</h2>
        <BadgeGenerator appUrl={appUrl} />
      </div>

      {/* How it works */}
      <div className="mb-10">
        <h2 className="text-sm font-medium text-muted-foreground mb-4">How it works</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { step: "1", title: "Scan your server", desc: "Submit your GitHub repo URL on the scan page." },
            { step: "2", title: "Get your grade", desc: "We analyze for 122 security patterns." },
            { step: "3", title: "Copy the badge code", desc: "Use the generator above for Markdown or HTML." },
            { step: "4", title: "Add to your README", desc: "Badge updates automatically on every rescan." },
          ].map((item) => (
            <div key={item.step} className="rounded-xl border border-white/10 bg-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex size-6 items-center justify-center rounded-md bg-white/5 text-xs font-mono text-muted-foreground">{item.step}</span>
                <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
              </div>
              <p className="text-sm text-muted ml-8">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-4">
        <p className="text-muted mb-4">Don&apos;t have a grade yet?</p>
        <Link href="/scan" className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-gray-200 inline-block">
          Scan Your Server
        </Link>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Bug,
  Lock,
  Globe,
  ArrowRight,
  ChevronDown,
  Scan,
  FileWarning,
} from "lucide-react";
import { HomeSearchBar } from "@/components/scanner/HomeSearchBar";
import { JsonLd } from "@/components/JsonLd";
import { useState } from "react";

/* ─── Animation variants ─── */
const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const fadeSlide = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

/* ─── Data ─── */
const capabilities = [
  {
    icon: Shield,
    title: "Tool Poisoning",
    desc: "Detect hidden instructions in tool descriptions that manipulate AI agents into performing unintended actions.",
    badge: "12 rules",
  },
  {
    icon: Bug,
    title: "Prompt Injection",
    desc: "Find injection vulnerabilities in tool parameters, responses, and metadata that override AI agent behavior.",
    badge: "14 rules",
  },
  {
    icon: Lock,
    title: "Rug Pull Prevention",
    desc: "Track tool definition changes between scans with SHA-256 hashing. Detect post-approval behavior modifications.",
    badge: "8 rules",
  },
  {
    icon: Globe,
    title: "Cross-Origin Escalation",
    desc: "Identify shadow MCP servers, proxy relays, and undocumented tool registrations expanding the attack surface.",
    badge: "5 rules",
  },
  {
    icon: FileWarning,
    title: "Credential Theft",
    desc: "Detect hardcoded API keys, tokens, and secrets across 15+ providers. Entropy-based detection for unknown patterns.",
    badge: "12 rules",
  },
  {
    icon: Scan,
    title: "Config Scanner",
    desc: "Paste your claude_desktop_config.json to find dangerous commands, non-HTTPS endpoints, and excessive permissions.",
    badge: "New",
  },
];

const faqs = [
  {
    q: "What is MCP Scanner?",
    a: "MCP Scanner is a free, open-source security tool that scans Model Context Protocol (MCP) servers for vulnerabilities including tool poisoning, prompt injection, rug pulls, and cross-origin escalation attacks.",
  },
  {
    q: "What vulnerabilities does it detect?",
    a: "122 rules across 15 categories: tool poisoning, command injection, path traversal, SSRF, credential theft, excessive permissions, missing auth, supply chain risks, rug pulls, data exfiltration, insecure communication, and more.",
  },
  {
    q: "Is MCP Scanner free?",
    a: "Yes. Completely free and open source. All features — scanning, config analysis, bulk scan, CI/CD integration, API access, webhooks — available at no cost.",
  },
  {
    q: "How does the security leaderboard work?",
    a: "Every scanned server receives a grade from A to F based on 122 security rules. The leaderboard ranks all servers publicly by score.",
  },
  {
    q: "What is the Model Context Protocol?",
    a: "MCP is an open protocol that connects AI assistants like Claude, ChatGPT, and Cursor to external tools and data sources.",
  },
];

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-zinc-800">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left cursor-pointer"
        aria-expanded={open}
      >
        <span className="text-[15px] font-medium text-zinc-100">{q}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <p className="pb-5 text-sm text-zinc-400 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "MCP Scanner",
          url: "https://mcpscanner.cloud",
          applicationCategory: "SecurityApplication",
          operatingSystem: "Any",
          description:
            "Free security scanner for MCP servers. Detects tool poisoning, prompt injection, rug pulls, and cross-origin attacks.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />

      {/* ════════ HERO ════════ */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-4 text-center">
        {/* Background: dot grid with mask */}
        <div
          className="fixed inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]"
          aria-hidden="true"
        />
        {/* Ambient gradient blob */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none"
          aria-hidden="true"
        />

        <motion.div
          className="relative z-10 max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {/* Status badge */}
          <motion.div variants={item}>
            <Link
              href="https://github.com/NOTTIBOY137/mcp-scanner"
              target="_blank"
              rel="noopener noreferrer"
              className="group mx-auto mb-8 inline-flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-sm text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800/50"
            >
              <span className="mr-1 size-2 rounded-full bg-secure animate-pulse" aria-hidden="true" />
              Open Source — Free Forever
              <span className="h-4 w-px bg-zinc-700" aria-hidden="true" />
              <span className="flex items-center gap-1 text-zinc-400 group-hover:text-zinc-200 transition-colors">
                Star on GitHub
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={item}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-50 leading-[1.1]"
          >
            Scan your MCP servers{" "}
            <span className="bg-gradient-to-r from-[#6366F1] to-[#0EA5E9] bg-clip-text text-transparent">
              before attackers do
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={item}
            className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed"
          >
            MCP Scanner is a free, open-source security tool that detects tool
            poisoning, prompt injection, rug pulls, and cross-origin escalation
            attacks in Model Context Protocol servers.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={item}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              href="/scan"
              className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-gray-200 cursor-pointer"
            >
              Scan Now — Free
            </Link>
            <Link
              href="https://github.com/NOTTIBOY137/mcp-scanner"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800/80 cursor-pointer"
            >
              View on GitHub →
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ════════ STATS ════════ */}
      <motion.section
        className="py-20 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
      >
        <div className="grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
          {[
            { value: "122", label: "Detection Rules" },
            { value: "15", label: "Vulnerability Categories" },
            { value: "10/10", label: "OWASP MCP Coverage" },
          ].map(({ value, label }) => (
            <motion.div
              key={label}
              variants={fadeSlide}
              className="rounded-xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/30 p-6 text-center"
            >
              <p className="text-4xl font-bold tracking-tight text-zinc-50 font-mono tabular-nums">
                {value}
              </p>
              <p className="mt-1 text-sm text-zinc-500">{label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ════════ WHAT IS MCP SCANNER ════════ */}
      <motion.section
        className="py-20 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeSlide}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-50">
            What is MCP Scanner?
          </h2>
          <p className="mt-4 text-zinc-400 leading-relaxed">
            MCP Scanner analyzes Model Context Protocol (MCP) servers for
            security vulnerabilities. MCP is the protocol that connects AI
            agents like Claude, ChatGPT, and Cursor to external tools and data
            sources. MCP Scanner checks these connections for tool poisoning
            attacks, prompt injection vulnerabilities, rug pull risks, and
            cross-origin privilege escalation. It maintains a public leaderboard
            ranking MCP servers by security score, helping developers choose safe
            integrations for their AI agent workflows.
          </p>
        </div>
      </motion.section>

      {/* ════════ CAPABILITIES ════════ */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeSlide}
          >
            <p className="text-xs tracking-widest text-zinc-500 uppercase">
              [ Capabilities ]
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-50">
              Built for MCP security
            </h2>
          </motion.div>

          <motion.div
            className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            {capabilities.map(({ icon: Icon, title, desc, badge }) => (
              <motion.div
                key={title}
                variants={fadeSlide}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-b from-zinc-900/60 to-zinc-950/30 p-6 transition-colors duration-300 hover:border-zinc-700"
              >
                {/* Hover glow */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/70">
                      <Icon className="size-5 text-zinc-200" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-medium text-zinc-100">
                          {title}
                        </h3>
                        {badge && (
                          <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] leading-none text-zinc-400">
                            {badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════ FAQ ════════ */}
      <motion.section
        className="py-20 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeSlide}
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-50 text-center mb-10">
            Frequently asked questions
          </h2>
          <div className="border-t border-zinc-800">
            {faqs.map((faq) => (
              <FAQ key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </motion.section>

      {/* ════════ CTA ════════ */}
      <section className="py-24 px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-50">
          Ready to secure your MCP servers?
        </h2>
        <p className="mt-4 text-zinc-400 max-w-lg mx-auto leading-relaxed">
          Start scanning in seconds. No account required.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/scan"
            className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-gray-200 cursor-pointer"
          >
            Scan Now — Free
          </Link>
          <Link
            href="/docs"
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800/80 cursor-pointer"
          >
            Read the Docs →
          </Link>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="py-12 text-center border-t border-zinc-800">
        <p className="text-sm text-zinc-400">
          MCP Scanner — Free and open source
          <span className="mx-2">·</span>
          <a
            href="https://github.com/NOTTIBOY137/mcp-scanner"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            GitHub
          </a>
        </p>
      </footer>
    </>
  );
}

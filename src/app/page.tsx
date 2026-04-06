"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Bug,
  Lock,
  Globe,
  BarChart3,
  Github,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { HomeSearchBar } from "@/components/scanner/HomeSearchBar";
import { JsonLd } from "@/components/JsonLd";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const features = [
  { icon: Shield, title: "Tool Poisoning Detection", desc: "Detect hidden instructions in MCP tool descriptions that manipulate AI agents into performing unintended actions." },
  { icon: Bug, title: "Prompt Injection Scanning", desc: "Find injection vulnerabilities in tool parameters, responses, and metadata across 14 detection rules." },
  { icon: Lock, title: "Rug Pull Prevention", desc: "Track tool definition changes between scans with SHA-256 hashing to detect post-approval behavior modifications." },
  { icon: Globe, title: "Cross-Origin Detection", desc: "Identify shadow MCP servers, proxy relays, and undocumented tool registrations that expand the attack surface." },
  { icon: BarChart3, title: "Security Leaderboard", desc: "Public rankings of MCP servers by security score. Every scan is graded A through F with OWASP mapping." },
  { icon: Github, title: "Open Source & Free", desc: "122 detection rules, SARIF exports, CI/CD integration, config scanning, and bulk analysis — all free forever." },
];

const faqs = [
  { q: "What is MCP Scanner?", a: "MCP Scanner is a free, open-source security tool that scans Model Context Protocol (MCP) servers for vulnerabilities including tool poisoning, prompt injection, rug pulls, and cross-origin escalation attacks." },
  { q: "What vulnerabilities does it detect?", a: "122 rules across 15 categories: tool poisoning, command injection, path traversal, SSRF, credential theft, excessive permissions, missing auth, supply chain risks, rug pulls, data exfiltration, insecure communication, and more. Every finding maps to the OWASP MCP Top 10." },
  { q: "Is MCP Scanner free?", a: "Yes. MCP Scanner is completely free and open source. All features — scanning, config analysis, bulk scan, CI/CD integration, API access, webhooks — are available at no cost." },
  { q: "How does the security leaderboard work?", a: "Every scanned server receives a grade from A (excellent) to F (critical risk) based on 122 security rules. Scores factor in finding severity, confidence levels, and category coverage. The leaderboard ranks all scanned servers publicly." },
  { q: "What is the Model Context Protocol?", a: "MCP is an open protocol that connects AI assistants like Claude, ChatGPT, and Cursor to external tools and data sources. MCP servers provide capabilities (file access, APIs, databases) that AI agents can invoke during conversations." },
];

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-[15px] font-medium text-foreground">{q}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <p className="pb-5 text-sm text-muted leading-relaxed">{a}</p>
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
          url: "https://mcp-scanner-kappa.vercel.app",
          applicationCategory: "SecurityApplication",
          operatingSystem: "Any",
          description: "Free security scanner for Model Context Protocol (MCP) servers. Detects tool poisoning, prompt injection, rug pulls, and cross-origin attacks.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          featureList: ["Tool Poisoning Detection", "Prompt Injection Scanning", "Rug Pull Prevention", "Cross-Origin Escalation Detection", "Security Leaderboard"],
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

      {/* Hero */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-4 text-center">
        {/* Background */}
        <div className="fixed inset-0 -z-10 h-full w-full bg-background dot-grid" aria-hidden="true" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-brand-500/10 blur-3xl pointer-events-none" aria-hidden="true" />

        <motion.div
          className="relative z-10 max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {/* Status badge */}
          <motion.div variants={staggerItem} className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-300">
            <span className="mr-2 size-2 rounded-full bg-secure animate-pulse" aria-hidden="true" />
            Open Source — Free Forever
          </motion.div>

          <motion.h1
            variants={staggerItem}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1]"
          >
            Scan your MCP servers{" "}
            <span className="bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">
              before attackers do
            </span>
          </motion.h1>

          <motion.p
            variants={staggerItem}
            className="mt-6 text-lg text-muted max-w-2xl mx-auto leading-relaxed"
          >
            MCP Scanner is a free, open-source security tool that detects tool poisoning,
            prompt injection, rug pulls, and cross-origin escalation attacks in Model Context
            Protocol servers. Trusted by developers to protect AI agent workflows.
          </motion.p>

          <motion.div variants={staggerItem} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/scan" className="btn-primary">
              Scan Now — Free
            </Link>
            <Link
              href="https://github.com/NOTTIBOY137/mcp-scanner"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              View on GitHub <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <motion.section
        className="py-20 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
      >
        <div className="grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
          {[
            { value: "122", label: "Detection Rules" },
            { value: "15", label: "Vulnerability Categories" },
            { value: "10/10", label: "OWASP MCP Coverage" },
          ].map(({ value, label }) => (
            <motion.div
              key={label}
              variants={staggerItem}
              className="rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-6 text-center"
            >
              <p className="text-4xl font-bold tracking-tight text-foreground font-mono">
                {value}
              </p>
              <p className="mt-1 text-sm text-muted">{label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* What is MCP Scanner */}
      <motion.section
        className="py-20 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeUp}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            What is MCP Scanner?
          </h2>
          <p className="mt-4 text-muted leading-relaxed">
            MCP Scanner (also known as MCPGuard) is a security scanning platform that analyzes
            Model Context Protocol (MCP) servers for vulnerabilities. MCP is the protocol that
            connects AI agents like Claude, ChatGPT, and Cursor to external tools and data sources.
            MCP Scanner checks these connections for tool poisoning attacks, prompt injection
            vulnerabilities, rug pull risks (where tool behavior changes after approval), and
            cross-origin privilege escalation. It maintains a public leaderboard ranking MCP servers
            by security score, helping developers choose safe integrations for their AI agent workflows.
          </p>
        </div>
      </motion.section>

      {/* Features */}
      <motion.section
        className="py-20 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
      >
        <motion.h2
          variants={staggerItem}
          className="text-3xl sm:text-4xl font-semibold tracking-tight text-center mb-12"
        >
          Built for MCP security
        </motion.h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={staggerItem}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative rounded-xl border border-white/10 bg-card p-6 transition-all duration-300 hover:border-white/20 hover:bg-card-hover"
            >
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-white/5">
                <Icon className="size-5 text-brand-400" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* FAQ */}
      <motion.section
        className="py-20 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeUp}
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center mb-10">
            Frequently asked questions
          </h2>
          <div className="border-t border-white/10">
            {faqs.map((faq) => (
              <FAQ key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      <section className="py-24 px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Ready to secure your MCP servers?
        </h2>
        <p className="mt-4 text-muted max-w-lg mx-auto leading-relaxed">
          Start scanning in seconds. No account required.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/scan" className="btn-primary">
            Scan Now — Free
          </Link>
          <Link href="/docs" className="btn-secondary">
            Read the Docs <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center border-t border-white/10">
        <p className="text-sm text-muted-foreground">
          MCP Scanner — Free and open source
          <span className="mx-2">·</span>
          <a
            href="https://github.com/NOTTIBOY137/mcp-scanner"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </p>
      </footer>
    </>
  );
}

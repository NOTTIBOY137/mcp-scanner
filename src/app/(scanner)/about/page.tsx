import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "MCP Scanner is a free, open-source security scanner for Model Context Protocol servers. Built by Naresh Kandula.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl pt-20 pb-24">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-10">
        About MCP Scanner
      </h1>

      <div className="space-y-12">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            What is MCP Scanner?
          </h2>
          <p className="text-muted leading-relaxed">
            MCP Scanner is a free, open-source security scanner purpose-built for
            Model Context Protocol servers. It analyzes GitHub repositories for
            vulnerability patterns, grades them on a standardized scale, and maps
            every finding to the OWASP MCP Top 10 with CWE references. Reports
            are available in SARIF, JSON, and OWASP compliance formats.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Who Built It
          </h2>
          <p className="text-muted leading-relaxed">
            MCP Scanner was created by{" "}
            <a
              href="https://github.com/NOTTIBOY137"
              className="text-brand-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Naresh Kandula
            </a>{" "}
            — a developer focused on AI agent security. The project grew out of a
            simple observation: as AI agents adopt the Model Context Protocol,
            the attack surface expands and existing security tooling has not kept
            pace.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Why It Exists
          </h2>
          <p className="text-muted leading-relaxed">
            MCP security affects every developer building with AI agents. A
            single insecure MCP server can expose secrets, allow command
            injection, or enable data exfiltration across an entire agent
            pipeline. Security tooling for this ecosystem should be free and
            accessible to everyone — not locked behind enterprise contracts.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Open Source
          </h2>
          <p className="text-muted leading-relaxed">
            The scanner, detection rules, and web interface are all open source.
            Contributions, bug reports, and rule suggestions are welcome.
          </p>
          <p className="text-muted leading-relaxed mt-3">
            <a
              href="https://github.com/NOTTIBOY137/mcp-scanner"
              className="text-brand-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/NOTTIBOY137/mcp-scanner
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            MCPGuard
          </h2>
          <p className="text-muted leading-relaxed">
            MCPGuard is a GitHub App that automatically scans pull requests for
            insecure MCP configuration files. It posts inline review comments
            with fix suggestions and can block merges when critical issues are
            found. Install it from the{" "}
            <Link
              href="/integrations"
              className="text-brand-400 hover:underline"
            >
              integrations page
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            By the Numbers
          </h2>
          <div className="grid grid-cols-3 gap-6 mt-4">
            <div>
              <p className="text-2xl font-semibold text-foreground">122</p>
              <p className="text-sm text-muted-foreground">Detection rules</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">15</p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">Top 10</p>
              <p className="text-sm text-muted-foreground">OWASP MCP mapped</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Contact
          </h2>
          <p className="text-muted leading-relaxed">
            General inquiries:{" "}
            <a
              href="mailto:hello@mcpscanner.cloud"
              className="text-brand-400 hover:underline"
            >
              hello@mcpscanner.cloud
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}

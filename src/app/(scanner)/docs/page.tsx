import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Documentation — MCP Security Scanner",
  description:
    "REST API reference for the MCP Security Scanner. Scan MCP servers, retrieve security grades, embed badges, and configure webhooks.",
};

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold">API Documentation</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          REST API reference for integrating with the MCP Security Scanner.
        </p>
      </div>

      {/* Score endpoint */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">GET /api/v1/score/:owner/:repo</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Retrieve the latest security grade and score for a repository.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-[var(--card-border)]">
              <tr><td className="py-1.5 pr-4 font-medium">Auth</td><td>Bearer API key (optional for anon)</td></tr>
              <tr><td className="py-1.5 pr-4 font-medium">Rate Limit</td><td>10/day anonymous, 100-10K/day by plan</td></tr>
            </tbody>
          </table>
        </div>
        <pre className="rounded-lg bg-[var(--bg-primary)] p-4 text-xs overflow-x-auto">
{`curl https://mcptrust.dev/api/v1/score/owner/repo \\
  -H "Authorization: Bearer mcp_your_key_here"`}
        </pre>
        <p className="text-xs text-[var(--text-secondary)]">Response:</p>
        <pre className="rounded-lg bg-[var(--bg-primary)] p-4 text-xs overflow-x-auto">
{`{
  "grade": "A",
  "score": 95,
  "findingsCount": 2,
  "filesScanned": 18,
  "scanId": "clxyz...",
  "scannedAt": "2025-01-15T10:30:00Z"
}`}
        </pre>
      </section>

      {/* Badge endpoint */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">GET /api/badge/:owner/:repo.svg</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Embeddable SVG badge showing the current security grade and score.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-[var(--card-border)]">
              <tr><td className="py-1.5 pr-4 font-medium">Auth</td><td>None</td></tr>
              <tr><td className="py-1.5 pr-4 font-medium">Cache</td><td>CDN cached 1 hour</td></tr>
            </tbody>
          </table>
        </div>
        <pre className="rounded-lg bg-[var(--bg-primary)] p-4 text-xs overflow-x-auto">
{`# Embed in markdown
![MCP Security](https://mcptrust.dev/api/badge/owner/repo.svg)`}
        </pre>
      </section>

      {/* Scan endpoint */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">POST /api/scan</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Initiate a new security scan for a GitHub repository.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-[var(--card-border)]">
              <tr><td className="py-1.5 pr-4 font-medium">Auth</td><td>None (public)</td></tr>
              <tr><td className="py-1.5 pr-4 font-medium">Rate Limit</td><td>5/hr per IP</td></tr>
            </tbody>
          </table>
        </div>
        <pre className="rounded-lg bg-[var(--bg-primary)] p-4 text-xs overflow-x-auto">
{`curl -X POST https://mcptrust.dev/api/scan \\
  -H "Content-Type: application/json" \\
  -d '{"repoUrl": "https://github.com/owner/repo"}'`}
        </pre>
        <p className="text-xs text-[var(--text-secondary)]">Response:</p>
        <pre className="rounded-lg bg-[var(--bg-primary)] p-4 text-xs overflow-x-auto">
{`{
  "id": "clxyz...",
  "serverId": "clabc...",
  "status": "pending"
}`}
        </pre>
      </section>

      {/* Webhooks endpoint */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">POST /api/webhooks</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Register a webhook to receive scan completion or failure events.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-[var(--card-border)]">
              <tr><td className="py-1.5 pr-4 font-medium">Auth</td><td>Clerk session (signed in)</td></tr>
              <tr><td className="py-1.5 pr-4 font-medium">Plan</td><td>Pro or Team</td></tr>
              <tr><td className="py-1.5 pr-4 font-medium">Rate Limit</td><td>60/min</td></tr>
            </tbody>
          </table>
        </div>
        <pre className="rounded-lg bg-[var(--bg-primary)] p-4 text-xs overflow-x-auto">
{`curl -X POST https://mcptrust.dev/api/webhooks \\
  -H "Content-Type: application/json" \\
  -H "Cookie: __session=..." \\
  -d '{"url": "https://your-app.com/hook", "events": ["scan.completed"]}'`}
        </pre>
        <p className="text-xs text-[var(--text-secondary)]">Response (201):</p>
        <pre className="rounded-lg bg-[var(--bg-primary)] p-4 text-xs overflow-x-auto">
{`{
  "id": "clxyz...",
  "secret": "abcdef0123456789...",
  "url": "https://your-app.com/hook",
  "events": ["scan.completed"]
}`}
        </pre>
      </section>

      {/* Error codes */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Error Codes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-left text-xs text-[var(--text-secondary)]">
                <th className="pb-2 pr-4">Code</th>
                <th className="pb-2">Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]/50">
              <tr><td className="py-1.5 pr-4 font-mono">400</td><td>Bad request / invalid input</td></tr>
              <tr><td className="py-1.5 pr-4 font-mono">401</td><td>Unauthorized / invalid API key</td></tr>
              <tr><td className="py-1.5 pr-4 font-mono">403</td><td>Forbidden / plan upgrade required</td></tr>
              <tr><td className="py-1.5 pr-4 font-mono">404</td><td>Resource not found</td></tr>
              <tr><td className="py-1.5 pr-4 font-mono">429</td><td>Rate limit exceeded</td></tr>
              <tr><td className="py-1.5 pr-4 font-mono">500</td><td>Internal server error</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Rate limit headers */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Rate Limit Headers</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          All API responses include rate limit information:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-left text-xs text-[var(--text-secondary)]">
                <th className="pb-2 pr-4">Header</th>
                <th className="pb-2">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]/50">
              <tr><td className="py-1.5 pr-4 font-mono text-xs">X-RateLimit-Remaining</td><td>Requests remaining in current window</td></tr>
              <tr><td className="py-1.5 pr-4 font-mono text-xs">X-RateLimit-Reset</td><td>Unix timestamp when the window resets</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

# Contributing to MCP Scanner

Thank you for your interest in contributing. This guide covers the process for submitting changes.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/mcp-scanner.git`
3. Install dependencies: `npm install`
4. Copy environment variables: `cp .env.example .env.local`
5. Start the dev server: `npm run dev`

## Adding Detection Rules

Rules live in `src/scanner/rules/`. Each file exports an array of `ScanRule` objects:

```typescript
{
  id: "XX001",           // Unique rule ID
  category: "...",       // One of the 15 VulnCategory values
  title: "...",          // Short title
  description: "...",    // What the rule detects and why it matters
  severity: "critical",  // critical | high | medium | low | info
  pattern: /regex/g,     // Detection pattern
  remediation: "...",    // How to fix it
  owaspMcpTop10: "MCP06", // OWASP MCP Top 10 category
  cweIds: ["CWE-78"],   // CWE identifiers
}
```

When adding a rule:
- Use the next sequential ID for the category (e.g., CI015 for command injection)
- Include `owaspMcpTop10` and `cweIds` mappings
- Add a `validator` function if the pattern has a high false positive rate
- Test against real MCP server codebases

## Code Style

- TypeScript strict mode
- No unused imports
- Run `npx tsc --noEmit` before submitting

## Pull Requests

1. Create a branch from `main`
2. Make your changes
3. Verify the build passes: `npm run build`
4. Run tests: `npm run test`
5. Open a PR with a clear description of what changed and why

## Reporting Security Issues

If you discover a security vulnerability in MCP Scanner itself, please report it privately via GitHub Security Advisories rather than opening a public issue.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

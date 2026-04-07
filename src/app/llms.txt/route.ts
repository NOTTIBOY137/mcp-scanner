export async function GET() {
  const content = `# MCP Scanner

> MCP Scanner is a free, open-source security scanning platform that analyzes Model Context Protocol (MCP) servers for vulnerabilities including tool poisoning, prompt injection, rug pulls, and cross-origin escalation attacks. It maintains a public security leaderboard ranking MCP servers by safety score.

## Core Pages

- [Home](https://mcpscanner.cloud/): Main landing page with security scanner
- [Leaderboard](https://mcpscanner.cloud/leaderboard): MCP servers ranked by security score
- [Scan](https://mcpscanner.cloud/scan): Run a security scan on any MCP server
- [Docs](https://mcpscanner.cloud/docs): API documentation and guides

## Key Concepts

- Tool Poisoning: Attack where MCP tool descriptions contain hidden instructions that manipulate AI agents
- Rug Pull: When an MCP server changes tool behavior after initial approval
- Cross-Origin Escalation: When one MCP server manipulates another server's tools
- Prompt Injection: Malicious input designed to override AI agent instructions via MCP tools
`;
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

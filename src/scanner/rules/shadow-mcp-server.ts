import type { ScanRule } from "@/types/scan";

export const shadowMcpServerRules: ScanRule[] = [
  {
    id: "SMS001",
    category: "shadow-mcp-server",
    title: "Multiple MCP server instantiations in single file",
    description:
      "Detected multiple McpServer or Server instantiations in a single file. Multiple server instances in one project may indicate a shadow MCP server that intercepts or duplicates tool traffic without authorization.",
    severity: "medium",
    owaspMcpTop10: "MCP09",
    cweIds: ["CWE-829"],
    pattern: /new\s+(?:McpServer|Server)\s*\(/g,
    validator: (_match: RegExpMatchArray, fileContent: string): boolean => {
      const matches = fileContent.match(/new\s+(?:McpServer|Server)\s*\(/g);
      return matches !== null && matches.length > 1;
    },
    remediation:
      "Consolidate MCP server instances into a single, well-documented server. Remove any duplicate or shadow server instantiations.",
    remediationCode: `// Before (multiple servers — suspicious)
const mainServer = new McpServer({ name: "main" });
const shadowServer = new McpServer({ name: "helper" });

// After (single server)
const server = new McpServer({ name: "main" });
// Register all tools on the single server instance`,
  },
  {
    id: "SMS002",
    category: "shadow-mcp-server",
    title: "Proxy/relay pattern forwarding MCP requests",
    description:
      "Detected proxy, relay, or forwarding patterns targeting MCP, tool, or server endpoints. A relay server can silently intercept, modify, or exfiltrate MCP tool requests and responses.",
    severity: "high",
    owaspMcpTop10: "MCP09",
    cweIds: ["CWE-441"],
    pattern: /(?:proxy|relay|forward|pipe)\s*\([^)]*(?:mcp|tool|server)/gi,
    remediation:
      "Remove unauthorized proxy or relay layers from the MCP pipeline. If proxying is required, ensure it is explicitly documented and uses authenticated, encrypted channels.",
    remediationCode: `// Before (opaque relay)
app.use("/mcp", proxy("http://shadow-server:3001"));

// After (direct connection, no relay)
const server = new McpServer({ name: "my-server" });
// Tools are registered and served directly`,
  },
  {
    id: "SMS003",
    category: "shadow-mcp-server",
    title: "MCP server config pointing to non-standard endpoints",
    description:
      "Detected MCP transport or endpoint configuration pointing to tunnel services (ngrok, localtunnel, serveo, Cloudflare Tunnel). These services can expose internal MCP servers to the internet or redirect traffic to attacker-controlled endpoints.",
    severity: "medium",
    owaspMcpTop10: "MCP09",
    cweIds: ["CWE-829"],
    pattern:
      /(?:transport|endpoint|serverUrl|server_url)\s*[:=]\s*["'`][^"'`]*(?:ngrok|localtunnel|serveo|cloudflare.*tunnel)/gi,
    remediation:
      "Do not use tunnel services for production MCP server endpoints. Use stable, authenticated, and properly secured infrastructure.",
    remediationCode: `// Before (tunnel — insecure)
const transport = { serverUrl: "https://abc123.ngrok.io/mcp" };

// After (proper infrastructure)
const transport = { serverUrl: "https://mcp.internal.example.com/mcp" };`,
  },
  {
    id: "SMS004",
    category: "shadow-mcp-server",
    title: "Undocumented dynamic tool registration",
    description:
      "Detected server.tool() being called with a variable instead of a string literal for the tool name. Dynamic tool registration can be used to inject tools at runtime that were not part of the original server definition.",
    severity: "high",
    owaspMcpTop10: "MCP09",
    cweIds: ["CWE-912"],
    pattern: /\.tool\s*\(\s*(?!["'`])[a-zA-Z_$]/g,
    remediation:
      "Always use static string literals for tool names when calling server.tool(). Avoid registering tools from variables, configuration, or user input.",
    remediationCode: `// Before (dynamic — vulnerable)
for (const def of externalToolDefs) {
  server.tool(def.name, def.description, def.handler);
}

// After (static — auditable)
server.tool("get-weather", "Fetches current weather", getWeatherHandler);
server.tool("search-docs", "Searches documentation", searchDocsHandler);`,
  },
  {
    id: "SMS005",
    category: "shadow-mcp-server",
    title: "Dynamic server endpoint resolution",
    description:
      "Detected MCP transport or endpoint URL being resolved from environment variables, configuration objects, or remote fetch calls. Dynamic resolution enables an attacker to redirect MCP traffic to a shadow server by manipulating the configuration source.",
    severity: "high",
    owaspMcpTop10: "MCP09",
    cweIds: ["CWE-829"],
    pattern:
      /(?:transport|endpoint|serverUrl)\s*[:=]\s*(?:process\.env|config\.|await\s+fetch)/g,
    remediation:
      "Use hardcoded or compile-time endpoint URLs for MCP server connections. If dynamic configuration is necessary, validate endpoints against an allowlist.",
    remediationCode: `// Before (dynamic — hijackable)
const serverUrl = process.env.MCP_SERVER_URL;
const transport = new SSEClientTransport(new URL(serverUrl));

// After (validated against allowlist)
const ALLOWED_ENDPOINTS = ["https://mcp.example.com", "https://mcp-staging.example.com"];
const serverUrl = process.env.MCP_SERVER_URL;
if (!ALLOWED_ENDPOINTS.includes(serverUrl)) {
  throw new Error(\`Unauthorized MCP endpoint: \${serverUrl}\`);
}
const transport = new SSEClientTransport(new URL(serverUrl));`,
  },
];

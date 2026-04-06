const CATEGORY_LABELS: Record<string, string> = {
  "tool-poisoning": "Tool Poisoning",
  "command-injection": "Command Injection",
  "path-traversal": "Path Traversal",
  ssrf: "SSRF",
  "credential-theft": "Credential Theft",
  "excessive-permissions": "Excessive Permissions",
  "missing-auth": "Missing Auth",
  "supply-chain": "Supply Chain",
  "rug-pull": "Rug Pull",
  "data-exfiltration": "Data Exfiltration",
  "insecure-communication": "Insecure Communication",
  "excessive-data-exposure": "Excessive Data Exposure",
  "logging-deficiency": "Logging Deficiency",
  "runtime-tool-poisoning": "Runtime Tool Poisoning",
  "shadow-mcp-server": "Shadow MCP Server",
};

const ACRONYMS = new Set(["ssrf", "xss", "api", "sql", "csrf", "idor", "mcp", "owasp", "cwe"]);

export function formatCategoryName(slug: string): string {
  if (CATEGORY_LABELS[slug]) return CATEGORY_LABELS[slug];
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w+/g, (w) =>
      ACRONYMS.has(w.toLowerCase())
        ? w.toUpperCase()
        : w.charAt(0).toUpperCase() + w.slice(1)
    );
}

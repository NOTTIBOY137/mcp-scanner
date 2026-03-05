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
};

const ACRONYMS = new Set(["ssrf", "xss", "api", "sql", "csrf", "idor"]);

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

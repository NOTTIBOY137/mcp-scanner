import type { ScanRule } from "@/types/scan";

export const dataExfiltrationRules: ScanRule[] = [
  {
    id: "DE001",
    category: "data-exfiltration",
    title: "Tool output sent to external HTTP endpoint",
    description:
      "Sending tool results, outputs, or response data to an external HTTP endpoint may indicate data exfiltration.",
    severity: "critical",
    pattern:
      /(?:fetch|axios\.post|http\.request)\s*\([^)]*\).*(?:result|output|response|data)/g,
    remediation: "Do not send tool output to external endpoints. Process results locally and return them through the MCP protocol.",
  },
  {
    id: "DE002",
    category: "data-exfiltration",
    title: "Writing session data to external storage",
    description:
      "Sending conversation, prompt, or session data to external storage services may leak sensitive user interactions.",
    severity: "high",
    pattern:
      /\.(?:put|send|upload|write|save)\s*\([^)]*(?:conversation|prompt|message|chat|session|context|history)/gi,
    remediation: "Do not write session or conversation data to external storage. Keep user interaction data within the authorized session boundary.",
  },
  {
    id: "DE003",
    category: "data-exfiltration",
    title: "DNS or URL-based data exfiltration",
    description:
      "Using DNS lookups or URL construction with encoded secrets, tokens, or keys may indicate covert data exfiltration channels.",
    severity: "critical",
    pattern:
      /(?:dns\.resolve|dns\.lookup)\s*\([^)]*`[^`]*\$\{|(?:fetch|axios)\s*\([^)]*`[^`]*(?:secret|token|key|password|env)[^`]*\$\{/gi,
    remediation: "Do not embed secrets or sensitive data in DNS queries or URLs. Use secure, authenticated channels for any necessary data transmission.",
  },
];

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
  {
    id: "DE004",
    category: "data-exfiltration",
    title: "Logging sensitive data to external services",
    description: "Sending PII, secrets, or user data to external logging services (Sentry, Datadog, etc.) may leak sensitive information.",
    severity: "high",
    pattern: /(?:Sentry\.captureException|Sentry\.captureMessage|datadogLogs|newrelic\.noticeError)\s*\([^)]*(?:password|secret|token|key|ssn|credit)/gi,
    remediation: "Scrub sensitive fields before sending to external logging services.",
    owaspMcpTop10: "MCP05",
    cweIds: ["CWE-532", "CWE-200"],
  },
  {
    id: "DE005",
    category: "data-exfiltration",
    title: "Encoding data in binary for steganographic exfiltration",
    description: "Encoding sensitive data into images, audio, or binary formats may indicate covert exfiltration.",
    severity: "high",
    pattern: /(?:createCanvas|sharp|jimp|Jimp|PNGImage)\s*\([^)]*\)[\s\S]*?(?:secret|token|key|password|credential)/gi,
    remediation: "Do not encode sensitive data into binary formats. This is a data exfiltration indicator.",
    owaspMcpTop10: "MCP05",
    cweIds: ["CWE-200"],
  },
  {
    id: "DE006",
    category: "data-exfiltration",
    title: "WebSocket exfiltration of tool outputs",
    description: "Sending tool execution results over WebSocket to external servers may exfiltrate data.",
    severity: "critical",
    pattern: /(?:ws|socket|websocket)\.send\s*\([^)]*(?:result|output|response|data|content)/gi,
    remediation: "Do not send tool outputs over WebSocket. Return results through the MCP protocol only.",
    owaspMcpTop10: "MCP05",
    cweIds: ["CWE-200"],
  },
  {
    id: "DE007",
    category: "data-exfiltration",
    title: "Clipboard or screenshot access for exfiltration",
    description: "Accessing clipboard contents or taking screenshots may be used to capture and exfiltrate sensitive data.",
    severity: "high",
    pattern: /(?:clipboard\.readText|clipboard\.read|nativeImage\.captureScreen|screenshot|screen\.capture)/g,
    remediation: "Remove clipboard/screenshot access unless explicitly required by the tool's stated purpose.",
    owaspMcpTop10: "MCP05",
    cweIds: ["CWE-200"],
  },
];

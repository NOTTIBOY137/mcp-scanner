import type { ScanRule } from "@/types/scan";

export const ssrfRules: ScanRule[] = [
  {
    id: "SSRF001",
    category: "ssrf",
    title: "HTTP request with unvalidated URL parameter",
    description:
      "Passing user-controlled variables directly to fetch, axios, or http.get without URL validation enables SSRF attacks.",
    severity: "high",
    pattern:
      /(?:fetch|axios\.(?:get|post|put|delete|patch|request)|http\.get|https\.get|got|request)\s*\(\s*(?!["'`]https?:\/\/)[a-zA-Z_$][a-zA-Z0-9_$.]*\s*[,)]/g,
    remediation: "Validate and sanitize all URLs before making HTTP requests. Use an allowlist of permitted domains.",
  },
  {
    id: "SSRF002",
    category: "ssrf",
    title: "Request to localhost or loopback address",
    description:
      "Requests targeting 127.0.0.1, localhost, or [::1] may access internal services not intended to be exposed.",
    severity: "high",
    pattern:
      /["'`]https?:\/\/(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?/g,
    remediation: "Block requests to localhost and loopback addresses. Implement URL validation that rejects 127.x.x.x and ::1.",
  },
  {
    id: "SSRF003",
    category: "ssrf",
    title: "Request to private network IP range",
    description:
      "Requests to RFC 1918 private IP ranges (10.x, 172.16-31.x, 192.168.x) or link-local (169.254.x) can reach internal infrastructure.",
    severity: "high",
    pattern:
      /["'`]https?:\/\/(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|169\.254\.\d{1,3}\.\d{1,3})(?::\d+)?/g,
    remediation: "Block requests to private IP ranges (10.x, 172.16-31.x, 192.168.x, 169.254.x). Validate URLs before fetching.",
  },
  {
    id: "SSRF004",
    category: "ssrf",
    title: "URL construction from user input",
    description:
      "Building URLs by concatenating or interpolating user input without an allowlist check enables SSRF via host manipulation.",
    severity: "medium",
    pattern:
      /new\s+URL\s*\(\s*(?:`[^`]*\$\{|[^)]*\+\s*(?:req\.|params\.|query\.|body\.|input\.|args\.))/g,
    remediation: "Do not construct URLs from unvalidated user input. Use a URL allowlist or domain restriction.",
  },
];

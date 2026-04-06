import type { ScanRule } from "@/types/scan";

export const insecureCommunicationRules: ScanRule[] = [
  {
    id: "IC001",
    category: "insecure-communication",
    title: "HTTP (non-TLS) endpoint usage",
    description:
      "Detected fetch, axios, or HTTP client calls using plain http:// URLs instead of https://. Data transmitted over unencrypted HTTP can be intercepted by network attackers, exposing sensitive tool inputs and outputs.",
    severity: "high",
    owaspMcpTop10: "MCP08",
    cweIds: ["CWE-319"],
    pattern:
      /(?:fetch|axios|http\.get|got|request)\s*\(\s*["'`]http:\/\/(?!(?:localhost|127\.0\.0\.1|0\.0\.0\.0))/g,
    remediation:
      "Replace all http:// URLs with https:// equivalents. Ensure the target server supports TLS and has a valid certificate.",
    remediationCode: `// Before (insecure)
fetch("http://api.example.com/data");

// After (secure)
fetch("https://api.example.com/data");`,
  },
  {
    id: "IC002",
    category: "insecure-communication",
    title: "TLS certificate verification disabled",
    description:
      "TLS certificate verification has been explicitly disabled via rejectUnauthorized: false or NODE_TLS_REJECT_UNAUTHORIZED=0. This makes the connection vulnerable to man-in-the-middle attacks even when using HTTPS.",
    severity: "critical",
    owaspMcpTop10: "MCP08",
    cweIds: ["CWE-295"],
    pattern:
      /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*["']?0/g,
    remediation:
      "Remove rejectUnauthorized: false and never set NODE_TLS_REJECT_UNAUTHORIZED=0. If you have certificate issues, install the proper CA bundle instead of disabling verification.",
    remediationCode: `// Before (insecure)
const agent = new https.Agent({ rejectUnauthorized: false });

// After (secure — use proper CA certificate)
const agent = new https.Agent({
  ca: fs.readFileSync("/path/to/ca-cert.pem"),
});`,
  },
  {
    id: "IC003",
    category: "insecure-communication",
    title: "Unencrypted WebSocket connection",
    description:
      "Detected use of ws:// (unencrypted WebSocket) instead of wss:// (encrypted). WebSocket traffic over ws:// is transmitted in plaintext and can be intercepted or tampered with by network attackers.",
    severity: "high",
    owaspMcpTop10: "MCP08",
    cweIds: ["CWE-319"],
    pattern:
      /new\s+WebSocket\s*\(\s*["'`]ws:\/\/(?!(?:localhost|127\.0\.0\.1))|["'`]ws:\/\/(?!(?:localhost|127\.0\.0\.1))[^"'`]*["'`]/g,
    remediation:
      "Replace ws:// with wss:// to ensure WebSocket connections are encrypted with TLS.",
    remediationCode: `// Before (insecure)
const ws = new WebSocket("ws://api.example.com/stream");

// After (secure)
const ws = new WebSocket("wss://api.example.com/stream");`,
  },
  {
    id: "IC004",
    category: "insecure-communication",
    title: "Missing HSTS headers on HTTP server",
    description:
      "An HTTP server is created without configuring Strict-Transport-Security (HSTS) headers. Without HSTS, browsers may allow downgrade attacks from HTTPS to HTTP.",
    severity: "medium",
    owaspMcpTop10: "MCP08",
    cweIds: ["CWE-319"],
    pattern: /\.listen\s*\(|createServer\s*\(/g,
    validator: (_match: RegExpMatchArray, fileContent: string): boolean => {
      const lower = fileContent.toLowerCase();
      return (
        !lower.includes("strict-transport-security") && !lower.includes("hsts")
      );
    },
    remediation:
      "Add Strict-Transport-Security headers to your server responses. Use a middleware such as helmet to set HSTS automatically.",
    remediationCode: `// Using helmet middleware (recommended)
import helmet from "helmet";
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));

// Or manually set the header
app.use((_req, res, next) => {
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});`,
  },
  {
    id: "IC005",
    category: "insecure-communication",
    title: "Weak or deprecated TLS configuration",
    description:
      "Detected use of SSLv3, TLS 1.0, or TLS 1.1, which are deprecated and have known vulnerabilities. These protocols are susceptible to POODLE, BEAST, and other attacks.",
    severity: "high",
    owaspMcpTop10: "MCP08",
    cweIds: ["CWE-326", "CWE-327"],
    pattern:
      /(?:SSLv3|TLSv1(?:\.0)?|TLS_method|secureProtocol\s*:\s*["'](?:SSLv3|TLSv1))/g,
    remediation:
      "Configure your server to use TLS 1.2 or TLS 1.3 only. Remove any references to SSLv3, TLSv1, or TLSv1.1.",
    remediationCode: `// Before (insecure)
const options = { secureProtocol: "TLSv1_method" };

// After (secure — enforce TLS 1.2+)
const options = {
  minVersion: "TLSv1.2",
  maxVersion: "TLSv1.3",
};`,
  },
];

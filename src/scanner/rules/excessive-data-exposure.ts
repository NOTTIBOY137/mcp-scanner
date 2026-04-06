import type { ScanRule } from "@/types/scan";

export const excessiveDataExposureRules: ScanRule[] = [
  {
    id: "EDE001",
    category: "excessive-data-exposure",
    title: "Returning entire database records without field filtering",
    description:
      "Detected SELECT * or ORM queries without explicit field selection. Returning all columns risks exposing sensitive fields (passwords, tokens, internal IDs) to the client or LLM context.",
    severity: "medium",
    owaspMcpTop10: "MCP05",
    cweIds: ["CWE-200"],
    pattern: /SELECT\s+\*\s+FROM|\.findMany\s*\(\s*\)|\.find\s*\(\s*\{\s*\}\s*\)/gi,
    remediation:
      "Always specify the exact columns or fields to return. Use SELECT with explicit column names or ORM select/projection options.",
    remediationCode: `// Before (over-exposed)
const users = await db.query("SELECT * FROM users");
const items = await prisma.item.findMany();

// After (filtered)
const users = await db.query("SELECT id, name, email FROM users");
const items = await prisma.item.findMany({ select: { id: true, name: true } });`,
  },
  {
    id: "EDE002",
    category: "excessive-data-exposure",
    title: "Including stack traces in error responses",
    description:
      "Detected error.stack or err.stack being sent in HTTP responses. Stack traces reveal internal file paths, library versions, and code structure that can aid attackers.",
    severity: "high",
    owaspMcpTop10: "MCP05",
    cweIds: ["CWE-209"],
    pattern:
      /(?:res\.(?:json|send|status)\s*\([^)]*|return\s+.*?)(?:error\.stack|err\.stack|\.stack)/g,
    remediation:
      "Never send stack traces in production responses. Log the full error server-side and return a generic error message to the client.",
    remediationCode: `// Before (leaks internals)
res.status(500).json({ message: error.message, stack: error.stack });

// After (safe)
logger.error("Unhandled error", { stack: error.stack });
res.status(500).json({ message: "Internal server error" });`,
  },
  {
    id: "EDE003",
    category: "excessive-data-exposure",
    title: "Verbose error messages exposing internal paths",
    description:
      "Detected __dirname, __filename, or process.cwd() included in error messages. Internal filesystem paths reveal deployment structure and can help attackers map the server.",
    severity: "medium",
    owaspMcpTop10: "MCP05",
    cweIds: ["CWE-209"],
    pattern:
      /(?:message|error|msg)\s*[:=]\s*[^;]*(?:__dirname|__filename|process\.cwd\(\))/g,
    remediation:
      "Remove references to internal paths from any user-facing error messages. Use opaque error codes or identifiers instead.",
    remediationCode: `// Before (exposes paths)
throw new Error(\`File not found at \${__dirname}/config.json\`);

// After (safe)
throw new Error("Configuration file not found [ERR_CONFIG_MISSING]");`,
  },
  {
    id: "EDE004",
    category: "excessive-data-exposure",
    title: "Debug mode enabled in production configuration",
    description:
      "Detected DEBUG=true or similar debug flags that may be active in production. Debug mode often enables verbose logging, detailed error messages, and development-only endpoints.",
    severity: "medium",
    owaspMcpTop10: "MCP05",
    cweIds: ["CWE-489"],
    pattern:
      /(?:DEBUG|debug)\s*[:=]\s*(?:true|["']true["']|1)|NODE_ENV\s*!==?\s*["']production["']\s*\?\s*true/g,
    remediation:
      "Ensure debug mode is disabled in production. Use environment-based configuration to control debug settings.",
    remediationCode: `// Before (debug always on)
const config = { debug: true };

// After (environment-aware)
const config = { debug: process.env.NODE_ENV !== "production" && process.env.DEBUG === "true" };`,
  },
  {
    id: "EDE005",
    category: "excessive-data-exposure",
    title: "Returning full process environment in responses",
    description:
      "Detected process.env being included in HTTP responses. The process environment typically contains secrets, API keys, database credentials, and other sensitive configuration that must never be exposed.",
    severity: "critical",
    owaspMcpTop10: "MCP05",
    cweIds: ["CWE-200"],
    pattern:
      /(?:res\.(?:json|send)|return\s+(?:Response\.json|NextResponse\.json))\s*\([^)]*process\.env/g,
    remediation:
      "Never include process.env in API responses. If you need to expose specific configuration values, whitelist them explicitly.",
    remediationCode: `// Before (leaks all secrets)
res.json({ env: process.env });

// After (explicit whitelist)
res.json({
  env: {
    NODE_ENV: process.env.NODE_ENV,
    APP_VERSION: process.env.APP_VERSION,
  },
});`,
  },
];

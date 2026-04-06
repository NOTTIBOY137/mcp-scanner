import type { ScanRule } from "@/types/scan";

export const loggingDeficiencyRules: ScanRule[] = [
  {
    id: "LD001",
    category: "logging-deficiency",
    title: "Sensitive data in log output",
    description:
      "Detected console logging statements that reference sensitive fields such as password, secret, token, or API keys. Logging sensitive data can expose credentials in log files, monitoring systems, and log aggregation services.",
    severity: "high",
    owaspMcpTop10: "MCP10",
    cweIds: ["CWE-532"],
    pattern:
      /console\.(?:log|warn|error|info|debug)\s*\([^)]*(?:password|secret|token|apiKey|api_key|private_key|credential)/gi,
    remediation:
      "Remove sensitive data from log statements. If you must reference sensitive fields, redact or mask them before logging.",
    remediationCode: `// Before (leaks secrets)
console.log("User login", { username, password });

// After (redacted)
console.log("User login", { username, password: "***REDACTED***" });`,
  },
  {
    id: "LD002",
    category: "logging-deficiency",
    title: "Empty catch blocks swallowing errors",
    description:
      "Detected catch blocks with empty bodies. Empty catch blocks silently swallow errors, making it impossible to diagnose failures, detect attacks, or audit security-relevant events.",
    severity: "medium",
    owaspMcpTop10: "MCP10",
    cweIds: ["CWE-390"],
    pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,
    remediation:
      "Always handle or log errors in catch blocks. At minimum, log the error for debugging and auditing purposes.",
    remediationCode: `// Before (silent failure)
try { await processRequest(); } catch (e) {}

// After (proper handling)
try {
  await processRequest();
} catch (e) {
  logger.error("Failed to process request", { error: e });
}`,
  },
  {
    id: "LD003",
    category: "logging-deficiency",
    title: "Console.log in production code",
    description:
      "Detected console.log() usage in non-test source code. Console.log is not appropriate for production logging as it lacks log levels, structured output, and proper log management.",
    severity: "low",
    owaspMcpTop10: "MCP10",
    cweIds: ["CWE-778"],
    pattern: /console\.log\s*\(/g,
    fileFilter: (path: string): boolean => {
      return (
        !path.includes(".test.") &&
        !path.includes(".spec.") &&
        !path.includes("__tests__") &&
        !path.includes("/test/") &&
        !path.includes("/tests/")
      );
    },
    remediation:
      "Replace console.log with a structured logging library (e.g., winston, pino) that supports log levels and proper log management.",
    remediationCode: `// Before (unstructured)
console.log("Request received", req.url);

// After (structured logging)
import { logger } from "./logger";
logger.info("Request received", { url: req.url });`,
  },
  {
    id: "LD004",
    category: "logging-deficiency",
    title: "Missing error logging in catch block",
    description:
      "Detected a catch block that returns, continues, or breaks without logging the error or rethrowing. Silently discarding errors hinders incident response and forensic analysis.",
    severity: "medium",
    owaspMcpTop10: "MCP10",
    cweIds: ["CWE-754"],
    pattern:
      /catch\s*\(\s*\w+\s*\)\s*\{[^}]*(?:return|continue|break)[^}]*\}/g,
    validator: (match: RegExpMatchArray, _fileContent: string): boolean => {
      const body = match[0];
      return (
        !body.includes("console.") &&
        !body.includes("log") &&
        !body.includes("throw") &&
        !body.includes("logger") &&
        !body.includes("report")
      );
    },
    remediation:
      "Add error logging before returning, continuing, or breaking inside catch blocks. Ensure all errors are recorded for audit and debugging.",
    remediationCode: `// Before (error silently discarded)
catch (err) { return null; }

// After (error logged)
catch (err) {
  logger.error("Operation failed", { error: err });
  return null;
}`,
  },
  {
    id: "LD005",
    category: "logging-deficiency",
    title: "Disabled or suppressed security logging",
    description:
      "Detected patterns that disable, silence, or suppress logging or audit trails. Disabling security logging can mask malicious activity and hinder incident investigation.",
    severity: "medium",
    owaspMcpTop10: "MCP10",
    cweIds: ["CWE-223"],
    pattern:
      /(?:silent|quiet|suppress|disable).*(?:log|audit|trace)|(?:log|audit|trace).*(?:false|off|disabled|none)/gi,
    remediation:
      "Ensure security-related logging is always enabled in production. Never suppress audit trails or security event logs.",
    remediationCode: `// Before (logging disabled)
const config = { audit: false, silent: true };

// After (logging enabled)
const config = { audit: true, silent: false };`,
  },
];

import type { ScanRule } from "@/types/scan";

export const missingAuthRules: ScanRule[] = [
  {
    id: "MA001",
    category: "missing-auth",
    title: "Server binding to 0.0.0.0 without authentication",
    description:
      "Binding a server to 0.0.0.0 exposes it to all network interfaces. Without authentication, anyone on the network can access it.",
    severity: "high",
    pattern:
      /\.listen\s*\(\s*\d+\s*,\s*["'`]0\.0\.0\.0["'`]/g,
    remediation: "Bind to 127.0.0.1 instead of 0.0.0.0, or add authentication middleware before exposing on all interfaces.",
  },
  {
    id: "MA002",
    category: "missing-auth",
    title: "CORS with wildcard origin",
    description:
      "Setting CORS origin to '*' allows any website to make requests to your API, potentially enabling data theft via cross-origin attacks.",
    severity: "medium",
    pattern:
      /(?:cors|Access-Control-Allow-Origin)\s*[:=(]\s*["'`]\*["'`]/g,
    remediation: "Replace wildcard CORS origin with a specific allowlist of trusted domains.",
  },
  {
    id: "MA003",
    category: "missing-auth",
    title: "Server route without authentication middleware",
    description:
      "HTTP endpoints defined without authentication middleware may be accessible to unauthorized users.",
    severity: "medium",
    pattern:
      /(?:app|router|server)\s*\.(?:get|post|put|delete|patch|all)\s*\(\s*["'`]\/[^"'`]*["'`]\s*,\s*(?:async\s+)?(?:function|\()/g,
    validator: (_match: RegExpMatchArray, fileContent: string) => {
      const hasAuthMiddleware =
        /(?:auth|authenticate|authorize|isAuthenticated|requireAuth|verifyToken|passport\.authenticate)/i.test(
          fileContent
        );
      return !hasAuthMiddleware;
    },
    remediation: "Add authentication middleware to all routes that access or modify data.",
  },
  {
    id: "MA004",
    category: "missing-auth",
    title: "Missing input validation on endpoint",
    description:
      "Server endpoints that directly use request body or parameters without validation are vulnerable to injection attacks.",
    severity: "medium",
    pattern:
      /(?:req\.body|req\.params|req\.query)\s*\.\w+\s*(?:[^;]*(?:exec|query|sql|eval|spawn|readFile))/g,
    remediation: "Add input validation using a schema library (e.g., Zod, Joi) to all endpoint handlers.",
  },
];

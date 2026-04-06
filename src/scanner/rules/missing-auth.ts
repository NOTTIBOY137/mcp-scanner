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
  {
    id: "MA005",
    category: "missing-auth",
    title: "Missing rate limiting on endpoint",
    description: "API endpoints without rate limiting are vulnerable to brute force and denial of service.",
    severity: "medium",
    pattern: /(?:app|router)\.(?:get|post|put|delete|patch)\s*\(\s*["']/g,
    validator: (match: RegExpMatchArray, fileContent: string) => {
      return !(/rateLimit|rateLimiter|throttle|slowDown|express-rate-limit/i.test(fileContent));
    },
    remediation: "Add rate limiting middleware to all public API endpoints.",
    owaspMcpTop10: "MCP07",
    cweIds: ["CWE-770"],
  },
  {
    id: "MA006",
    category: "missing-auth",
    title: "No CSRF protection on state-changing endpoint",
    description: "POST/PUT/DELETE endpoints without CSRF tokens are vulnerable to cross-site request forgery.",
    severity: "medium",
    pattern: /(?:app|router)\.(?:post|put|delete|patch)\s*\(\s*["']/g,
    validator: (match: RegExpMatchArray, fileContent: string) => {
      return !(/csrf|xsrf|csrfToken|_csrf|csurf/i.test(fileContent));
    },
    remediation: "Implement CSRF protection using tokens or SameSite cookies.",
    owaspMcpTop10: "MCP07",
    cweIds: ["CWE-352"],
  },
  {
    id: "MA007",
    category: "missing-auth",
    title: "Open WebSocket without authentication",
    description: "WebSocket connections without authentication allow unauthorized access.",
    severity: "high",
    pattern: /new\s+(?:WebSocket\.Server|WebSocketServer|Server)\s*\(\s*\{[^}]*\}\s*\)/g,
    validator: (match: RegExpMatchArray, fileContent: string) => {
      return !(/verifyClient|authenticate|auth|token|session/i.test(fileContent));
    },
    remediation: "Implement authentication in the WebSocket verifyClient callback.",
    owaspMcpTop10: "MCP07",
    cweIds: ["CWE-306"],
  },
  {
    id: "MA008",
    category: "missing-auth",
    title: "Missing OAuth scope validation",
    description: "OAuth-protected endpoints that don't validate scopes may allow unauthorized actions.",
    severity: "medium",
    pattern: /(?:oauth|bearer|accessToken|access_token)\b/gi,
    validator: (match: RegExpMatchArray, fileContent: string) => {
      return (/oauth|bearer|accessToken/i.test(fileContent)) && !(/scope|scopes|hasScope|checkScope|requiredScope/i.test(fileContent));
    },
    remediation: "Validate OAuth scopes on every endpoint. Check that the token has required permissions.",
    owaspMcpTop10: "MCP07",
    cweIds: ["CWE-862"],
  },
];

export interface ConfigFinding {
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  server?: string;
  remediation: string;
  owaspMcpTop10: string;
  cweIds: string[];
}

interface McpServerConfig {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  transport?: string;
}

interface McpConfig {
  mcpServers?: Record<string, McpServerConfig>;
}

export function scanMcpConfig(rawJson: string): ConfigFinding[] {
  let config: McpConfig;
  try {
    config = JSON.parse(rawJson);
  } catch {
    return [{
      severity: "critical",
      title: "Invalid JSON configuration",
      description: "The configuration file is not valid JSON.",
      remediation: "Fix the JSON syntax errors in the config file.",
      owaspMcpTop10: "MCP08",
      cweIds: ["CWE-1188"],
    }];
  }

  const findings: ConfigFinding[] = [];
  const servers = config.mcpServers ?? {};

  for (const [name, server] of Object.entries(servers)) {
    // Check for non-HTTPS URLs
    if (server.url && server.url.startsWith("http://") && !server.url.includes("localhost") && !server.url.includes("127.0.0.1")) {
      findings.push({
        severity: "high",
        title: "Non-HTTPS server endpoint",
        description: `Server "${name}" connects over unencrypted HTTP.`,
        server: name,
        remediation: "Use HTTPS for all remote MCP server connections.",
        owaspMcpTop10: "MCP08",
        cweIds: ["CWE-319"],
      });
    }

    // Check for suspicious endpoints
    const suspiciousPatterns = ["ngrok", "localtunnel", "serveo", "cloudflare-tunnel"];
    if (server.url) {
      for (const pattern of suspiciousPatterns) {
        if (server.url.includes(pattern)) {
          findings.push({
            severity: "medium",
            title: "Tunnel/proxy endpoint detected",
            description: `Server "${name}" uses a tunneling service (${pattern}).`,
            server: name,
            remediation: "Use stable, authenticated endpoints instead of tunneling services.",
            owaspMcpTop10: "MCP09",
            cweIds: ["CWE-829"],
          });
        }
      }
    }

    // Check for overly broad env pass-through
    if (server.env) {
      const sensitiveVars = Object.keys(server.env).filter((k) =>
        /SECRET|TOKEN|PASSWORD|KEY|CREDENTIAL|PRIVATE/i.test(k)
      );
      if (sensitiveVars.length > 3) {
        findings.push({
          severity: "high",
          title: "Excessive sensitive environment variables",
          description: `Server "${name}" has ${sensitiveVars.length} sensitive env vars passed: ${sensitiveVars.join(", ")}`,
          server: name,
          remediation: "Only pass the minimum required environment variables to each server.",
          owaspMcpTop10: "MCP01",
          cweIds: ["CWE-522"],
        });
      }

      for (const key of sensitiveVars) {
        if (server.env[key] && !server.env[key].startsWith("$") && server.env[key].length > 5) {
          findings.push({
            severity: "critical",
            title: "Hardcoded secret in config",
            description: `Server "${name}" has a hardcoded value for ${key}.`,
            server: name,
            remediation: "Use environment variable references ($ENV_VAR) instead of hardcoded secrets.",
            owaspMcpTop10: "MCP01",
            cweIds: ["CWE-798"],
          });
        }
      }
    }

    // Check for shell commands in args
    if (server.args) {
      const dangerousArgs = server.args.filter((a) =>
        /[;&|`$]/.test(a) || /rm\s+-rf|curl.*\|.*sh|wget.*\|.*bash/.test(a)
      );
      if (dangerousArgs.length > 0) {
        findings.push({
          severity: "critical",
          title: "Shell injection in server arguments",
          description: `Server "${name}" has potentially dangerous arguments: ${dangerousArgs.join(", ")}`,
          server: name,
          remediation: "Remove shell metacharacters from server arguments.",
          owaspMcpTop10: "MCP06",
          cweIds: ["CWE-78"],
        });
      }
    }

    // Check for running as sudo/root
    if (server.command === "sudo" || server.args?.includes("sudo")) {
      findings.push({
        severity: "critical",
        title: "Server running with elevated privileges",
        description: `Server "${name}" runs with sudo/root privileges.`,
        server: name,
        remediation: "Run MCP servers with minimum required privileges, never as root.",
        owaspMcpTop10: "MCP02",
        cweIds: ["CWE-250"],
      });
    }
  }

  // Check for having too many servers (attack surface)
  if (Object.keys(servers).length > 20) {
    findings.push({
      severity: "medium",
      title: "Large number of MCP servers configured",
      description: `${Object.keys(servers).length} servers configured. Large configs increase attack surface.`,
      remediation: "Remove unused MCP servers to reduce attack surface.",
      owaspMcpTop10: "MCP09",
      cweIds: ["CWE-829"],
    });
  }

  return findings;
}

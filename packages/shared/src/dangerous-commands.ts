export interface SecurityIssue {
  file: string;
  line: number;
  message: string;
  severity: "warning" | "error";
  owaspMcpTop10?: string;
  cweIds?: string[];
}

export const DANGEROUS_COMMANDS = [
  "sh", "bash", "zsh", "fish", "csh", "ksh", "cmd", "cmd.exe",
  "powershell", "pwsh", "sudo", "su", "nc", "ncat", "netcat",
];

export const DANGEROUS_ARG_PATTERNS = [
  /\b(?:sh|bash|zsh|cmd)\b/,
  /-c\b/,
  /\beval\b/,
  /\bsudo\b/,
  /\brm\s+-rf?\b/,
  /\|/,
  /[;&`$()]/,
  /curl\s+.*\|.*sh/i,
  /wget.*\|.*bash/i,
];

export const SENSITIVE_PATH_PATTERNS = [
  /~\/\.ssh/, /~\/\.aws/, /~\/\.gnupg/, /~\/\.env/,
  /~\/\.kube/, /~\/\.docker/, /~\/\.cursor\/mcp\.json/,
  /\/etc\/passwd/, /\/etc\/shadow/, /\/proc\//,
  /C:\\Windows\\System32/i, /C:\\Users\\[^\\]+\\\.ssh/i,
];

export const SENSITIVE_ENV_VARS = [
  "AWS_SECRET_ACCESS_KEY", "AWS_ACCESS_KEY_ID", "GITHUB_TOKEN",
  "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "DATABASE_URL",
  "DB_PASSWORD", "SECRET_KEY", "PRIVATE_KEY",
];

export interface McpServerConfig {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  transport?: string;
}

export interface McpConfig {
  mcpServers?: Record<string, McpServerConfig>;
  servers?: Record<string, McpServerConfig>;
}

export function analyzeServerConfig(
  name: string,
  config: McpServerConfig,
  file: string
): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  if (config.command && DANGEROUS_COMMANDS.includes(config.command)) {
    issues.push({
      file, line: 0, severity: "error",
      message: `Server "${name}" uses dangerous command "${config.command}". MCP servers should use "npx", "node", "docker", "uvx", or "python".`,
      owaspMcpTop10: "MCP06", cweIds: ["CWE-78"],
    });
  }

  const argsStr = (config.args || []).join(" ");
  for (const pattern of DANGEROUS_ARG_PATTERNS) {
    if (pattern.test(argsStr)) {
      issues.push({
        file, line: 0, severity: "error",
        message: `Server "${name}" args contain dangerous shell pattern: ${pattern}`,
        owaspMcpTop10: "MCP06", cweIds: ["CWE-78"],
      });
      break;
    }
  }

  for (const pattern of SENSITIVE_PATH_PATTERNS) {
    if (pattern.test(argsStr)) {
      issues.push({
        file, line: 0, severity: "warning",
        message: `Server "${name}" may access sensitive path: ${pattern}`,
        owaspMcpTop10: "MCP01", cweIds: ["CWE-538"],
      });
      break;
    }
  }

  if (config.command === "npx" && config.args) {
    const pkgArg = config.args.find((a) => !a.startsWith("-"));
    if (pkgArg && !pkgArg.includes("@") && !pkgArg.startsWith(".")) {
      issues.push({
        file, line: 0, severity: "warning",
        message: `Server "${name}" uses npx without pinned version — supply chain risk`,
        owaspMcpTop10: "MCP09", cweIds: ["CWE-829"],
      });
    }
  }

  if (config.url) {
    if (config.url.startsWith("http://") && !config.url.includes("localhost") && !config.url.includes("127.0.0.1")) {
      issues.push({
        file, line: 0, severity: "error",
        message: `Server "${name}" uses unencrypted HTTP endpoint: ${config.url}`,
        owaspMcpTop10: "MCP08", cweIds: ["CWE-319"],
      });
    }
    const tunnelPatterns = ["ngrok", "localtunnel", "serveo", "cloudflare-tunnel"];
    for (const t of tunnelPatterns) {
      if (config.url.includes(t)) {
        issues.push({
          file, line: 0, severity: "warning",
          message: `Server "${name}" uses tunneling service (${t})`,
          owaspMcpTop10: "MCP09", cweIds: ["CWE-829"],
        });
      }
    }
  }

  return issues;
}

export function analyzeMcpConfig(
  config: McpConfig,
  file: string,
  secretDetector?: (value: string) => Array<{ name: string }>
): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  const servers = config.mcpServers ?? config.servers ?? {};

  for (const [name, serverConfig] of Object.entries(servers)) {
    issues.push(...analyzeServerConfig(name, serverConfig, file));

    if (serverConfig.env) {
      for (const [key, value] of Object.entries(serverConfig.env)) {
        if (typeof value !== "string" || value.startsWith("${") || value === "") continue;

        if (secretDetector) {
          const secrets = secretDetector(value);
          if (secrets.length > 0) {
            issues.push({
              file, line: 0, severity: "error",
              message: `Server "${name}" has hardcoded ${secrets[0].name} in env var "${key}"`,
              owaspMcpTop10: "MCP01", cweIds: ["CWE-798"],
            });
            continue;
          }
        }

        // Fallback: check for common secret-like env var names with non-reference values
        if (/SECRET|TOKEN|PASSWORD|API_KEY|PRIVATE_KEY|CREDENTIAL/i.test(key) && value.length > 5) {
          issues.push({
            file, line: 0, severity: "error",
            message: `Server "${name}" has hardcoded value in sensitive env var "${key}"`,
            owaspMcpTop10: "MCP01", cweIds: ["CWE-798"],
          });
        }
      }
    }
  }

  return issues;
}

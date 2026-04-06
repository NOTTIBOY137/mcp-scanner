#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// ---------------------------------------------------------------------------
// Inline detection helpers
// ---------------------------------------------------------------------------

const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: "OpenAI API key", pattern: /sk-[A-Za-z0-9]{20,}/ },
  { name: "GitHub personal access token", pattern: /ghp_[A-Za-z0-9]{36,}/ },
  { name: "GitHub OAuth token", pattern: /gho_[A-Za-z0-9]{36,}/ },
  { name: "GitHub App token", pattern: /ghu_[A-Za-z0-9]{36,}/ },
  { name: "GitHub App refresh token", pattern: /ghr_[A-Za-z0-9]{36,}/ },
  { name: "AWS access key ID", pattern: /AKIA[0-9A-Z]{16}/ },
  { name: "Anthropic API key", pattern: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: "Slack Bot token", pattern: /xoxb-[0-9]{10,}-[A-Za-z0-9]{20,}/ },
  { name: "Slack User token", pattern: /xoxp-[0-9]{10,}-[A-Za-z0-9]{20,}/ },
  { name: "Stripe secret key", pattern: /sk_live_[A-Za-z0-9]{20,}/ },
  { name: "Stripe test key", pattern: /sk_test_[A-Za-z0-9]{20,}/ },
  { name: "Google API key", pattern: /AIza[0-9A-Za-z_-]{35}/ },
  { name: "Twilio API key", pattern: /SK[0-9a-fA-F]{32}/ },
  { name: "SendGrid API key", pattern: /SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}/ },
  { name: "Private key block", pattern: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/ },
  { name: "Generic secret assignment", pattern: /(?:password|secret|token|api_key|apikey)\s*[:=]\s*["'][^"']{8,}["']/i },
];

const DANGEROUS_COMMANDS = [
  "rm -rf",
  "mkfs",
  "dd if=",
  "wget",
  "curl",
  "nc ",
  "netcat",
  "ncat",
  "bash -c",
  "sh -c",
  "eval",
  "exec",
  "python -c",
  "node -e",
  "ruby -e",
  "perl -e",
  "powershell",
  "cmd.exe",
  "chmod 777",
  "chmod +s",
];

const TUNNELING_SERVICES = [
  "ngrok",
  "localtunnel",
  "serveo",
  "localhost.run",
  "bore.digital",
  "cloudflared",
  "pagekite",
];

const SHELL_INJECTION_PATTERNS = [
  /[;&|`$]/, // shell metacharacters
  /\$\(/, // command substitution
  /\$\{/, // variable expansion
];

const KNOWN_MCP_PACKAGES = [
  "@modelcontextprotocol/server-filesystem",
  "@modelcontextprotocol/server-github",
  "@modelcontextprotocol/server-postgres",
  "@modelcontextprotocol/server-slack",
  "@modelcontextprotocol/server-memory",
  "@modelcontextprotocol/server-puppeteer",
  "@modelcontextprotocol/server-brave-search",
  "@modelcontextprotocol/server-google-maps",
  "@modelcontextprotocol/server-sqlite",
  "@modelcontextprotocol/server-fetch",
  "@modelcontextprotocol/server-everything",
  "@modelcontextprotocol/server-sequential-thinking",
  "mcp-server-fetch",
  "mcp-server-filesystem",
  "mcp-server-github",
  "mcp-server-sqlite",
  "mcp-server-time",
];

const PROMPT_INJECTION_PATTERNS = [
  /ignore (?:all )?(?:previous |prior )?instructions/i,
  /disregard (?:all )?(?:previous |prior )?instructions/i,
  /forget (?:all )?(?:previous |prior )?instructions/i,
  /you are now/i,
  /new instructions:/i,
  /system prompt:/i,
  /override:/i,
  /jailbreak/i,
  /do anything now/i,
  /ignore (?:safety|content) (?:policy|filter|guidelines)/i,
  /<\/?(?:system|user|assistant)>/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /\{\{.*\}\}/,
];

const DANGEROUS_PARAM_NAMES = [
  "command",
  "cmd",
  "exec",
  "execute",
  "shell",
  "bash",
  "eval",
  "script",
  "code",
  "run",
  "system",
  "subprocess",
];

// ---------------------------------------------------------------------------
// Levenshtein distance
// ---------------------------------------------------------------------------

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

// ---------------------------------------------------------------------------
// Helper: fetch JSON from a URL
// ---------------------------------------------------------------------------

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

interface SecurityIssue {
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: string;
  message: string;
  server?: string;
  detail?: string;
}

function analyzeConfigSecurity(
  filePath: string,
  config: Record<string, unknown>
): { filePath: string; issues: SecurityIssue[]; issueCount: number } {
  const issues: SecurityIssue[] = [];

  const rawText = JSON.stringify(config);

  // Detect hardcoded secrets in the entire config text
  for (const { name, pattern } of SECRET_PATTERNS) {
    if (pattern.test(rawText)) {
      issues.push({
        severity: "critical",
        category: "hardcoded-secret",
        message: `Possible ${name} found in configuration`,
      });
    }
  }

  // Iterate servers
  const servers: Record<string, Record<string, unknown>> =
    (config.mcpServers as Record<string, Record<string, unknown>>) ?? {};

  for (const [serverName, serverConfig] of Object.entries(servers)) {
    const command = String(serverConfig.command ?? "");
    const args: string[] = Array.isArray(serverConfig.args)
      ? serverConfig.args.map(String)
      : [];
    const env: Record<string, string> =
      (serverConfig.env as Record<string, string>) ?? {};
    const argsStr = args.join(" ");

    // Dangerous commands
    for (const dc of DANGEROUS_COMMANDS) {
      if (command.includes(dc) || argsStr.includes(dc)) {
        issues.push({
          severity: "high",
          category: "dangerous-command",
          message: `Potentially dangerous command "${dc}" detected`,
          server: serverName,
        });
      }
    }

    // Sudo usage
    if (command === "sudo" || command.startsWith("sudo ") || args.includes("sudo")) {
      issues.push({
        severity: "high",
        category: "privilege-escalation",
        message: "Server runs with sudo / elevated privileges",
        server: serverName,
      });
    }

    // Tunneling services
    for (const ts of TUNNELING_SERVICES) {
      if (
        command.includes(ts) ||
        argsStr.includes(ts) ||
        Object.values(env).some((v) => v.includes(ts))
      ) {
        issues.push({
          severity: "high",
          category: "tunneling-service",
          message: `Tunneling service "${ts}" detected, which can expose local services`,
          server: serverName,
        });
      }
    }

    // Non-HTTPS URLs
    const urlPattern = /http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])[^\s"',}]+/g;
    const allText = `${command} ${argsStr} ${Object.values(env).join(" ")}`;
    const httpMatches = allText.match(urlPattern);
    if (httpMatches) {
      for (const match of httpMatches) {
        issues.push({
          severity: "medium",
          category: "insecure-transport",
          message: `Non-HTTPS URL found: ${match}`,
          server: serverName,
        });
      }
    }

    // Shell injection in args
    for (const arg of args) {
      for (const pat of SHELL_INJECTION_PATTERNS) {
        if (pat.test(arg)) {
          issues.push({
            severity: "medium",
            category: "shell-injection",
            message: `Argument "${arg}" contains shell metacharacters that could enable injection`,
            server: serverName,
          });
          break;
        }
      }
    }

    // Excessive environment variables
    const envCount = Object.keys(env).length;
    if (envCount > 10) {
      issues.push({
        severity: "low",
        category: "excessive-env",
        message: `Server has ${envCount} environment variables, which is unusually many and increases exposure`,
        server: serverName,
      });
    }

    // Secrets in env values
    for (const [key, value] of Object.entries(env)) {
      for (const { name, pattern } of SECRET_PATTERNS) {
        if (pattern.test(value)) {
          issues.push({
            severity: "critical",
            category: "hardcoded-secret",
            message: `Possible ${name} hardcoded in env var "${key}"`,
            server: serverName,
          });
        }
      }
    }
  }

  return {
    filePath,
    issueCount: issues.length,
    issues,
  };
}

function discoverConfigs(): {
  found: Array<{
    filePath: string;
    application: string;
    exists: boolean;
    serverCount?: number;
    serverNames?: string[];
  }>;
  totalFound: number;
} {
  const home = os.homedir();
  const platform = os.platform();

  const candidates: Array<{ filePath: string; application: string }> = [];

  // Claude Desktop
  if (platform === "darwin") {
    candidates.push({
      filePath: path.join(
        home,
        "Library",
        "Application Support",
        "Claude",
        "claude_desktop_config.json"
      ),
      application: "Claude Desktop (macOS)",
    });
  } else if (platform === "win32") {
    const appdata = process.env.APPDATA ?? path.join(home, "AppData", "Roaming");
    candidates.push({
      filePath: path.join(appdata, "Claude", "claude_desktop_config.json"),
      application: "Claude Desktop (Windows)",
    });
  } else {
    candidates.push({
      filePath: path.join(home, ".config", "Claude", "claude_desktop_config.json"),
      application: "Claude Desktop (Linux)",
    });
  }

  // Claude Code
  candidates.push({
    filePath: path.join(home, ".claude.json"),
    application: "Claude Code",
  });

  // Cursor
  candidates.push({
    filePath: path.join(home, ".cursor", "mcp.json"),
    application: "Cursor",
  });

  // Windsurf
  candidates.push({
    filePath: path.join(home, ".codeium", "windsurf", "mcp_config.json"),
    application: "Windsurf",
  });

  // VS Code in current directory
  candidates.push({
    filePath: path.join(process.cwd(), ".vscode", "mcp.json"),
    application: "VS Code (current directory)",
  });

  const found: Array<{
    filePath: string;
    application: string;
    exists: boolean;
    serverCount?: number;
    serverNames?: string[];
  }> = [];

  for (const candidate of candidates) {
    const entry: (typeof found)[number] = {
      filePath: candidate.filePath,
      application: candidate.application,
      exists: false,
    };

    try {
      if (fs.existsSync(candidate.filePath)) {
        entry.exists = true;
        const raw = fs.readFileSync(candidate.filePath, "utf-8");
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const servers = parsed.mcpServers as Record<string, unknown> | undefined;
        if (servers && typeof servers === "object") {
          const names = Object.keys(servers);
          entry.serverCount = names.length;
          entry.serverNames = names;
        } else {
          entry.serverCount = 0;
          entry.serverNames = [];
        }
      }
    } catch {
      // If we can't read/parse the file, just mark it as existing with unknown servers
      entry.exists = fs.existsSync(candidate.filePath);
    }

    found.push(entry);
  }

  return {
    found,
    totalFound: found.filter((f) => f.exists).length,
  };
}

interface NpmRegistryData {
  name?: string;
  time?: Record<string, string>;
  maintainers?: Array<{ name: string; email?: string }>;
  versions?: Record<string, unknown>;
  repository?: { url?: string } | string;
  scripts?: Record<string, string>;
  "dist-tags"?: Record<string, string>;
}

interface NpmDownloadsData {
  downloads?: number;
}

async function checkNpmTrust(packageName: string): Promise<{
  packageName: string;
  trustScore: number;
  maxScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  checks: Array<{ check: string; passed: boolean; detail: string }>;
}> {
  const checks: Array<{ check: string; passed: boolean; detail: string }> = [];
  let score = 0;
  const maxScore = 7;

  let registryData: NpmRegistryData;
  try {
    registryData = (await fetchJson(
      `https://registry.npmjs.org/${encodeURIComponent(packageName)}`
    )) as NpmRegistryData;
  } catch (err) {
    return {
      packageName,
      trustScore: 0,
      maxScore,
      riskLevel: "critical",
      checks: [
        {
          check: "registry-lookup",
          passed: false,
          detail: `Failed to fetch package from npm: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
    };
  }

  // 1. Package age
  const createdStr = registryData.time?.["created"];
  if (createdStr) {
    const ageMs = Date.now() - new Date(createdStr).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays >= 30) {
      score += 1;
      checks.push({
        check: "package-age",
        passed: true,
        detail: `Package is ${Math.floor(ageDays)} days old`,
      });
    } else {
      checks.push({
        check: "package-age",
        passed: false,
        detail: `Package is only ${Math.floor(ageDays)} days old (< 30 days = high risk)`,
      });
    }
  }

  // 2. Maintainer count
  const maintainers = registryData.maintainers ?? [];
  if (maintainers.length >= 2) {
    score += 1;
    checks.push({
      check: "maintainer-count",
      passed: true,
      detail: `${maintainers.length} maintainers`,
    });
  } else {
    checks.push({
      check: "maintainer-count",
      passed: false,
      detail: `Only ${maintainers.length} maintainer(s) - single point of failure`,
    });
  }

  // 3. Version count
  const versionCount = registryData.versions
    ? Object.keys(registryData.versions).length
    : 0;
  if (versionCount >= 3) {
    score += 1;
    checks.push({
      check: "version-count",
      passed: true,
      detail: `${versionCount} published versions`,
    });
  } else {
    checks.push({
      check: "version-count",
      passed: false,
      detail: `Only ${versionCount} version(s) published`,
    });
  }

  // 4. Has repository link
  const hasRepo =
    registryData.repository !== undefined && registryData.repository !== null;
  if (hasRepo) {
    score += 1;
    checks.push({
      check: "has-repository",
      passed: true,
      detail: `Repository link present`,
    });
  } else {
    checks.push({
      check: "has-repository",
      passed: false,
      detail: "No repository link in package metadata",
    });
  }

  // 5. Install scripts check
  const latestTag = registryData["dist-tags"]?.["latest"];
  let hasInstallScripts = false;
  if (latestTag && registryData.versions) {
    const latestVersion = registryData.versions[latestTag] as
      | Record<string, unknown>
      | undefined;
    if (latestVersion) {
      const scripts = latestVersion.scripts as Record<string, string> | undefined;
      if (scripts) {
        hasInstallScripts = !!(scripts.preinstall || scripts.postinstall || scripts.install);
      }
    }
  }
  if (!hasInstallScripts) {
    score += 1;
    checks.push({
      check: "no-install-scripts",
      passed: true,
      detail: "No preinstall/postinstall/install scripts",
    });
  } else {
    checks.push({
      check: "no-install-scripts",
      passed: false,
      detail:
        "Package has install lifecycle scripts which can execute arbitrary code on install",
    });
  }

  // 6. Weekly downloads
  let weeklyDownloads = 0;
  try {
    const dlData = (await fetchJson(
      `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`
    )) as NpmDownloadsData;
    weeklyDownloads = dlData.downloads ?? 0;
  } catch {
    // swallow errors for downloads endpoint
  }

  if (weeklyDownloads >= 1000) {
    score += 1;
    checks.push({
      check: "weekly-downloads",
      passed: true,
      detail: `${weeklyDownloads.toLocaleString()} weekly downloads`,
    });
  } else {
    checks.push({
      check: "weekly-downloads",
      passed: false,
      detail: `Only ${weeklyDownloads.toLocaleString()} weekly downloads (< 1000)`,
    });
  }

  // 7. Not deprecated
  const latestMeta =
    latestTag && registryData.versions
      ? (registryData.versions[latestTag] as Record<string, unknown> | undefined)
      : undefined;
  const deprecated = latestMeta?.deprecated;
  if (!deprecated) {
    score += 1;
    checks.push({
      check: "not-deprecated",
      passed: true,
      detail: "Package is not deprecated",
    });
  } else {
    checks.push({
      check: "not-deprecated",
      passed: false,
      detail: `Package is deprecated: ${String(deprecated)}`,
    });
  }

  let riskLevel: "low" | "medium" | "high" | "critical";
  const pct = score / maxScore;
  if (pct >= 0.8) riskLevel = "low";
  else if (pct >= 0.55) riskLevel = "medium";
  else if (pct >= 0.3) riskLevel = "high";
  else riskLevel = "critical";

  return {
    packageName,
    trustScore: score,
    maxScore,
    riskLevel,
    checks,
  };
}

function checkTyposquatting(packageName: string): {
  packageName: string;
  suspiciousMatches: Array<{
    knownPackage: string;
    distance: number;
    reason: string;
  }>;
  isSuspicious: boolean;
} {
  const suspiciousMatches: Array<{
    knownPackage: string;
    distance: number;
    reason: string;
  }> = [];

  const normalizedInput = packageName.toLowerCase();

  for (const known of KNOWN_MCP_PACKAGES) {
    const normalizedKnown = known.toLowerCase();

    // Exact match means it's legitimate
    if (normalizedInput === normalizedKnown) continue;

    const dist = levenshtein(normalizedInput, normalizedKnown);
    if (dist > 0 && dist <= 2) {
      suspiciousMatches.push({
        knownPackage: known,
        distance: dist,
        reason: `Edit distance of ${dist} from known package "${known}"`,
      });
    }

    // Scope confusion: same unscoped name under different scope
    const inputUnscoped = normalizedInput.replace(/^@[^/]+\//, "");
    const knownUnscoped = normalizedKnown.replace(/^@[^/]+\//, "");

    if (
      inputUnscoped === knownUnscoped &&
      normalizedInput !== normalizedKnown
    ) {
      suspiciousMatches.push({
        knownPackage: known,
        distance: 0,
        reason: `Same unscoped name as "${known}" but under a different scope (scope confusion)`,
      });
    }

    // Unscoped variant of a scoped package
    if (
      !normalizedInput.startsWith("@") &&
      normalizedKnown.startsWith("@") &&
      levenshtein(normalizedInput, knownUnscoped) <= 1
    ) {
      suspiciousMatches.push({
        knownPackage: known,
        distance: levenshtein(normalizedInput, knownUnscoped),
        reason: `Unscoped variant closely matches scoped package "${known}"`,
      });
    }
  }

  return {
    packageName,
    suspiciousMatches,
    isSuspicious: suspiciousMatches.length > 0,
  };
}

interface ToolDef {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
}

function analyzeToolDescriptions(tools: ToolDef[]): {
  tools: Array<{
    name: string;
    issues: Array<{ severity: string; category: string; message: string }>;
    issueCount: number;
  }>;
  totalIssues: number;
} {
  const results: Array<{
    name: string;
    issues: Array<{ severity: string; category: string; message: string }>;
    issueCount: number;
  }> = [];

  let totalIssues = 0;

  for (const tool of tools) {
    const issues: Array<{
      severity: string;
      category: string;
      message: string;
    }> = [];

    // Check description for prompt injection patterns
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (pattern.test(tool.description)) {
        issues.push({
          severity: "critical",
          category: "prompt-injection",
          message: `Tool description contains suspicious prompt injection pattern: ${pattern.source}`,
        });
      }
    }

    // Check for hidden instructions in description (very long descriptions)
    if (tool.description.length > 1000) {
      issues.push({
        severity: "medium",
        category: "suspicious-description",
        message: `Tool description is unusually long (${tool.description.length} chars) - may contain hidden instructions`,
      });
    }

    // Check input schema for dangerous parameter names
    if (tool.inputSchema) {
      const properties =
        (tool.inputSchema.properties as Record<string, unknown>) ?? {};
      for (const paramName of Object.keys(properties)) {
        const lowerParam = paramName.toLowerCase();
        for (const dangerous of DANGEROUS_PARAM_NAMES) {
          if (lowerParam === dangerous || lowerParam.includes(dangerous)) {
            issues.push({
              severity: "high",
              category: "dangerous-parameter",
              message: `Parameter "${paramName}" suggests arbitrary code/command execution capability`,
            });
            break;
          }
        }

        // Check for unrestricted file path params
        const paramDef = properties[paramName] as Record<string, unknown> | undefined;
        if (paramDef) {
          const paramDesc = String(paramDef.description ?? "").toLowerCase();
          const paramType = String(paramDef.type ?? "");
          if (
            paramType === "string" &&
            (lowerParam.includes("path") ||
              lowerParam.includes("file") ||
              lowerParam.includes("dir")) &&
            !paramDef.enum &&
            !paramDef.pattern
          ) {
            issues.push({
              severity: "medium",
              category: "unrestricted-file-path",
              message: `Parameter "${paramName}" accepts arbitrary file paths without restriction`,
            });
          }

          // Check for SSRF-enabling URL params
          if (
            paramType === "string" &&
            (lowerParam.includes("url") ||
              lowerParam.includes("uri") ||
              lowerParam.includes("endpoint") ||
              lowerParam.includes("webhook") ||
              paramDesc.includes("url") ||
              paramDesc.includes("http"))
          ) {
            issues.push({
              severity: "medium",
              category: "ssrf-risk",
              message: `Parameter "${paramName}" accepts URLs which could enable SSRF attacks`,
            });
          }
        }
      }
    }

    results.push({
      name: tool.name,
      issues,
      issueCount: issues.length,
    });
    totalIssues += issues.length;
  }

  return { tools: results, totalIssues };
}

// ---------------------------------------------------------------------------
// MCP Server setup
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "mcp-security-checker",
  version: "1.0.0",
});

// Tool 1: check_mcp_security
server.tool(
  "check_mcp_security",
  "Reads an MCP configuration file and analyzes it for security issues including hardcoded secrets, dangerous commands, insecure URLs, shell injection, privilege escalation, and tunneling services.",
  {
    filePath: z
      .string()
      .describe("Absolute path to the MCP configuration JSON file to analyze"),
  },
  async ({ filePath }) => {
    try {
      const resolvedPath = path.resolve(filePath);

      if (!fs.existsSync(resolvedPath)) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { error: `File not found: ${resolvedPath}` },
                null,
                2
              ),
            },
          ],
        };
      }

      const raw = fs.readFileSync(resolvedPath, "utf-8");
      let config: Record<string, unknown>;
      try {
        config = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { error: "Failed to parse JSON from file" },
                null,
                2
              ),
            },
          ],
        };
      }

      const result = analyzeConfigSecurity(resolvedPath, config);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                error: `Analysis failed: ${err instanceof Error ? err.message : String(err)}`,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

// Tool 2: discover_mcp_configs
server.tool(
  "discover_mcp_configs",
  "Searches known locations on disk for MCP configuration files (Claude Desktop, Claude Code, Cursor, Windsurf, VS Code) and reports which exist and how many servers each contains.",
  {},
  async () => {
    try {
      const result = discoverConfigs();
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                error: `Discovery failed: ${err instanceof Error ? err.message : String(err)}`,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

// Tool 3: check_npm_package_trust
server.tool(
  "check_npm_package_trust",
  "Checks the trustworthiness of an npm package by analyzing its age, maintainer count, version history, install scripts, repository link, and weekly downloads. Useful for vetting MCP server packages before installation.",
  {
    packageName: z
      .string()
      .describe("The npm package name to check (e.g. '@modelcontextprotocol/server-filesystem')"),
  },
  async ({ packageName }) => {
    try {
      const result = await checkNpmTrust(packageName);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                error: `Trust check failed: ${err instanceof Error ? err.message : String(err)}`,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

// Tool 4: check_typosquatting
server.tool(
  "check_typosquatting",
  "Checks if an npm package name is suspiciously similar to known legitimate MCP packages, detecting possible typosquatting or scope confusion attacks.",
  {
    packageName: z
      .string()
      .describe("The npm package name to check for typosquatting"),
  },
  async ({ packageName }) => {
    try {
      const result = checkTyposquatting(packageName);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                error: `Typosquatting check failed: ${err instanceof Error ? err.message : String(err)}`,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

// Tool 5: analyze_tool_descriptions
server.tool(
  "analyze_tool_descriptions",
  "Analyzes MCP tool definitions for security issues including prompt injection in descriptions, dangerous parameter names that suggest code execution, unrestricted file path parameters, and SSRF-enabling URL parameters.",
  {
    tools: z
      .array(
        z.object({
          name: z.string().describe("Tool name"),
          description: z.string().describe("Tool description text"),
          inputSchema: z
            .record(z.unknown())
            .optional()
            .describe("JSON Schema object for the tool's input parameters"),
        })
      )
      .describe("Array of tool definitions to analyze"),
  },
  async ({ tools }) => {
    try {
      const result = analyzeToolDescriptions(tools);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                error: `Tool analysis failed: ${err instanceof Error ? err.message : String(err)}`,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Security Checker server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});

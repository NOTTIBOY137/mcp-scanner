import { Probot, Context } from "probot";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface McpServerConfig {
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  [key: string]: unknown;
}

interface McpConfigFile {
  mcpServers?: Record<string, McpServerConfig>;
  servers?: Record<string, McpServerConfig>;
  [key: string]: unknown;
}

type Severity = "error" | "warning";

interface Finding {
  severity: Severity;
  rule: string;
  message: string;
  owaspRef: string;
  /** The name of the server block where the issue was found */
  serverName: string;
  /** Raw value that triggered the finding (for auto-fix) */
  rawValue?: string;
  /** Suggested env var name for secret replacement */
  suggestedEnvVar?: string;
}

interface FileAnalysis {
  filename: string;
  findings: Finding[];
  content: string;
  sha: string;
  patch?: string;
  /** First changed line in the PR diff (for inline comments) */
  diffPosition?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MCP_CONFIG_PATTERNS: string[] = [
  ".vscode/mcp.json",
  ".cursor/mcp.json",
  "claude_desktop_config.json",
  ".mcp.json",
];

const DANGEROUS_COMMANDS = new Set([
  "sh",
  "bash",
  "zsh",
  "ksh",
  "csh",
  "fish",
  "powershell",
  "pwsh",
  "cmd",
  "cmd.exe",
  "sudo",
  "su",
  "doas",
  "rm",
  "rmdir",
  "del",
  "format",
  "mkfs",
  "dd",
  "chmod",
  "chown",
  "nc",
  "ncat",
  "netcat",
  "telnet",
]);

const DANGEROUS_ARG_PATTERNS: RegExp[] = [
  /[|;&`$]/, // shell metacharacters
  /\$\(.*\)/, // command substitution
  /`[^`]+`/, // backtick substitution
  />\s*\//, // redirect to absolute path
  /\beval\b/, // eval usage
  /\bexec\b/, // exec usage
  /\bsource\b/, // source usage
  /\bcurl\b.*\|\s*(sh|bash)/, // curl-pipe-shell
  /\bwget\b.*\|\s*(sh|bash)/, // wget-pipe-shell
];

const SECRET_PATTERNS: { pattern: RegExp; name: string }[] = [
  { pattern: /sk-[a-zA-Z0-9]{20,}/, name: "OpenAI API key" },
  { pattern: /sk-ant-[a-zA-Z0-9-]{20,}/, name: "Anthropic API key" },
  { pattern: /ghp_[a-zA-Z0-9]{36,}/, name: "GitHub personal access token" },
  { pattern: /gho_[a-zA-Z0-9]{36,}/, name: "GitHub OAuth token" },
  { pattern: /ghs_[a-zA-Z0-9]{36,}/, name: "GitHub server token" },
  { pattern: /github_pat_[a-zA-Z0-9_]{22,}/, name: "GitHub fine-grained PAT" },
  { pattern: /AKIA[0-9A-Z]{16}/, name: "AWS access key ID" },
  { pattern: /xoxb-[0-9-]+[a-zA-Z0-9-]+/, name: "Slack bot token" },
  { pattern: /xoxp-[0-9-]+[a-zA-Z0-9-]+/, name: "Slack user token" },
  { pattern: /glpat-[a-zA-Z0-9_-]{20,}/, name: "GitLab PAT" },
  { pattern: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/, name: "JWT token" },
  { pattern: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/, name: "Private key" },
  { pattern: /AIza[0-9A-Za-z_-]{35}/, name: "Google API key" },
  { pattern: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/, name: "SendGrid API key" },
  { pattern: /[a-f0-9]{32,64}/, name: "Possible hex-encoded secret" },
];

const SENSITIVE_ENV_NAMES: RegExp[] = [
  /password/i,
  /secret/i,
  /token/i,
  /key/i,
  /credential/i,
  /auth/i,
  /private/i,
];

// ---------------------------------------------------------------------------
// Analysis engine
// ---------------------------------------------------------------------------

function analyzeServer(
  serverName: string,
  config: McpServerConfig
): Finding[] {
  const findings: Finding[] = [];

  // Rule 1: Dangerous commands
  if (config.command) {
    const baseCmd = config.command.split("/").pop() ?? config.command;
    if (DANGEROUS_COMMANDS.has(baseCmd.toLowerCase())) {
      findings.push({
        severity: "error",
        rule: "dangerous-command",
        message: `Server "${serverName}" uses dangerous command \`${config.command}\`. This can enable arbitrary code execution on the host machine.`,
        owaspRef: "OWASP MCP Top 10: MCP-01 (Tool Poisoning / Rug Pulls)",
        serverName,
      });
    }
  }

  // Rule 2: Dangerous argument patterns
  if (config.args && Array.isArray(config.args)) {
    for (const arg of config.args) {
      for (const pattern of DANGEROUS_ARG_PATTERNS) {
        if (pattern.test(arg)) {
          findings.push({
            severity: "error",
            rule: "dangerous-args",
            message: `Server "${serverName}" has a suspicious argument: \`${truncate(arg, 80)}\`. Shell metacharacters or injection patterns detected.`,
            owaspRef: "OWASP MCP Top 10: MCP-04 (Tool Argument Injection)",
            serverName,
          });
          break; // one finding per arg
        }
      }
    }
  }

  // Rule 3: Hardcoded secrets in command, args, url, or env values
  const valuesToCheck: { value: string; location: string }[] = [];

  if (config.command) {
    valuesToCheck.push({ value: config.command, location: "command" });
  }
  if (config.args) {
    for (const arg of config.args) {
      valuesToCheck.push({ value: arg, location: "args" });
    }
  }
  if (config.url) {
    valuesToCheck.push({ value: config.url, location: "url" });
  }
  if (config.env && typeof config.env === "object") {
    for (const [envKey, envVal] of Object.entries(config.env)) {
      if (typeof envVal === "string") {
        valuesToCheck.push({ value: envVal, location: `env.${envKey}` });
      }
    }
  }

  for (const { value, location } of valuesToCheck) {
    // Skip values that already use env var references
    if (/^\$\{env:[^}]+\}$/.test(value)) continue;

    for (const sp of SECRET_PATTERNS) {
      if (sp.pattern.test(value)) {
        // Don't flag short hex strings in URLs (they are often hashes, not secrets)
        if (sp.name === "Possible hex-encoded secret" && location === "url") {
          continue;
        }
        const suggestedEnvVar = deriveEnvVarName(serverName, location);
        findings.push({
          severity: "error",
          rule: "hardcoded-secret",
          message: `Server "${serverName}" contains a hardcoded ${sp.name} in \`${location}\`. Use \`\${env:${suggestedEnvVar}}\` instead.`,
          owaspRef:
            "OWASP MCP Top 10: MCP-05 (Secrets and Key Management Failures)",
          serverName,
          rawValue: value,
          suggestedEnvVar,
        });
        break; // one finding per value
      }
    }
  }

  // Rule 4: Non-HTTPS URLs
  if (config.url && typeof config.url === "string") {
    if (/^http:\/\//i.test(config.url)) {
      findings.push({
        severity: "error",
        rule: "insecure-url",
        message: `Server "${serverName}" uses a non-HTTPS URL: \`${truncate(config.url, 80)}\`. All MCP server connections should use TLS.`,
        owaspRef:
          "OWASP MCP Top 10: MCP-06 (Insecure MCP-Server Communication)",
        serverName,
      });
    }
  }

  // Rule 5: npx without pinned version
  if (config.command === "npx" && config.args && Array.isArray(config.args)) {
    const packageArgs = config.args.filter(
      (a) => !a.startsWith("-") && !a.startsWith("@")
    );
    for (const pkg of packageArgs) {
      // A pinned package would look like "package@1.2.3" or "package@^1.0.0"
      if (!/@[\d^~]/.test(pkg) && pkg.length > 0 && !pkg.includes("/")) {
        findings.push({
          severity: "warning",
          rule: "unpinned-npx",
          message: `Server "${serverName}" runs \`npx ${pkg}\` without a pinned version. This is vulnerable to dependency confusion and supply-chain attacks. Pin a specific version, e.g. \`${pkg}@1.0.0\`.`,
          owaspRef:
            "OWASP MCP Top 10: MCP-09 (Lack of MCP Server Integrity Verification)",
          serverName,
        });
      }
    }
  }

  // Rule 6: Excessive env vars passing sensitive data
  if (config.env && typeof config.env === "object") {
    const envKeys = Object.keys(config.env);
    const sensitiveKeys = envKeys.filter((k) =>
      SENSITIVE_ENV_NAMES.some((pat) => pat.test(k))
    );
    if (sensitiveKeys.length > 3) {
      findings.push({
        severity: "warning",
        rule: "excessive-env-secrets",
        message: `Server "${serverName}" passes ${sensitiveKeys.length} sensitive-looking environment variables (${sensitiveKeys.slice(0, 5).join(", ")}${sensitiveKeys.length > 5 ? ", ..." : ""}). Consider using a secrets manager or reducing exposed credentials.`,
        owaspRef:
          "OWASP MCP Top 10: MCP-05 (Secrets and Key Management Failures)",
        serverName,
      });
    }
  }

  return findings;
}

function analyzeConfig(filename: string, raw: string): Finding[] {
  let parsed: McpConfigFile;
  try {
    parsed = JSON.parse(raw) as McpConfigFile;
  } catch {
    return [
      {
        severity: "warning",
        rule: "invalid-json",
        message: `Failed to parse \`${filename}\` as JSON. Cannot perform security analysis.`,
        owaspRef: "N/A",
        serverName: "(file-level)",
      },
    ];
  }

  const servers: Record<string, McpServerConfig> =
    parsed.mcpServers ?? parsed.servers ?? {};

  if (typeof servers !== "object" || servers === null) {
    return [];
  }

  const findings: Finding[] = [];
  for (const [name, cfg] of Object.entries(servers)) {
    if (cfg && typeof cfg === "object") {
      findings.push(...analyzeServer(name, cfg));
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 3) + "..." : s;
}

function deriveEnvVarName(serverName: string, location: string): string {
  const base = serverName.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  const suffix = location
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_")
    .replace(/^ENV_/, "");
  return `${base}_${suffix}`;
}

function isMcpConfigFile(filename: string): boolean {
  return MCP_CONFIG_PATTERNS.some(
    (pattern) => filename === pattern || filename.endsWith(`/${pattern}`)
  );
}

/**
 * Find the position within the PR diff for inline review comments.
 * Returns 1 as a safe fallback (first line of the diff hunk).
 */
function findDiffPosition(patch: string | undefined): number {
  if (!patch) return 1;
  // Count lines in the patch to comment on the last line
  const lines = patch.split("\n");
  return Math.max(1, lines.length - 1);
}

function buildReviewBody(allFindings: FileAnalysis[]): string {
  const totalErrors = allFindings.reduce(
    (sum, f) => sum + f.findings.filter((x) => x.severity === "error").length,
    0
  );
  const totalWarnings = allFindings.reduce(
    (sum, f) => sum + f.findings.filter((x) => x.severity === "warning").length,
    0
  );

  const lines: string[] = [];
  lines.push("## MCP Config Security Scan Results\n");

  if (totalErrors === 0 && totalWarnings === 0) {
    lines.push(
      "No security issues found in the MCP configuration files in this PR."
    );
    return lines.join("\n");
  }

  lines.push(
    `Found **${totalErrors} error(s)** and **${totalWarnings} warning(s)** across ${allFindings.length} file(s).\n`
  );

  for (const file of allFindings) {
    lines.push(`### \`${file.filename}\`\n`);
    for (const f of file.findings) {
      const icon = f.severity === "error" ? ":x:" : ":warning:";
      lines.push(`- ${icon} **[${f.rule}]** ${f.message}`);
      if (f.owaspRef !== "N/A") {
        lines.push(`  - Ref: ${f.owaspRef}`);
      }
    }
    lines.push("");
  }

  lines.push("---");
  lines.push(
    "*Scan powered by [mcp-scanner](https://github.com/your-org/mcp-scanner). " +
      "See the [OWASP MCP Top 10](https://owasp.org/www-project-mcp-top-10/) for details.*"
  );

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Auto-fix PR creation
// ---------------------------------------------------------------------------

async function createAutoFixPR(
  context: Context<"pull_request">,
  analyses: FileAnalysis[]
): Promise<string | null> {
  const pr = context.payload.pull_request;
  const repo = context.repo();
  const headRef = pr.head.ref;
  const headSha = pr.head.sha;
  const fixBranch = `mcp-scanner/fix-${headRef}-${Date.now()}`;

  // Collect files that have hardcoded-secret findings
  const filesToFix = analyses.filter((a) =>
    a.findings.some((f) => f.rule === "hardcoded-secret" && f.suggestedEnvVar)
  );

  if (filesToFix.length === 0) {
    return null;
  }

  context.log.info(
    `Creating auto-fix branch "${fixBranch}" for ${filesToFix.length} file(s)`
  );

  try {
    // Create a new branch from the PR head
    await context.octokit.git.createRef({
      ...repo,
      ref: `refs/heads/${fixBranch}`,
      sha: headSha,
    });

    // For each file, replace hardcoded secrets with env references
    for (const analysis of filesToFix) {
      let content = analysis.content;
      const secretFindings = analysis.findings.filter(
        (f) => f.rule === "hardcoded-secret" && f.rawValue && f.suggestedEnvVar
      );

      for (const finding of secretFindings) {
        if (finding.rawValue && finding.suggestedEnvVar) {
          // Replace the raw secret value with the ${env:VAR_NAME} pattern
          content = content.replace(
            finding.rawValue,
            `\${env:${finding.suggestedEnvVar}}`
          );
        }
      }

      // Commit the fixed file
      const encoded = Buffer.from(content).toString("base64");
      await context.octokit.repos.createOrUpdateFileContents({
        ...repo,
        path: analysis.filename,
        message: `fix: replace hardcoded secrets with env references in ${analysis.filename}`,
        content: encoded,
        sha: analysis.sha,
        branch: fixBranch,
      });
    }

    // Open a PR from the fix branch into the original PR's head branch
    const fixPr = await context.octokit.pulls.create({
      ...repo,
      title: `[mcp-scanner] Fix hardcoded secrets in MCP config files`,
      head: fixBranch,
      base: headRef,
      body: [
        "## Auto-fix: Replace hardcoded secrets with environment variable references\n",
        "This PR was automatically created by **mcp-scanner** after detecting hardcoded secrets in MCP configuration files.\n",
        "### Changes made\n",
        ...filesToFix.map((f) => {
          const count = f.findings.filter(
            (x) => x.rule === "hardcoded-secret"
          ).length;
          return `- \`${f.filename}\`: replaced ${count} hardcoded secret(s) with \`\${env:VAR_NAME}\` references`;
        }),
        "\n### Next steps\n",
        "1. Review the changes to ensure correctness",
        "2. Set the corresponding environment variables in your MCP server runtime",
        "3. Merge this PR into your feature branch\n",
        "---",
        "*Ref: OWASP MCP Top 10: MCP-05 (Secrets and Key Management Failures)*",
      ].join("\n"),
    });

    context.log.info(`Auto-fix PR created: ${fixPr.data.html_url}`);
    return fixPr.data.html_url;
  } catch (err) {
    context.log.error(
      `Failed to create auto-fix PR: ${err instanceof Error ? err.message : String(err)}`
    );
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main Probot app
// ---------------------------------------------------------------------------

export default function app(robot: Probot): void {
  robot.on(
    ["pull_request.opened", "pull_request.synchronize"],
    async (context) => {
      const pr = context.payload.pull_request;
      const repo = context.repo();

      context.log.info(
        `Scanning PR #${pr.number} (${pr.title}) in ${repo.owner}/${repo.repo}`
      );

      // 1. List all files in the PR with pagination
      const prFiles: Array<{
        filename: string;
        status: string;
        patch?: string;
        sha: string;
      }> = [];

      try {
        for await (const response of context.octokit.paginate.iterator(
          context.octokit.pulls.listFiles,
          {
            ...repo,
            pull_number: pr.number,
            per_page: 100,
          }
        )) {
          for (const file of response.data) {
            prFiles.push({
              filename: file.filename,
              status: file.status,
              patch: file.patch,
              sha: file.sha,
            });
          }
        }
      } catch (err) {
        context.log.error(
          `Failed to list PR files: ${err instanceof Error ? err.message : String(err)}`
        );
        return;
      }

      // 2. Filter for MCP config files (skip deleted files)
      const mcpFiles = prFiles.filter(
        (f) => isMcpConfigFile(f.filename) && f.status !== "removed"
      );

      if (mcpFiles.length === 0) {
        context.log.info("No MCP config files found in this PR, skipping.");
        return;
      }

      context.log.info(
        `Found ${mcpFiles.length} MCP config file(s): ${mcpFiles.map((f) => f.filename).join(", ")}`
      );

      // 3. Fetch content and analyze each file
      const analyses: FileAnalysis[] = [];

      for (const file of mcpFiles) {
        try {
          const contentResponse = await context.octokit.repos.getContent({
            ...repo,
            path: file.filename,
            ref: pr.head.sha,
          });

          const data = contentResponse.data;
          if (!("content" in data) || !data.content) {
            context.log.warn(
              `No content returned for ${file.filename}, skipping.`
            );
            continue;
          }

          const decoded = Buffer.from(data.content, "base64").toString("utf-8");
          const findings = analyzeConfig(file.filename, decoded);

          if (findings.length > 0) {
            analyses.push({
              filename: file.filename,
              findings,
              content: decoded,
              sha: data.sha,
              patch: file.patch,
              diffPosition: findDiffPosition(file.patch),
            });
          }
        } catch (err) {
          context.log.error(
            `Failed to fetch content for ${file.filename}: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }

      if (analyses.length === 0) {
        context.log.info("No security issues found in MCP config files.");
        return;
      }

      // 4. Build inline review comments
      const comments: Array<{
        path: string;
        position: number;
        body: string;
      }> = [];

      for (const analysis of analyses) {
        for (const finding of analysis.findings) {
          const icon = finding.severity === "error" ? ":x:" : ":warning:";
          const body = [
            `${icon} **[${finding.rule}]** ${finding.message}`,
            "",
            `> ${finding.owaspRef}`,
          ].join("\n");

          comments.push({
            path: analysis.filename,
            position: analysis.diffPosition ?? 1,
            body,
          });
        }
      }

      // 5. Determine review event type
      const hasErrors = analyses.some((a) =>
        a.findings.some((f) => f.severity === "error")
      );
      const event: "REQUEST_CHANGES" | "COMMENT" = hasErrors
        ? "REQUEST_CHANGES"
        : "COMMENT";

      // 6. Post the review
      try {
        await context.octokit.pulls.createReview({
          ...repo,
          pull_number: pr.number,
          commit_id: pr.head.sha,
          body: buildReviewBody(analyses),
          event,
          comments,
        });
        context.log.info(
          `Posted ${event} review with ${comments.length} comment(s) on PR #${pr.number}`
        );
      } catch (err) {
        context.log.error(
          `Failed to post review: ${err instanceof Error ? err.message : String(err)}`
        );

        // Fallback: post as a regular issue comment if review creation fails
        // (e.g., when diff positions are stale)
        try {
          await context.octokit.issues.createComment({
            ...repo,
            issue_number: pr.number,
            body: buildReviewBody(analyses),
          });
          context.log.info(
            `Fallback: posted findings as issue comment on PR #${pr.number}`
          );
        } catch (fallbackErr) {
          context.log.error(
            `Fallback comment also failed: ${fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)}`
          );
        }
      }

      // 7. Attempt auto-fix for hardcoded secrets
      const hasSecretFindings = analyses.some((a) =>
        a.findings.some((f) => f.rule === "hardcoded-secret")
      );

      if (hasSecretFindings) {
        const fixPrUrl = await createAutoFixPR(context, analyses);
        if (fixPrUrl) {
          try {
            await context.octokit.issues.createComment({
              ...repo,
              issue_number: pr.number,
              body: `:wrench: An auto-fix PR has been created to replace hardcoded secrets with environment variable references: ${fixPrUrl}`,
            });
          } catch (err) {
            context.log.error(
              `Failed to post auto-fix comment: ${err instanceof Error ? err.message : String(err)}`
            );
          }
        }
      }
    }
  );
}

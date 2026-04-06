import * as vscode from 'vscode';
import { parseTree, findNodeAtLocation, Node } from 'jsonc-parser';

/** Severity levels for findings */
type FindingSeverity = 'critical' | 'high' | 'medium' | 'low';

interface Finding {
  message: string;
  severity: FindingSeverity;
  offset: number;
  length: number;
  code: string;
}

/** Commands considered dangerous when used as the server command */
const DANGEROUS_COMMANDS = new Set([
  'sh', 'bash', 'zsh', 'fish', 'csh', 'ksh',
  'cmd', 'cmd.exe', 'powershell', 'powershell.exe', 'pwsh',
  'sudo', 'su', 'eval', 'exec',
  'curl', 'wget', 'nc', 'ncat', 'netcat',
  'chmod', 'chown', 'rm', 'del',
]);

/** Shell metacharacters that indicate potential injection */
const DANGEROUS_ARG_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /[;&|`$]/, label: 'shell metacharacter' },
  { pattern: /\$\(/, label: 'command substitution' },
  { pattern: />\s*\//, label: 'file redirection to absolute path' },
  { pattern: /\|\s*\w+/, label: 'pipe operator' },
];

/** Regex patterns for detecting hardcoded secrets */
const SECRET_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /sk-[A-Za-z0-9]{20,}/, label: 'OpenAI API key' },
  { pattern: /sk-ant-[A-Za-z0-9\-_]{20,}/, label: 'Anthropic API key' },
  { pattern: /ghp_[A-Za-z0-9]{36,}/, label: 'GitHub personal access token' },
  { pattern: /gho_[A-Za-z0-9]{36,}/, label: 'GitHub OAuth token' },
  { pattern: /github_pat_[A-Za-z0-9_]{20,}/, label: 'GitHub fine-grained token' },
  { pattern: /AKIA[0-9A-Z]{16}/, label: 'AWS access key ID' },
  { pattern: /glpat-[A-Za-z0-9\-_]{20,}/, label: 'GitLab personal access token' },
  { pattern: /xox[bporas]-[A-Za-z0-9\-]{10,}/, label: 'Slack token' },
  { pattern: /AIza[A-Za-z0-9\-_]{35}/, label: 'Google API key' },
  { pattern: /eyJ[A-Za-z0-9\-_]{30,}\.eyJ[A-Za-z0-9\-_]{30,}/, label: 'JWT token' },
  { pattern: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/, label: 'Private key' },
  { pattern: /SG\.[A-Za-z0-9\-_]{22}\.[A-Za-z0-9\-_]{43}/, label: 'SendGrid API key' },
  { pattern: /sq0atp-[A-Za-z0-9\-_]{22}/, label: 'Square access token' },
];

/** Sensitive filesystem paths */
const SENSITIVE_PATHS: { pattern: RegExp; label: string }[] = [
  { pattern: /\/etc\/(?:passwd|shadow|sudoers)/, label: 'system auth file' },
  { pattern: /~?\/?\.ssh\//, label: 'SSH directory' },
  { pattern: /~?\/?\.aws\//, label: 'AWS credentials directory' },
  { pattern: /~?\/?\.gnupg\//, label: 'GPG keyring directory' },
  { pattern: /~?\/?\.kube\/config/, label: 'Kubernetes config' },
  { pattern: /\/proc\//, label: '/proc filesystem' },
];

/**
 * Scans an MCP configuration document and returns diagnostics.
 */
export function scanMcpDocument(document: vscode.TextDocument): vscode.Diagnostic[] {
  const text = document.getText();
  const tree = parseTree(text, undefined, { allowTrailingComma: true, disallowComments: false });

  if (!tree) {
    return [];
  }

  const findings: Finding[] = [];

  // MCP configs use either "mcpServers" (Claude Desktop) or "servers" (VS Code / Cursor)
  const serversNode = findNodeAtLocation(tree, ['mcpServers']) ?? findNodeAtLocation(tree, ['servers']);
  if (!serversNode || serversNode.type !== 'object' || !serversNode.children) {
    return [];
  }

  for (const serverProperty of serversNode.children) {
    if (serverProperty.type !== 'property' || !serverProperty.children || serverProperty.children.length < 2) {
      continue;
    }

    const serverNameNode = serverProperty.children[0];
    const serverNode = serverProperty.children[1];
    const serverName = serverNameNode.value as string;

    if (serverNode.type !== 'object') {
      continue;
    }

    checkCommand(serverNode, serverName, findings);
    checkArgs(serverNode, serverName, findings);
    checkEnv(serverNode, serverName, findings);
    checkUrl(serverNode, serverName, findings);
    checkNpxVersion(serverNode, serverName, findings);
    checkSensitivePaths(serverNode, serverName, findings, text);
  }

  return findings.map((f) => {
    const range = new vscode.Range(
      document.positionAt(f.offset),
      document.positionAt(f.offset + f.length)
    );
    const severity = mapSeverity(f.severity);
    const diagnostic = new vscode.Diagnostic(range, f.message, severity);
    diagnostic.code = f.code;
    diagnostic.source = 'MCP Guardian';
    return diagnostic;
  });
}

function mapSeverity(severity: FindingSeverity): vscode.DiagnosticSeverity {
  switch (severity) {
    case 'critical':
    case 'high':
      return vscode.DiagnosticSeverity.Error;
    case 'medium':
      return vscode.DiagnosticSeverity.Warning;
    case 'low':
      return vscode.DiagnosticSeverity.Information;
  }
}

/** Check if the server command is dangerous */
function checkCommand(serverNode: Node, serverName: string, findings: Finding[]): void {
  const commandNode = findNodeAtLocation(serverNode, ['command']);
  if (!commandNode || commandNode.type !== 'string') {
    return;
  }

  const command = commandNode.value as string;
  const baseName = command.split('/').pop() ?? command;

  if (DANGEROUS_COMMANDS.has(baseName.toLowerCase())) {
    findings.push({
      message: `Server "${serverName}": Dangerous command "${baseName}". Direct shell/system commands can enable arbitrary code execution.`,
      severity: 'critical',
      offset: commandNode.offset,
      length: commandNode.length,
      code: 'dangerous-command',
    });
  }
}

/** Check args for shell metacharacters and secrets */
function checkArgs(serverNode: Node, serverName: string, findings: Finding[]): void {
  const argsNode = findNodeAtLocation(serverNode, ['args']);
  if (!argsNode || argsNode.type !== 'array' || !argsNode.children) {
    return;
  }

  for (const argNode of argsNode.children) {
    if (argNode.type !== 'string') {
      continue;
    }

    const argValue = argNode.value as string;

    // Check for dangerous patterns
    for (const { pattern, label } of DANGEROUS_ARG_PATTERNS) {
      if (pattern.test(argValue)) {
        findings.push({
          message: `Server "${serverName}": Argument contains ${label}. This may allow shell injection.`,
          severity: 'high',
          offset: argNode.offset,
          length: argNode.length,
          code: 'dangerous-arg',
        });
        break;
      }
    }

    // Check for hardcoded secrets in args
    checkStringForSecrets(argNode, serverName, findings);
  }
}

/** Check env vars for hardcoded secrets */
function checkEnv(serverNode: Node, serverName: string, findings: Finding[]): void {
  const envNode = findNodeAtLocation(serverNode, ['env']);
  if (!envNode || envNode.type !== 'object' || !envNode.children) {
    return;
  }

  for (const envProperty of envNode.children) {
    if (envProperty.type !== 'property' || !envProperty.children || envProperty.children.length < 2) {
      continue;
    }

    const valueNode = envProperty.children[1];
    if (valueNode.type !== 'string') {
      continue;
    }

    checkStringForSecrets(valueNode, serverName, findings);
  }
}

/** Check a string node for hardcoded secrets */
function checkStringForSecrets(node: Node, serverName: string, findings: Finding[]): void {
  const value = node.value as string;

  // Skip environment variable references
  if (/^\$\{env:/.test(value) || /^\$\{/.test(value) || /^%[^%]+%$/.test(value)) {
    return;
  }

  for (const { pattern, label } of SECRET_PATTERNS) {
    if (pattern.test(value)) {
      findings.push({
        message: `Server "${serverName}": Possible hardcoded ${label} detected. Use environment variable references instead (e.g., "\${env:SECRET_NAME}").`,
        severity: 'critical',
        offset: node.offset,
        length: node.length,
        code: 'hardcoded-secret',
      });
      return; // One finding per node is enough
    }
  }
}

/** Check for non-HTTPS URLs */
function checkUrl(serverNode: Node, serverName: string, findings: Finding[]): void {
  const urlNode = findNodeAtLocation(serverNode, ['url']);
  if (!urlNode || urlNode.type !== 'string') {
    return;
  }

  const url = urlNode.value as string;

  if (/^http:\/\//i.test(url) && !url.startsWith('http://localhost') && !url.startsWith('http://127.0.0.1') && !url.startsWith('http://[::1]')) {
    findings.push({
      message: `Server "${serverName}": URL uses insecure HTTP. Use HTTPS to prevent man-in-the-middle attacks.`,
      severity: 'medium',
      offset: urlNode.offset,
      length: urlNode.length,
      code: 'insecure-url',
    });
  }
}

/** Check for npx without pinned version */
function checkNpxVersion(serverNode: Node, serverName: string, findings: Finding[]): void {
  const commandNode = findNodeAtLocation(serverNode, ['command']);
  if (!commandNode || commandNode.type !== 'string') {
    return;
  }

  const command = (commandNode.value as string).toLowerCase();
  if (command !== 'npx' && !command.endsWith('/npx')) {
    return;
  }

  const argsNode = findNodeAtLocation(serverNode, ['args']);
  if (!argsNode || argsNode.type !== 'array' || !argsNode.children) {
    return;
  }

  // Look for the package name arg (skip flags like -y, --yes, -p, --package)
  for (const argNode of argsNode.children) {
    if (argNode.type !== 'string') {
      continue;
    }
    const argValue = argNode.value as string;
    if (argValue.startsWith('-')) {
      continue;
    }

    // Check if the package has a version specifier (@ followed by digits or range)
    if (!/@[\d^~>=<]/.test(argValue)) {
      findings.push({
        message: `Server "${serverName}": npx package "${argValue}" has no pinned version. Pin with "@version" to prevent supply-chain attacks (e.g., "${argValue}@1.0.0").`,
        severity: 'medium',
        offset: argNode.offset,
        length: argNode.length,
        code: 'npx-no-version',
      });
    }
    break; // Only check the first non-flag argument
  }
}

/** Check for sensitive filesystem paths across the entire server config */
function checkSensitivePaths(serverNode: Node, serverName: string, findings: Finding[], fullText: string): void {
  // Scan the raw text range of this server node
  const serverText = fullText.substring(serverNode.offset, serverNode.offset + serverNode.length);

  for (const { pattern, label } of SENSITIVE_PATHS) {
    const match = pattern.exec(serverText);
    if (match) {
      findings.push({
        message: `Server "${serverName}": References ${label} ("${match[0]}"). Exposing sensitive paths can leak credentials.`,
        severity: 'high',
        offset: serverNode.offset + match.index,
        length: match[0].length,
        code: 'sensitive-path',
      });
    }
  }
}

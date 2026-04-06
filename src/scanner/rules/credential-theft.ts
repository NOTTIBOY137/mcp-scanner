import type { ScanRule } from "@/types/scan";

export const credentialTheftRules: ScanRule[] = [
  {
    id: "CT001",
    category: "credential-theft",
    title: "Access to sensitive environment variables",
    description:
      "Reading environment variables containing API keys, secrets, tokens, or passwords may indicate credential harvesting.",
    severity: "high",
    pattern:
      /process\.env\s*\[\s*["'`]?\s*\w*(?:API_KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL|PRIVATE_KEY|AUTH)\w*\s*["'`]?\s*\]/gi,
    remediation: "Access only the specific env vars needed. Avoid dynamic bracket-notation access to sensitive variables.",
  },
  {
    id: "CT002",
    category: "credential-theft",
    title: "Reading sensitive credential files",
    description:
      "Accessing files like ~/.aws/credentials, ~/.ssh/id_rsa, or .env files suggests credential theft.",
    severity: "critical",
    pattern:
      /(?:readFileSync|readFile|createReadStream)\s*\([^)]*(?:\.aws\/credentials|\.ssh\/id_rsa|\.ssh\/id_ed25519|\.npmrc|\.netrc|\.pgpass)/g,
    remediation: "Remove direct file reads of credential files. Use a secrets manager or environment variables.",
  },
  {
    id: "CT003",
    category: "credential-theft",
    title: "Base64 encoding of sensitive data",
    description:
      "Encoding environment variables or credential file contents to Base64 is a common exfiltration obfuscation technique.",
    severity: "high",
    pattern:
      /(?:btoa|Buffer\.from)\s*\([^)]*(?:process\.env|(?:secret|token|password|key|credential))/gi,
    remediation: "Remove Base64 encoding of credentials. If encoding is needed, use a proper encryption library.",
  },
  {
    id: "CT004",
    category: "credential-theft",
    title: "Exfiltrating environment variables via HTTP",
    description:
      "Sending environment variables or credentials over HTTP indicates active credential exfiltration.",
    severity: "critical",
    pattern:
      /(?:fetch|axios|http\.request|https\.request|got|request)\s*\([^)]*(?:process\.env|JSON\.stringify\s*\(\s*process\.env)/g,
    remediation: "Remove HTTP exfiltration of env vars. Never send process.env over the network.",
  },
  {
    id: "CT005",
    category: "credential-theft",
    title: "Bulk process.env access",
    description:
      "Accessing the entire process.env object (rather than specific variables) may indicate an attempt to harvest all credentials.",
    severity: "high",
    pattern:
      /JSON\.stringify\s*\(\s*process\.env\s*\)|Object\.(?:keys|values|entries)\s*\(\s*process\.env\s*\)|{?\s*\.\.\.process\.env\s*}?/g,
    remediation: "Access specific env vars by name instead of the entire process.env object.",
  },
  {
    id: "CT006",
    category: "credential-theft",
    title: "Hardcoded API key or token literal",
    description:
      "String literals matching known API key prefixes (sk-, ghp_, AKIA, xoxb-, etc.) or long base64-like strings may expose secrets in source code.",
    severity: "critical",
    pattern:
      /["'`](sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36,}|gho_[a-zA-Z0-9]{36,}|AKIA[A-Z0-9]{16}|xoxb-[a-zA-Z0-9\-]{20,}|xoxp-[a-zA-Z0-9\-]{20,}|ya29\.[a-zA-Z0-9_\-]{20,}|[A-Za-z0-9+/=]{40,})["'`]/g,
    remediation: "Remove hardcoded secrets from source code. Use environment variables or a secrets manager.",
  },
  {
    id: "CT007",
    category: "credential-theft",
    title: "Dot-notation access to sensitive env vars",
    description:
      "Accessing process.env properties like API_KEY, SECRET, TOKEN, or PASSWORD via dot notation may indicate credential harvesting.",
    severity: "high",
    pattern:
      /process\.env\.\w*(?:API_KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL|PRIVATE_KEY|AUTH|ACCESS_KEY|CLIENT_SECRET)\w*/gi,
    remediation: "Avoid accessing sensitive env vars directly. Use a configuration module that validates and restricts access.",
  },
  {
    id: "CT008",
    category: "credential-theft",
    title: "Python credential file access",
    description: "Accessing credential files via Python's os.path.expanduser targeting .aws, .ssh, or similar.",
    severity: "critical",
    pattern: /os\.path\.(?:expanduser|join)\s*\([^)]*(?:\.aws|\.ssh|\.gnupg|\.config\/gcloud)/g,
    fileFilter: (path: string) => /\.(py|pyw)$/.test(path),
    remediation: "Use a secrets manager instead of directly reading credential files.",
    owaspMcpTop10: "MCP01",
    cweIds: ["CWE-522", "CWE-538"],
  },
  {
    id: "CT009",
    category: "credential-theft",
    title: "Go credential patterns via os.Getenv",
    description: "Accessing secret-related environment variables in Go code.",
    severity: "high",
    pattern: /os\.Getenv\s*\(\s*["']\w*(?:SECRET|TOKEN|PASSWORD|API_KEY|PRIVATE_KEY|CREDENTIAL)\w*["']\s*\)/gi,
    fileFilter: (path: string) => /\.go$/.test(path),
    remediation: "Use a secrets manager or vault. Avoid directly reading sensitive env vars.",
    owaspMcpTop10: "MCP01",
    cweIds: ["CWE-522"],
  },
  {
    id: "CT010",
    category: "credential-theft",
    title: "Rust env::var for secrets",
    description: "Accessing secret-related environment variables in Rust code.",
    severity: "high",
    pattern: /env::var\s*\(\s*["']\w*(?:SECRET|TOKEN|PASSWORD|API_KEY|PRIVATE_KEY|CREDENTIAL)\w*["']\s*\)/gi,
    fileFilter: (path: string) => /\.rs$/.test(path),
    remediation: "Use a secrets manager or vault service instead of direct env var access.",
    owaspMcpTop10: "MCP01",
    cweIds: ["CWE-522"],
  },
  {
    id: "CT011",
    category: "credential-theft",
    title: "Docker/Kubernetes secret mount access",
    description: "Directly reading from /run/secrets/ or /var/run/secrets/ may indicate credential harvesting.",
    severity: "high",
    pattern: /(?:readFileSync|readFile|createReadStream|open)\s*\([^)]*(?:\/run\/secrets\/|\/var\/run\/secrets\/)/g,
    remediation: "Access mounted secrets through a secure secrets provider, not direct file reads.",
    owaspMcpTop10: "MCP01",
    cweIds: ["CWE-522", "CWE-538"],
  },
  {
    id: "CT012",
    category: "credential-theft",
    title: "Browser credential file access",
    description: "Accessing browser profile paths (Chrome, Firefox) to extract stored credentials or cookies.",
    severity: "critical",
    pattern: /(?:readFileSync|readFile|createReadStream|open)\s*\([^)]*(?:\.chrome|\.mozilla|\.firefox|Chrome.*(?:Login\s*Data|Cookies)|(?:Local\s*State|Preferences))/gi,
    remediation: "Remove all browser credential file access. This is a credential theft indicator.",
    owaspMcpTop10: "MCP01",
    cweIds: ["CWE-522", "CWE-538"],
  },
];

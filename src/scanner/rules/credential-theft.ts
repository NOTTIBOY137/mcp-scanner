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
];

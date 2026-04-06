export interface SecretPattern {
  name: string;
  regex: RegExp;
  severity: "critical" | "high" | "medium" | "low";
}

export const SECRET_PATTERNS: SecretPattern[] = [
  // OpenAI
  { name: "OpenAI API Key (legacy)", regex: /sk-[a-zA-Z0-9]{20}T3BlbkFJ[a-zA-Z0-9]{20}/, severity: "critical" },
  { name: "OpenAI API Key (new)", regex: /sk-(?:proj|svcacct|admin)-[A-Za-z0-9_\-]{20,}/, severity: "critical" },
  { name: "OpenAI API Key (broad)", regex: /sk-[A-Za-z0-9]{48,}/, severity: "high" },

  // GitHub
  { name: "GitHub PAT (classic)", regex: /ghp_[a-zA-Z0-9]{36}/, severity: "critical" },
  { name: "GitHub PAT (fine-grained)", regex: /github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/, severity: "critical" },
  { name: "GitHub OAuth Token", regex: /gho_[a-zA-Z0-9]{36}/, severity: "critical" },
  { name: "GitHub User-to-Server", regex: /ghu_[a-zA-Z0-9]{36}/, severity: "critical" },
  { name: "GitHub Server-to-Server", regex: /ghs_[a-zA-Z0-9]{36}/, severity: "critical" },
  { name: "GitHub Refresh Token", regex: /ghr_[a-zA-Z0-9]{36}/, severity: "critical" },

  // AWS
  { name: "AWS Access Key ID", regex: /AKIA[0-9A-Z]{16}/, severity: "critical" },
  { name: "AWS Secret Key", regex: /(?:aws_secret_access_key|aws_secret|secret_key)[\s=:'"]+[A-Za-z0-9/+=]{40}/i, severity: "critical" },

  // Anthropic
  { name: "Anthropic API Key", regex: /sk-ant-api03-[a-zA-Z0-9_\-]{93}AA/, severity: "critical" },
  { name: "Anthropic Key (broad)", regex: /sk-ant-[a-zA-Z0-9\-_]{20,}/, severity: "high" },

  // Stripe
  { name: "Stripe Secret Key", regex: /sk_(?:live|test)_[0-9a-zA-Z]{24,}/, severity: "critical" },
  { name: "Stripe Publishable Key", regex: /pk_(?:live|test)_[0-9a-zA-Z]{24,}/, severity: "medium" },
  { name: "Stripe Restricted Key", regex: /rk_(?:live|test)_[0-9a-zA-Z]{24,}/, severity: "high" },

  // Slack
  { name: "Slack Bot Token", regex: /xoxb-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}/, severity: "critical" },
  { name: "Slack User Token", regex: /xoxp-[0-9]{10,13}-[0-9]{10,13}-[0-9]{10,13}-[a-z0-9]{32}/, severity: "critical" },
  { name: "Slack App Token", regex: /xapp-[0-9]-[A-Z0-9]+-[0-9]+-[a-zA-Z0-9]+/, severity: "high" },
  { name: "Slack Webhook", regex: /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]{8,12}\/B[a-zA-Z0-9_]{8,12}\/[a-zA-Z0-9_]{24}/, severity: "high" },

  // Other providers
  { name: "Google API Key", regex: /AIza[0-9A-Za-z\-_]{35}/, severity: "critical" },
  { name: "GitLab PAT", regex: /glpat-[A-Za-z0-9\-]{20,}/, severity: "critical" },
  { name: "SendGrid API Key", regex: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/, severity: "critical" },
  { name: "Twilio API Key", regex: /SK[0-9a-fA-F]{32}/, severity: "high" },
  { name: "Mailchimp API Key", regex: /[0-9a-f]{32}-us[0-9]{1,2}/, severity: "high" },
  { name: "Private Key Header", regex: /-----BEGIN (?:RSA|DSA|EC|OPENSSH|PGP) PRIVATE KEY/, severity: "critical" },

  // Generic
  { name: "Generic API Key Pattern", regex: /(?:api[_-]?key|token|auth|secret)["'\s:=>{]{1,10}[A-Za-z0-9/+=_\-]{20,}/i, severity: "medium" },
];

export function detectSecrets(value: string): SecretPattern[] {
  return SECRET_PATTERNS.filter((p) => p.regex.test(value));
}

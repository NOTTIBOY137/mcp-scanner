export { SECRET_PATTERNS, detectSecrets } from "./secret-patterns.js";
export type { SecretPattern } from "./secret-patterns.js";

export { shannonEntropy, isHighEntropyString } from "./entropy.js";

export {
  DANGEROUS_COMMANDS,
  DANGEROUS_ARG_PATTERNS,
  SENSITIVE_PATH_PATTERNS,
  SENSITIVE_ENV_VARS,
  analyzeServerConfig,
  analyzeMcpConfig,
} from "./dangerous-commands.js";
export type { SecurityIssue, McpServerConfig, McpConfig } from "./dangerous-commands.js";

export {
  KNOWN_MCP_PACKAGES,
  levenshteinDistance,
  detectTyposquatting,
} from "./typosquatting.js";
export type { TyposquatResult } from "./typosquatting.js";

export { analyzeToolSchema } from "./tool-schema.js";
export type { ToolSchemaIssue } from "./tool-schema.js";

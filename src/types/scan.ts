export type ScanStatus = "pending" | "scanning" | "grading" | "completed" | "failed";

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type Confidence = "high" | "medium" | "low";

export type VulnCategory =
  | "tool-poisoning"
  | "command-injection"
  | "path-traversal"
  | "ssrf"
  | "credential-theft"
  | "excessive-permissions"
  | "missing-auth"
  | "supply-chain"
  | "rug-pull"
  | "data-exfiltration"
  | "insecure-communication"
  | "excessive-data-exposure"
  | "logging-deficiency"
  | "runtime-tool-poisoning"
  | "shadow-mcp-server";

export interface ScanRule {
  id: string;
  category: VulnCategory;
  title: string;
  description: string;
  severity: Severity;
  pattern: RegExp;
  fileFilter?: (path: string) => boolean;
  validator?: (match: RegExpMatchArray, fileContent: string) => boolean;
  severityAdjuster?: (match: RegExpMatchArray, fileContent: string) => Severity;
  remediation?: string;
  owaspMcpTop10?: string;
  cweIds?: string[];
  mitreAtlasIds?: string[];
  remediationCode?: string;
}

export interface RuleMatch {
  ruleId: string;
  category: VulnCategory;
  severity: Severity;
  title: string;
  description: string;
  filePath: string;
  lineNumber: number;
  snippet: string;
  confidence: Confidence;
  remediation?: string;
  owaspMcpTop10?: string;
  cweIds?: string[];
  mitreAtlasIds?: string[];
  remediationCode?: string;
}

export interface FileContent {
  path: string;
  content: string;
}

export interface ScanResult {
  matches: RuleMatch[];
  filesScanned: number;
  duration: number;
}

export interface CategoryScore {
  category: VulnCategory;
  score: number;
  maxScore: number;
  findings: number;
  penalty: number;
}

export interface OWASPComplianceSummary {
  id: string;
  title: string;
  findingsCount: number;
  maxSeverity: Severity | null;
  compliant: boolean;
}

export interface ScanResponse {
  id: string;
  status: ScanStatus;
  grade?: string;
  score?: number;
  filesScanned?: number;
  findingsCount?: number;
  categoryScores?: CategoryScore[];
  findings?: RuleMatch[];
  owaspCompliance?: OWASPComplianceSummary[];
  compliancePercentage?: number;
  error?: string;
}

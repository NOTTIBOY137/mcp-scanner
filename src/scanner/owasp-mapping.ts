import type { VulnCategory, Severity } from "@/types/scan";

export interface OWASPCategory {
  id: string;
  title: string;
  description: string;
  relatedCategories: VulnCategory[];
}

export const OWASP_MCP_TOP_10: OWASPCategory[] = [
  {
    id: "MCP01",
    title: "Token Mismanagement & Secret Exposure",
    description: "Hard-coded credentials, long-lived tokens, secrets in model memory or logs.",
    relatedCategories: ["credential-theft"],
  },
  {
    id: "MCP02",
    title: "Scope Mismanagement & Privilege Escalation",
    description: "Loosely defined permissions that expand over time or grant excessive access.",
    relatedCategories: ["excessive-permissions"],
  },
  {
    id: "MCP03",
    title: "Tool Poisoning (Description-time)",
    description: "Malicious instructions embedded in tool descriptions at session initialization.",
    relatedCategories: ["tool-poisoning"],
  },
  {
    id: "MCP04",
    title: "Tool Poisoning (Runtime)",
    description: "Malicious content injected via tool return values to manipulate LLM behavior.",
    relatedCategories: ["runtime-tool-poisoning"],
  },
  {
    id: "MCP05",
    title: "Excessive Data Exposure",
    description: "Tools returning more data than needed, exposing sensitive information.",
    relatedCategories: ["excessive-data-exposure", "data-exfiltration"],
  },
  {
    id: "MCP06",
    title: "Insecure Input Handling / Injection",
    description: "Classic injection attacks via tool parameters: command, SQL, path traversal.",
    relatedCategories: ["command-injection", "path-traversal", "ssrf"],
  },
  {
    id: "MCP07",
    title: "Insufficient Authentication & Authorization",
    description: "Missing or weak identity verification on MCP server endpoints.",
    relatedCategories: ["missing-auth"],
  },
  {
    id: "MCP08",
    title: "Insecure Communication",
    description: "Unencrypted transports, missing TLS, weak cipher configurations.",
    relatedCategories: ["insecure-communication"],
  },
  {
    id: "MCP09",
    title: "Shadow MCP Servers",
    description: "Unregistered, unreviewed server deployments and supply chain risks.",
    relatedCategories: ["shadow-mcp-server", "rug-pull", "supply-chain"],
  },
  {
    id: "MCP10",
    title: "Logging & Monitoring Deficiencies",
    description: "Insufficient audit trails for tool invocations and security events.",
    relatedCategories: ["logging-deficiency"],
  },
];

export const CATEGORY_TO_OWASP: Record<VulnCategory, string> = {
  "credential-theft": "MCP01",
  "excessive-permissions": "MCP02",
  "tool-poisoning": "MCP03",
  "runtime-tool-poisoning": "MCP04",
  "excessive-data-exposure": "MCP05",
  "data-exfiltration": "MCP05",
  "command-injection": "MCP06",
  "path-traversal": "MCP06",
  "ssrf": "MCP06",
  "missing-auth": "MCP07",
  "insecure-communication": "MCP08",
  "shadow-mcp-server": "MCP09",
  "rug-pull": "MCP09",
  "supply-chain": "MCP09",
  "logging-deficiency": "MCP10",
};

export const RULE_CWE_MAP: Record<string, string[]> = {
  // Tool Poisoning
  TP001: ["CWE-94", "CWE-1321"], TP002: ["CWE-94", "CWE-1321"], TP003: ["CWE-94"],
  TP004: ["CWE-94", "CWE-74"], TP005: ["CWE-94"], TP006: ["CWE-94"],
  TP007: ["CWE-94"], TP008: ["CWE-94", "CWE-79"], TP009: ["CWE-94"],
  TP010: ["CWE-94"], TP011: ["CWE-94"], TP012: ["CWE-94"],
  // Command Injection
  CI001: ["CWE-78"], CI002: ["CWE-94", "CWE-95"], CI003: ["CWE-78"],
  CI004: ["CWE-78"], CI005: ["CWE-78"], CI006: ["CWE-94", "CWE-95"],
  CI007: ["CWE-94"], CI008: ["CWE-78"], CI009: ["CWE-78"],
  CI010: ["CWE-78"], CI011: ["CWE-78"], CI012: ["CWE-78"],
  CI013: ["CWE-94"], CI014: ["CWE-78"],
  // Path Traversal
  PT001: ["CWE-22"], PT002: ["CWE-22", "CWE-23"], PT003: ["CWE-22", "CWE-538"],
  PT004: ["CWE-22"], PT005: ["CWE-22", "CWE-538"], PT006: ["CWE-22"],
  PT007: ["CWE-22"], PT008: ["CWE-22", "CWE-158"], PT009: ["CWE-22"],
  PT010: ["CWE-22"],
  // SSRF
  SSRF001: ["CWE-918"], SSRF002: ["CWE-918"], SSRF003: ["CWE-918"],
  SSRF004: ["CWE-918"], SSRF005: ["CWE-918"], SSRF006: ["CWE-918", "CWE-350"],
  SSRF007: ["CWE-918"], SSRF008: ["CWE-918", "CWE-601"],
  // Credential Theft
  CT001: ["CWE-798", "CWE-522"], CT002: ["CWE-522", "CWE-538"], CT003: ["CWE-522"],
  CT004: ["CWE-522", "CWE-200"], CT005: ["CWE-522", "CWE-200"], CT006: ["CWE-798"],
  CT007: ["CWE-522"], CT008: ["CWE-522", "CWE-538"], CT009: ["CWE-522"],
  CT010: ["CWE-522"], CT011: ["CWE-522", "CWE-538"], CT012: ["CWE-522", "CWE-538"],
  // Excessive Permissions
  EP001: ["CWE-250", "CWE-269"], EP002: ["CWE-732"], EP003: ["CWE-250"],
  EP004: ["CWE-250", "CWE-78"], EP005: ["CWE-250"], EP006: ["CWE-250", "CWE-269"],
  EP007: ["CWE-250"], EP008: ["CWE-250"], EP009: ["CWE-250", "CWE-269"],
  // Missing Auth
  MA001: ["CWE-306"], MA002: ["CWE-346", "CWE-942"], MA003: ["CWE-306", "CWE-862"],
  MA004: ["CWE-20"], MA005: ["CWE-770"], MA006: ["CWE-352"], MA007: ["CWE-306"],
  MA008: ["CWE-862"],
  // Supply Chain
  SC001: ["CWE-829", "CWE-506"], SC002: ["CWE-829", "CWE-494"], SC003: ["CWE-829", "CWE-94"],
  SC004: ["CWE-829"], SC005: ["CWE-829"], SC006: ["CWE-829", "CWE-494"],
  SC007: ["CWE-829"], SC008: ["CWE-829", "CWE-494"],
  // Rug Pull
  RP001: ["CWE-94", "CWE-1321"], RP002: ["CWE-829", "CWE-494"], RP003: ["CWE-506"],
  RP004: ["CWE-94"], RP005: ["CWE-829"], RP006: ["CWE-829"], RP007: ["CWE-829"],
  RP008: ["CWE-829", "CWE-494"],
  // Data Exfiltration
  DE001: ["CWE-200", "CWE-359"], DE002: ["CWE-200", "CWE-532"], DE003: ["CWE-200"],
  DE004: ["CWE-532", "CWE-200"], DE005: ["CWE-200"], DE006: ["CWE-200"],
  DE007: ["CWE-200"],
  // Insecure Communication
  IC001: ["CWE-319"], IC002: ["CWE-295"], IC003: ["CWE-319"],
  IC004: ["CWE-319"], IC005: ["CWE-326", "CWE-327"],
  // Excessive Data Exposure
  EDE001: ["CWE-200"], EDE002: ["CWE-209", "CWE-497"], EDE003: ["CWE-209"],
  EDE004: ["CWE-200"], EDE005: ["CWE-489"],
  // Logging Deficiency
  LD001: ["CWE-778"], LD002: ["CWE-532"], LD003: ["CWE-390", "CWE-754"],
  LD004: ["CWE-770"], LD005: ["CWE-778", "CWE-223"],
  // Runtime Tool Poisoning
  RTP001: ["CWE-94"], RTP002: ["CWE-94", "CWE-1321"], RTP003: ["CWE-94"],
  RTP004: ["CWE-79", "CWE-94"], RTP005: ["CWE-94"],
  // Shadow MCP Server
  SMS001: ["CWE-829"], SMS002: ["CWE-441"], SMS003: ["CWE-829"],
  SMS004: ["CWE-912"], SMS005: ["CWE-829"],
};

export const RULE_MITRE_MAP: Record<string, string[]> = {
  // Tool Poisoning → Prompt Injection / Data Poisoning
  TP001: ["AML.T0051"], TP002: ["AML.T0051"], TP003: ["AML.T0051"],
  TP004: ["AML.T0051", "AML.T0043"], TP005: ["AML.T0051"], TP006: ["AML.T0051"],
  // Command Injection → Arbitrary Code Execution
  CI001: ["AML.T0040"], CI002: ["AML.T0040"], CI004: ["AML.T0040"], CI005: ["AML.T0040"],
  // Credential Theft → Data Collection / Exfiltration
  CT001: ["AML.T0037"], CT002: ["AML.T0037"], CT004: ["AML.T0024"],
  CT005: ["AML.T0037"], CT006: ["AML.T0037"],
  // Data Exfiltration
  DE001: ["AML.T0024"], DE003: ["AML.T0024"],
  // Supply Chain
  SC002: ["AML.T0010"], SC003: ["AML.T0010"],
  // Rug Pull
  RP002: ["AML.T0010", "AML.T0051"], RP003: ["AML.T0010"],
  // Runtime Tool Poisoning
  RTP001: ["AML.T0051"], RTP002: ["AML.T0051"], RTP003: ["AML.T0051"],
};

export interface OwaspMapping {
  owaspMcpTop10: string;
  cweIds: string[];
  mitreAtlasIds: string[];
}

export function getOwaspMapping(ruleId: string, category: VulnCategory): OwaspMapping {
  return {
    owaspMcpTop10: CATEGORY_TO_OWASP[category] ?? "MCP06",
    cweIds: RULE_CWE_MAP[ruleId] ?? [],
    mitreAtlasIds: RULE_MITRE_MAP[ruleId] ?? [],
  };
}

export function computeOwaspCompliance(
  matches: { category: VulnCategory; severity: Severity; confidence: string }[]
): { compliance: import("@/types/scan").OWASPComplianceSummary[]; percentage: number } {
  const compliance = OWASP_MCP_TOP_10.map((owasp) => {
    const related = matches.filter(
      (m) =>
        owasp.relatedCategories.includes(m.category) &&
        m.confidence !== "low"
    );
    const maxSev = related.reduce<Severity | null>((max, m) => {
      const order: Severity[] = ["critical", "high", "medium", "low", "info"];
      if (!max) return m.severity;
      return order.indexOf(m.severity) < order.indexOf(max) ? m.severity : max;
    }, null);

    return {
      id: owasp.id,
      title: owasp.title,
      findingsCount: related.length,
      maxSeverity: maxSev,
      compliant: related.length === 0,
    };
  });

  const compliantCount = compliance.filter((c) => c.compliant).length;
  const percentage = Math.round((compliantCount / 10) * 100);

  return { compliance, percentage };
}

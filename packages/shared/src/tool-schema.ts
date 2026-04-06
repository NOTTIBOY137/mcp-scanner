const DANGEROUS_PARAM_NAMES_REGEX = [
  /^command$/i, /^cmd$/i, /^shell$/i, /^exec(ute)?$/i,
  /^eval$/i, /^run$/i, /^script$/i, /^code$/i,
];

const DANGEROUS_DESCRIPTION_REGEX = [
  /execut(?:e|es|ing)\s+(?:command|shell|code|script)/i,
  /run\s+(?:command|shell|arbitrary|any)/i,
  /shell\s+(?:access|command|execution)/i,
  /arbitrary\s+(?:code|command|file|path)/i,
];

export interface ToolSchemaIssue {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  owaspMcpTop10?: string;
  cweIds?: string[];
}

export function analyzeToolSchema(tool: {
  name: string;
  description?: string;
  inputSchema?: { properties?: Record<string, { type?: string; enum?: string[]; pattern?: string; description?: string }> };
}): ToolSchemaIssue[] {
  const issues: ToolSchemaIssue[] = [];

  for (const pattern of DANGEROUS_DESCRIPTION_REGEX) {
    if (tool.description && pattern.test(tool.description)) {
      issues.push({
        severity: "high",
        message: `Tool "${tool.name}" description suggests dangerous operation: ${pattern}`,
        owaspMcpTop10: "MCP03", cweIds: ["CWE-78"],
      });
    }
  }

  if (tool.inputSchema?.properties) {
    for (const [paramName, paramDef] of Object.entries(tool.inputSchema.properties)) {
      for (const pattern of DANGEROUS_PARAM_NAMES_REGEX) {
        if (pattern.test(paramName)) {
          issues.push({
            severity: "high",
            message: `Tool "${tool.name}" has dangerous parameter "${paramName}"`,
            owaspMcpTop10: "MCP06", cweIds: ["CWE-78"],
          });
        }
      }

      if (paramDef.type === "string" && !paramDef.enum && !paramDef.pattern) {
        const desc = (paramDef.description || "").toLowerCase();
        if (desc.includes("path") || desc.includes("file") || desc.includes("directory")) {
          issues.push({
            severity: "medium",
            message: `Tool "${tool.name}" param "${paramName}" accepts unrestricted file paths`,
            owaspMcpTop10: "MCP06", cweIds: ["CWE-22"],
          });
        }
        if (desc.includes("url") || desc.includes("endpoint")) {
          issues.push({
            severity: "medium",
            message: `Tool "${tool.name}" param "${paramName}" may enable SSRF`,
            owaspMcpTop10: "MCP06", cweIds: ["CWE-918"],
          });
        }
      }
    }
  }

  return issues;
}

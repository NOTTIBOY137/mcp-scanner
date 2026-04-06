import type { ScanRule } from "@/types/scan";

export const runtimeToolPoisoningRules: ScanRule[] = [
  {
    id: "RTP001",
    category: "runtime-tool-poisoning",
    title: "Tool response containing prompt injection patterns",
    description:
      "Detected return values or responses containing prompt injection phrases such as 'ignore previous', 'you are now', or 'disregard all'. These patterns attempt to hijack the LLM's behavior by injecting instructions through tool outputs.",
    severity: "critical",
    owaspMcpTop10: "MCP04",
    cweIds: ["CWE-94"],
    pattern:
      /(?:return|resolve|response|result|output)\s*[=(].*(?:ignore\s+previous|you\s+are\s+now|disregard\s+all|forget\s+your)/gi,
    remediation:
      "Sanitize all tool outputs before returning them. Strip or escape any text that could be interpreted as LLM instructions.",
    remediationCode: `// Before (injectable)
return { content: userProvidedText };

// After (sanitized)
import { sanitizeToolOutput } from "./sanitizer";
return { content: sanitizeToolOutput(userProvidedText) };`,
  },
  {
    id: "RTP002",
    category: "runtime-tool-poisoning",
    title: "Dynamic tool description modification at runtime",
    description:
      "Detected runtime reassignment of a tool's description property to a non-literal value. Dynamically modifying tool descriptions can allow an attacker to inject misleading instructions that alter LLM behavior.",
    severity: "critical",
    owaspMcpTop10: "MCP04",
    cweIds: ["CWE-1321"],
    pattern: /(?:\.description|\.desc)\s*=\s*(?!["'`][^"'`]*["'`]\s*[;,])/g,
    remediation:
      "Use only static, hardcoded string literals for tool descriptions. Never assign descriptions from variables, user input, or external data sources.",
    remediationCode: `// Before (dynamic — vulnerable)
tool.description = userInput;
tool.description = config.getDescription();

// After (static — safe)
tool.description = "Fetches weather data for a given city name";`,
  },
  {
    id: "RTP003",
    category: "runtime-tool-poisoning",
    title: "Response content including hidden instructions",
    description:
      "Detected HTML comments, hidden elements, or invisible Unicode characters (zero-width spaces, BOM) in response construction. These can be used to embed hidden instructions that influence the LLM while being invisible to users.",
    severity: "high",
    owaspMcpTop10: "MCP04",
    cweIds: ["CWE-94"],
    pattern:
      /(?:return|response|result)\s*[=(].*(?:<!--.*-->|<hidden|\\u200[bBcCdD]|\\uFEFF)/g,
    remediation:
      "Strip HTML comments, hidden elements, and invisible Unicode characters from all tool outputs before returning them.",
    remediationCode: `// Sanitize hidden content from tool output
function sanitizeOutput(text: string): string {
  return text
    .replace(/<!--[\\s\\S]*?-->/g, "")
    .replace(/<hidden[^>]*>[\\s\\S]*?<\\/hidden>/gi, "")
    .replace(/[\\u200B-\\u200D\\uFEFF]/g, "");
}`,
  },
  {
    id: "RTP004",
    category: "runtime-tool-poisoning",
    title: "Tool returning markdown that could inject into LLM context",
    description:
      "Detected markdown links with javascript: protocol or data: URI images in response values. These patterns can be used to inject executable content or exfiltrate data through the LLM rendering pipeline.",
    severity: "medium",
    owaspMcpTop10: "MCP04",
    cweIds: ["CWE-79"],
    pattern:
      /(?:return|response|result)\s*[=(].*(?:\[.*\]\(javascript:|!\[.*\]\(data:)/g,
    remediation:
      "Sanitize markdown content in tool outputs. Strip javascript: URIs from links and data: URIs from images.",
    remediationCode: `// Sanitize markdown in tool responses
function sanitizeMarkdown(md: string): string {
  return md
    .replace(/\\[([^\\]]*)\\]\\(javascript:[^)]*\\)/gi, "[$1](#blocked)")
    .replace(/!\\[([^\\]]*)\\]\\(data:[^)]*\\)/gi, "![$1](#blocked)");
}`,
  },
  {
    id: "RTP005",
    category: "runtime-tool-poisoning",
    title: "Response referencing or invoking other tools",
    description:
      "Detected tool responses that attempt to call or invoke other tools (use_tool, call_tool, invoke, execute_tool). A poisoned tool response could trick the LLM into executing additional tools without user consent.",
    severity: "high",
    owaspMcpTop10: "MCP04",
    cweIds: ["CWE-94"],
    pattern:
      /(?:return|response|result)\s*[=(].*(?:use_tool|call_tool|invoke|execute_tool|run_tool)\s*\(/g,
    remediation:
      "Tool responses should never contain tool invocation patterns. Validate and sanitize all output to ensure it does not include cross-tool call instructions.",
    remediationCode: `// Validate tool output does not contain invocation patterns
const TOOL_INVOKE_PATTERN = /(?:use_tool|call_tool|invoke|execute_tool|run_tool)\\s*\\(/i;

function validateToolOutput(output: string): string {
  if (TOOL_INVOKE_PATTERN.test(output)) {
    throw new Error("Tool output contains forbidden invocation patterns");
  }
  return output;
}`,
  },
];

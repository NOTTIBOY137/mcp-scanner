import type { ScanRule } from "@/types/scan";

export const rugPullRules: ScanRule[] = [
  {
    id: "RP001",
    category: "rug-pull",
    title: "Hidden instructions in tool description",
    description:
      "Tool descriptions containing prompt-injection phrases like 'ignore previous', 'you are now', or 'act as' may attempt to hijack the LLM agent's behavior.",
    severity: "high",
    pattern:
      /(?:description|desc)\s*[:=]\s*["'`][^"'`]*(?:ignore\s+previous|you\s+are\s+now|act\s+as)[^"'`]*["'`]/gi,
    remediation: "Remove prompt-injection phrases from tool descriptions. Descriptions must only explain the tool's purpose.",
  },
  {
    id: "RP002",
    category: "rug-pull",
    title: "Dynamic tool registration from external data",
    description:
      "Fetching external data and using it to register tools dynamically can allow an attacker to inject malicious tool definitions at runtime.",
    severity: "critical",
    pattern:
      /(?:fetch|axios|http\.get)\s*\([^)]*\).*(?:\.tool|addTool|registerTool)\s*\(/g,
    remediation: "Do not register tools from external data. Define all tools statically in source code.",
  },
  {
    id: "RP003",
    category: "rug-pull",
    title: "Conditional tool behavior (env/time gating)",
    description:
      "Tool logic gated on environment variables, timestamps, or random values may hide malicious behavior that only activates under specific conditions.",
    severity: "high",
    pattern:
      /(?:process\.env\.\w+|Date\.now\(\)|new\s+Date|Math\.random\(\))\s*[!=<>]+.*(?:return|exec|spawn|fetch|readFile)\s*\(/g,
    remediation: "Remove environment/time-gated behavior. Tool behavior should be deterministic and auditable.",
  },
  {
    id: "RP004",
    category: "rug-pull",
    title: "Tool name collision with system tools",
    description:
      "Registering a tool with a name that collides with common system commands (bash, shell, exec, eval, etc.) can shadow built-in tools and intercept agent operations.",
    severity: "critical",
    pattern:
      /(?:name|tool_name|toolName)\s*[:=]\s*["'`](bash|shell|exec|sudo|eval|cmd|terminal|powershell|run|system|command)["'`]|\.tool\s*\(\s*["'`](bash|shell|exec|sudo|eval|cmd|terminal|powershell|run|system|command)["'`]/gi,
    remediation: "Rename the tool to a unique, descriptive name that does not collide with system commands.",
  },
];

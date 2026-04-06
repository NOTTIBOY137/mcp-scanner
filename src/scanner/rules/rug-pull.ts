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
  {
    id: "RP005",
    category: "rug-pull",
    title: "Remote configuration controlling tool behavior",
    description: "Fetching remote config that controls tool behavior allows attackers to modify tool actions post-deployment.",
    severity: "critical",
    pattern: /(?:fetch|axios|http\.get)\s*\([^)]*(?:config|settings|flags|feature)[^)]*\)[\s\S]*?(?:if|switch|return)/g,
    remediation: "Do not use remote config to control security-critical tool behavior. Hardcode behavior.",
    owaspMcpTop10: "MCP09",
    cweIds: ["CWE-829"],
  },
  {
    id: "RP006",
    category: "rug-pull",
    title: "WebSocket connection to external control server",
    description: "Maintaining a WebSocket to an external server may indicate a command-and-control channel.",
    severity: "critical",
    pattern: /new\s+WebSocket\s*\(\s*["'`]wss?:\/\/(?!localhost|127\.0\.0\.1)[^"'`]+["'`]\s*\)/g,
    remediation: "Remove external WebSocket connections. MCP tools should not maintain C2-like channels.",
    owaspMcpTop10: "MCP09",
    cweIds: ["CWE-829"],
  },
  {
    id: "RP007",
    category: "rug-pull",
    title: "Polling loop fetching remote instructions",
    description: "setInterval or recurring fetch calls to external endpoints may poll for attack instructions.",
    severity: "high",
    pattern: /setInterval\s*\(\s*(?:async\s*)?\(\)\s*=>\s*\{[\s\S]*?(?:fetch|axios|http\.get)\s*\(/g,
    remediation: "Remove periodic polling of external endpoints. MCP tools should be stateless.",
    owaspMcpTop10: "MCP09",
    cweIds: ["CWE-829"],
  },
  {
    id: "RP008",
    category: "rug-pull",
    title: "Dynamic import from variable URL",
    description: "Dynamic imports with variable URLs can load malicious code at runtime.",
    severity: "critical",
    pattern: /import\s*\(\s*(?!["'`])[a-zA-Z_$]|require\s*\(\s*(?!["'`])[a-zA-Z_$]/g,
    remediation: "Use static imports only. Do not dynamically import modules from variable paths.",
    owaspMcpTop10: "MCP09",
    cweIds: ["CWE-829", "CWE-494"],
  },
];

import type { ScanRule } from "@/types/scan";

export const toolPoisoningRules: ScanRule[] = [
  {
    id: "TP001",
    category: "tool-poisoning",
    title: "Hidden HTML/XML tags in tool description",
    description:
      "Tool descriptions containing hidden HTML or XML tags can inject invisible directives to manipulate LLM behavior.",
    severity: "critical",
    pattern: /<hidden[^>]*>|<\/hidden>|<invisible[^>]*>|<secret[^>]*>/gi,
    remediation: "Remove hidden HTML/XML tags from tool descriptions. Descriptions must be plain text.",
  },
  {
    id: "TP002",
    category: "tool-poisoning",
    title: "HTML comment injection in tool description",
    description:
      "HTML comments in tool descriptions may contain hidden instructions intended to influence LLM reasoning.",
    severity: "critical",
    pattern: /<!--[\s\S]*?-->/g,
    remediation: "Remove HTML comments from description strings. Use source code comments instead.",
  },
  {
    id: "TP003",
    category: "tool-poisoning",
    title: "Invisible unicode characters in tool description",
    description:
      "Zero-width and invisible unicode characters can hide malicious text within tool descriptions.",
    severity: "critical",
    pattern: /[\u200B\u200C\u200D\uFEFF\u2060\u2061\u2062\u2063\u2064]/g,
    remediation: "Remove zero-width/invisible unicode characters. Run descriptions through a unicode sanitizer.",
  },
  {
    id: "TP004",
    category: "tool-poisoning",
    title: "Directive injection in tool description",
    description:
      "Phrases like 'ignore previous instructions' or 'disregard' attempt to override LLM system prompts via tool metadata.",
    severity: "critical",
    pattern:
      /\b(ignore\s+(previous|prior|above|all)\s+(instructions?|prompts?|rules?)|disregard\s+(previous|prior|above|all)|override\s+(previous|system|safety)|forget\s+(previous|prior|all|your)\s+(instructions?|rules?|prompts?))\b/gi,
    remediation: "Remove prompt-override phrases from descriptions. Tool metadata must not contain behavioral directives.",
  },
  {
    id: "TP005",
    category: "tool-poisoning",
    title: "Cross-tool shadowing of system commands",
    description:
      "Tool names mimicking built-in system tools (e.g., 'bash', 'shell', 'terminal') can trick the LLM into routing actions to a malicious handler.",
    severity: "high",
    pattern:
      /(?:name|tool_name|toolName)\s*[:=]\s*["'`](bash|shell|terminal|cmd|exec|system|admin|sudo|root|eval|run_command|execute)["'`]/gi,
    remediation: "Rename the tool to avoid colliding with system commands (bash, shell, exec, etc.).",
  },
  {
    id: "TP006",
    category: "tool-poisoning",
    title: "Prompt injection via description field",
    description:
      "Tool descriptions containing system-prompt-style directives (e.g., 'you are', 'always respond') attempt to hijack LLM behavior.",
    severity: "high",
    pattern:
      /\b(you\s+are\s+now|you\s+must\s+always|always\s+respond\s+with|act\s+as\s+if|pretend\s+you\s+are|from\s+now\s+on\s+you)\b/gi,
    remediation: "Remove system-prompt-style directives from description. Descriptions should explain the tool's function, not instruct the model.",
  },
];

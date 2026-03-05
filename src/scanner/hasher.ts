import { createHash } from "node:crypto";

export function hashToolDefinition(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

interface ToolDefinition {
  name: string;
  hash: string;
}

const TOOL_DEF_PATTERNS = [
  /server\.tool\s*\(\s*["'`]([^"'`]+)["'`]/g,
  /(?:name|tool_name|toolName)\s*[:=]\s*["'`]([^"'`]+)["'`]/g,
  /\.addTool\s*\(\s*\{\s*name\s*:\s*["'`]([^"'`]+)["'`]/g,
];

export function detectToolDefinitions(content: string): ToolDefinition[] {
  const definitions: ToolDefinition[] = [];
  const seen = new Set<string>();
  const lines = content.split("\n");

  for (const pattern of TOOL_DEF_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      const name = match[1];
      if (seen.has(name)) {
        continue;
      }
      seen.add(name);

      const matchLine = content.substring(0, match.index).split("\n").length - 1;
      const contextStart = Math.max(0, matchLine - 1);
      const contextEnd = Math.min(lines.length, matchLine + 10);
      const contextBlock = lines.slice(contextStart, contextEnd).join("\n");

      definitions.push({
        name,
        hash: hashToolDefinition(contextBlock),
      });
    }
  }

  return definitions;
}

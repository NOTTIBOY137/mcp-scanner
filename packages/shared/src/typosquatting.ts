export const KNOWN_MCP_PACKAGES = [
  "@modelcontextprotocol/server-filesystem",
  "@modelcontextprotocol/server-github",
  "@modelcontextprotocol/server-git",
  "@modelcontextprotocol/server-postgres",
  "@modelcontextprotocol/server-slack",
  "@modelcontextprotocol/server-memory",
  "@modelcontextprotocol/server-puppeteer",
  "@modelcontextprotocol/server-brave-search",
  "@modelcontextprotocol/server-fetch",
  "@modelcontextprotocol/server-sequential-thinking",
  "@modelcontextprotocol/sdk",
  "@modelcontextprotocol/inspector",
  "@anthropic-ai/sdk",
  "@anthropic-ai/bedrock-sdk",
];

export function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0
    )
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] =
        a[i - 1] === b[j - 1]
          ? matrix[i - 1][j - 1]
          : 1 + Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
    }
  }
  return matrix[a.length][b.length];
}

export interface TyposquatResult {
  target: string;
  distance: number;
  type?: "scope-confusion";
}

export function detectTyposquatting(
  packageName: string,
  threshold = 2
): TyposquatResult[] {
  const suspicious: TyposquatResult[] = [];
  const inputParts = packageName.match(/^(?:@([^/]+)\/)?(.+)$/);
  if (!inputParts) return [];
  const [, inputScope, inputName] = inputParts;

  for (const known of KNOWN_MCP_PACKAGES) {
    const knownParts = known.match(/^(?:@([^/]+)\/)?(.+)$/);
    if (!knownParts) continue;
    const [, knownScope, knownName] = knownParts;

    const nameDist = levenshteinDistance(
      inputName.replace(/[-_]/g, ""),
      knownName.replace(/[-_]/g, "")
    );

    if (nameDist > 0 && nameDist <= threshold) {
      suspicious.push({ target: known, distance: nameDist });
    }

    if (inputName === knownName && inputScope !== knownScope) {
      suspicious.push({ target: known, distance: 0, type: "scope-confusion" });
    }
  }

  return suspicious.sort((a, b) => a.distance - b.distance);
}

import type { ScanRule } from "@/types/scan";

export const supplyChainRules: ScanRule[] = [
  {
    id: "SC001",
    category: "supply-chain",
    title: "Install scripts in package.json",
    description:
      "preinstall and postinstall scripts in package.json execute automatically during npm install and can run malicious code.",
    severity: "high",
    pattern:
      /["'](?:preinstall|postinstall|preuninstall|postuninstall|prepublish)["']\s*:/g,
    fileFilter: (path: string) => /package\.json$/.test(path),
    remediation: "Remove preinstall/postinstall scripts or audit their content. Use prepare scripts for build steps only.",
  },
  {
    id: "SC002",
    category: "supply-chain",
    title: "Dynamic require of remote URL",
    description:
      "Fetching and executing remote code at runtime bypasses package verification and enables supply chain attacks.",
    severity: "critical",
    pattern:
      /require\s*\(\s*(?:`[^`]*https?:\/\/|["'][^"']*https?:\/\/)|import\s*\(\s*(?:`[^`]*https?:\/\/|["'][^"']*https?:\/\/)/g,
    remediation: "Replace dynamic require of remote URLs with static imports of vetted packages.",
  },
  {
    id: "SC003",
    category: "supply-chain",
    title: "Fetching and evaluating remote code",
    description:
      "Downloading code from a URL and passing it to eval or Function constructor enables remote code execution.",
    severity: "critical",
    pattern:
      /(?:fetch|axios\.get|http\.get|https\.get)\s*\([^)]+\)[\s\S]*?(?:eval|new\s+Function|vm\.runInContext|vm\.runInNewContext)\s*\(/g,
    remediation: "Remove fetch-and-eval patterns. Bundle dependencies at build time instead of fetching at runtime.",
  },
  {
    id: "SC004",
    category: "supply-chain",
    title: "Typosquatting-susceptible dependency name",
    description:
      "Package names that are common misspellings of popular packages may be typosquatting attacks.",
    severity: "medium",
    pattern:
      /["'](?:loadsh|lodashs|lod[_-]ash|axois|axio[sz]|reqeust|requets|expresss|babyl|web[_-]?pack)\s*["']\s*:/g,
    fileFilter: (path: string) => /package\.json$/.test(path),
    remediation: "Verify package names against the official registry. Use lockfiles and integrity hashes.",
  },
];

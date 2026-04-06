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
  {
    id: "SC005",
    category: "supply-chain",
    title: "Unpinned Docker base images",
    description: "Using :latest or unpinned Docker base images allows supply chain attacks via image replacement.",
    severity: "high",
    pattern: /FROM\s+\S+:latest|FROM\s+\S+(?!:.*@sha256)/g,
    fileFilter: (path: string) => /Dockerfile/.test(path),
    remediation: "Pin Docker images to specific digests: FROM node:20@sha256:abc123...",
    owaspMcpTop10: "MCP09",
    cweIds: ["CWE-829"],
  },
  {
    id: "SC006",
    category: "supply-chain",
    title: "GitHub Actions with unpinned actions",
    description: "Using GitHub Actions with branch references instead of SHA pins enables supply chain attacks.",
    severity: "high",
    pattern: /uses:\s*\S+@(?:main|master|latest|v\d+)(?:\s|$)/g,
    fileFilter: (path: string) => /\.ya?ml$/.test(path),
    remediation: "Pin GitHub Actions to full commit SHAs: uses: actions/checkout@abc123...",
    owaspMcpTop10: "MCP09",
    cweIds: ["CWE-829", "CWE-494"],
  },
  {
    id: "SC007",
    category: "supply-chain",
    title: "npm registry override in .npmrc",
    description: "Overriding the npm registry to a non-standard URL may enable package substitution attacks.",
    severity: "high",
    pattern: /registry\s*=\s*(?!https:\/\/registry\.npmjs\.org)/g,
    fileFilter: (path: string) => /\.npmrc$/.test(path),
    remediation: "Use the official npm registry. If using a private registry, ensure it's verified.",
    owaspMcpTop10: "MCP09",
    cweIds: ["CWE-829"],
  },
  {
    id: "SC008",
    category: "supply-chain",
    title: "pip install from arbitrary URL",
    description: "Installing Python packages from URLs instead of PyPI enables supply chain attacks.",
    severity: "high",
    pattern: /pip\s+install\s+(?:--index-url|--extra-index-url|-i)\s+(?!https:\/\/pypi\.org)/g,
    fileFilter: (path: string) => /(?:requirements|Makefile|\.sh|\.ya?ml)/.test(path),
    remediation: "Use official PyPI. Verify custom package indexes are trusted.",
    owaspMcpTop10: "MCP09",
    cweIds: ["CWE-829", "CWE-494"],
  },
];

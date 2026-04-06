import type { ScanRule } from "@/types/scan";

const SANITIZATION_PATTERNS = [
  /path\.normalize\s*\(/,
  /path\.resolve\s*\(/,
  /realpath/,
  /startsWith\s*\(/,
  /includes\s*\(\s*['"`]\.\.['"`]\s*\)/,
  /\.replace\s*\(\s*\/.*\.\.\//,
];

function hasSanitization(fileContent: string): boolean {
  return SANITIZATION_PATTERNS.some((p) => p.test(fileContent));
}

export const pathTraversalRules: ScanRule[] = [
  {
    id: "PT001",
    category: "path-traversal",
    title: "Directory traversal sequence targeting sensitive files",
    description:
      "Paths containing '../' sequences targeting sensitive system files (etc/passwd, .ssh, .env) can escape intended directories.",
    severity: "critical",
    pattern: /(?:\.\.\/){2,}[\w./]*(?:etc\/passwd|etc\/shadow|\.ssh|\.env)/g,
    remediation: "Validate and sanitize file paths. Use path.resolve() with a base directory and verify the result stays within the allowed root.",
  },
  {
    id: "PT002",
    category: "path-traversal",
    title: "path.join/resolve with user-controlled input",
    description:
      "Using path.join or path.resolve with variables from user input without validation can lead to directory traversal.",
    severity: "high",
    pattern:
      /path\.(?:join|resolve)\s*\([^)]*(?:req\.|params\.|query\.|body\.|input\.|args\.|user)/g,
    severityAdjuster: (
      match: RegExpMatchArray,
      fileContent: string
    ): "high" | "low" => {
      if (hasSanitization(fileContent)) {
        return "low";
      }
      return "high";
    },
    remediation: "Sanitize user input before passing to path.join/resolve. Use path.normalize() and check for '..' sequences.",
  },
  {
    id: "PT003",
    category: "path-traversal",
    title: "Access to sensitive system files",
    description:
      "Direct access to sensitive files like /etc/passwd, /etc/shadow, or SSH keys indicates potential data exfiltration.",
    severity: "critical",
    pattern:
      /["'`](?:\/etc\/passwd|\/etc\/shadow|~?\/?\.ssh\/|\/root\/|\/home\/\w+\/\.ssh)/g,
    remediation: "Remove direct references to sensitive system files. Use a restricted file access layer.",
  },
  {
    id: "PT004",
    category: "path-traversal",
    title: "fs operations without path sanitization",
    description:
      "File system operations using variables without prior path validation or sanitization may allow traversal attacks.",
    severity: "medium",
    pattern:
      /fs\.(?:readFileSync|readFile|writeFileSync|writeFile|unlinkSync|unlink|mkdirSync|mkdir|readdirSync|readdir)\s*\(\s*(?!["'`\/])[a-zA-Z_$]/g,
    validator: (match: RegExpMatchArray, fileContent: string): boolean => {
      if (hasSanitization(fileContent)) {
        return false;
      }
      return true;
    },
    remediation: "Add path sanitization before all fs operations. Validate paths against an allowlist of permitted directories.",
  },
  {
    id: "PT005",
    category: "path-traversal",
    title: "Reading .env files",
    description:
      "Programmatically reading .env files may expose secrets if the path is user-controlled or the contents are leaked.",
    severity: "high",
    pattern:
      /(?:readFileSync|readFile|createReadStream)\s*\([^)]*\.env(?:\.local|\.production|\.development)?["'`]/g,
    validator: (match: RegExpMatchArray, fileContent: string): boolean => {
      const isDotenvSetup =
        /require\s*\(\s*['"]dotenv['"]/.test(fileContent) ||
        /import\s+dotenv/.test(fileContent) ||
        /from\s+['"]dotenv['"]/.test(fileContent);
      if (isDotenvSetup) {
        return false;
      }
      return true;
    },
    remediation: "Use dotenv or a dedicated config library to load .env files. Do not read .env via raw fs operations.",
  },
  {
    id: "PT006",
    category: "path-traversal",
    title: "Python open() with user-controlled path",
    description: "Using Python's open() with variable paths without validation enables path traversal.",
    severity: "high",
    pattern: /\bopen\s*\(\s*(?:f["']|request\.|args\.|params\.|input\.|user)/g,
    fileFilter: (path: string) => /\.(py|pyw)$/.test(path),
    remediation: "Validate and sanitize file paths using os.path.realpath() and check against allowed directories.",
    owaspMcpTop10: "MCP06",
    cweIds: ["CWE-22"],
  },
  {
    id: "PT007",
    category: "path-traversal",
    title: "Go os.Open with variable path",
    description: "Using os.Open or ioutil.ReadFile with unsanitized variable paths in Go.",
    severity: "high",
    pattern: /(?:os\.Open|os\.ReadFile|ioutil\.ReadFile)\s*\(\s*(?!["'`])[a-zA-Z]/g,
    fileFilter: (path: string) => /\.go$/.test(path),
    remediation: "Use filepath.Clean() and validate paths are within allowed base directories.",
    owaspMcpTop10: "MCP06",
    cweIds: ["CWE-22"],
  },
  {
    id: "PT008",
    category: "path-traversal",
    title: "Null byte injection in file paths",
    description: "Null bytes in file paths can truncate path validation and access unintended files.",
    severity: "critical",
    pattern: /%00|\\0|\\x00|\u0000/g,
    remediation: "Strip null bytes from all file path inputs before processing.",
    owaspMcpTop10: "MCP06",
    cweIds: ["CWE-22", "CWE-158"],
  },
  {
    id: "PT009",
    category: "path-traversal",
    title: "URL-encoded path traversal sequences",
    description: "URL-encoded dot-dot-slash sequences (%2e%2e%2f) bypass naive path validation.",
    severity: "high",
    pattern: /%2e%2e(?:%2f|%5c)|%252e%252e%252f|\.\.%2f|%2e\.\//gi,
    remediation: "URL-decode paths before validation. Apply path traversal checks after full decoding.",
    owaspMcpTop10: "MCP06",
    cweIds: ["CWE-22"],
  },
  {
    id: "PT010",
    category: "path-traversal",
    title: "Windows-style path traversal patterns",
    description: "Backslash-based directory traversal patterns targeting Windows file systems.",
    severity: "high",
    pattern: /\.\.\\|\.\.%5[cC]|\\\\[a-zA-Z]\$\\/g,
    remediation: "Normalize path separators and apply traversal checks for both forward and backslashes.",
    owaspMcpTop10: "MCP06",
    cweIds: ["CWE-22"],
  },
];

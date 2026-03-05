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
];

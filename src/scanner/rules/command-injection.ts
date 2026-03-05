import type { ScanRule } from "@/types/scan";

export const commandInjectionRules: ScanRule[] = [
  {
    id: "CI001",
    category: "command-injection",
    title: "exec/execSync with string interpolation",
    description:
      "Using exec or execSync with template literals or string concatenation allows attackers to inject arbitrary shell commands.",
    severity: "critical",
    pattern: /\bexec(?:Sync)?\s*\(\s*(`[^`]*\$\{|[^)]*\+)/g,
    remediation: "Replace exec/execSync with execFile or spawn with explicit argument arrays instead of string interpolation.",
  },
  {
    id: "CI002",
    category: "command-injection",
    title: "eval() usage detected",
    description:
      "eval() executes arbitrary code and should never be used with untrusted input. It enables full code injection.",
    severity: "critical",
    pattern: /\beval\s*\(\s*[^)]/g,
    remediation: "Remove eval() usage. Use JSON.parse for data or a sandboxed interpreter for dynamic code.",
  },
  {
    id: "CI003",
    category: "command-injection",
    title: "spawn/spawnSync with shell option",
    description:
      "Using spawn with shell:true passes the command through a shell interpreter, enabling command injection via metacharacters.",
    severity: "high",
    pattern: /\bspawn(?:Sync)?\s*\([^)]*shell\s*:\s*true/g,
    remediation: "Set shell: false in spawn options and pass arguments as an array.",
  },
  {
    id: "CI004",
    category: "command-injection",
    title: "Python os.system() call",
    description:
      "os.system() passes commands to the shell and is vulnerable to injection when using unsanitized input.",
    severity: "critical",
    pattern: /\bos\.system\s*\(/g,
    fileFilter: (path: string) => /\.(py|pyw)$/.test(path),
    remediation: "Replace os.system() with subprocess.run() using a list of arguments.",
  },
  {
    id: "CI005",
    category: "command-injection",
    title: "Python subprocess with shell=True",
    description:
      "subprocess calls with shell=True execute commands through the shell, enabling injection attacks.",
    severity: "critical",
    pattern: /\bsubprocess\.\w+\s*\([^)]*shell\s*=\s*True/g,
    fileFilter: (path: string) => /\.(py|pyw)$/.test(path),
    remediation: "Set shell=False in subprocess calls and pass command as a list.",
  },
  {
    id: "CI006",
    category: "command-injection",
    title: "Python exec() call",
    description:
      "Python's exec() function executes arbitrary code strings and is a vector for code injection.",
    severity: "critical",
    pattern: /\bexec\s*\(\s*[^)]/g,
    fileFilter: (path: string) => /\.(py|pyw)$/.test(path),
    remediation: "Remove exec() calls. Use ast.literal_eval for safe expression evaluation.",
  },
  {
    id: "CI007",
    category: "command-injection",
    title: "new Function() constructor",
    description:
      "The Function constructor creates functions from strings, equivalent to eval() and equally dangerous with untrusted input.",
    severity: "critical",
    pattern: /new\s+Function\s*\(/g,
    remediation: "Replace new Function() with a safe alternative. Avoid constructing functions from strings.",
  },
  {
    id: "CI008",
    category: "command-injection",
    title: "child_process import with unsanitized usage",
    description:
      "Direct usage of child_process module methods with variable arguments may allow command injection.",
    severity: "high",
    pattern:
      /require\s*\(\s*["']child_process["']\s*\)|from\s+["']child_process["']/g,
    validator: (match: RegExpMatchArray, fileContent: string) => {
      return /\b(exec|execSync|spawn|spawnSync)\s*\(/.test(fileContent);
    },
    remediation: "Use execFile with explicit argument arrays instead of child_process with string commands.",
  },
];

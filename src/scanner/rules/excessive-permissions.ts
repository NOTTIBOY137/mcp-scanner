import type { ScanRule } from "@/types/scan";

export const excessivePermissionsRules: ScanRule[] = [
  {
    id: "EP001",
    category: "excessive-permissions",
    title: "sudo command usage",
    description:
      "Using sudo in scripts escalates privileges and may allow unintended system-wide modifications.",
    severity: "high",
    pattern: /\bsudo\s+/g,
    remediation: "Remove sudo usage. Run processes with the minimum required privileges.",
  },
  {
    id: "EP002",
    category: "excessive-permissions",
    title: "chmod 777 or overly permissive file permissions",
    description:
      "Setting file permissions to 777 grants read, write, and execute access to all users, creating a security risk.",
    severity: "high",
    pattern: /\bchmod\s+(?:777|666|\+x\s+\/|\-R\s+777)/g,
    remediation: "Use restrictive file permissions (e.g., 0o600 or 0o644) instead of 0o777.",
  },
  {
    id: "EP003",
    category: "excessive-permissions",
    title: "Unrestricted filesystem access pattern",
    description:
      "Reading files using wildcard or root-level paths without restriction can expose the entire filesystem.",
    severity: "medium",
    pattern:
      /fs\.(?:readFileSync|readFile|readdirSync|readdir)\s*\(\s*["'`]\/(?:\*|\.\.)/g,
    remediation: "Restrict filesystem access to specific directories. Use a sandboxed file access layer.",
  },
  {
    id: "EP004",
    category: "excessive-permissions",
    title: "Unrestricted process spawning",
    description:
      "Spawning processes without restricting which commands can be executed enables arbitrary command execution.",
    severity: "high",
    pattern:
      /(?:exec|execSync|spawn|spawnSync)\s*\(\s*(?:req\.|params\.|query\.|body\.|input\.|args\.)/g,
    remediation: "Restrict process spawning to specific allowed commands. Use an allowlist.",
  },
  {
    id: "EP005",
    category: "excessive-permissions",
    title: "Running as root",
    description:
      "Checking for or requiring root/UID 0 execution suggests the application expects elevated privileges unnecessarily.",
    severity: "medium",
    pattern:
      /(?:process\.getuid\s*\(\s*\)\s*===?\s*0|USER\s*===?\s*["'`]root["'`]|whoami.*root)/g,
    remediation: "Run the process as a non-root user. Use least-privilege principles.",
  },
];

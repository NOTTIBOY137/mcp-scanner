import type { FileContent, ScanRule, RuleMatch, Confidence } from "@/types/scan";

const SKIP_FILE_PATTERNS = [
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /\.d\.ts$/,
  /\/test\//,
  /\/tests\//,
  /\/__tests__\//,
  /\/fixtures?\//,
  /\/mocks?\//,
];

function shouldSkipFile(filePath: string): boolean {
  return SKIP_FILE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function isCommentLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*");
}

function isInsideBlockComment(lines: string[], lineIndex: number): boolean {
  let inBlock = false;
  for (let i = 0; i <= lineIndex; i++) {
    const line = lines[i];
    if (line.includes("/*")) {
      inBlock = true;
    }
    if (line.includes("*/")) {
      inBlock = false;
    }
  }
  return inBlock;
}

function isTestAssertionOrExample(line: string): boolean {
  const trimmed = line.trim();
  return (
    /\b(?:expect|assert|should|describe|it|test)\s*\(/.test(trimmed) ||
    /\/\/\s*(?:example|e\.g\.|usage)/i.test(trimmed) ||
    /\*\s*@example/.test(trimmed)
  );
}

function determineConfidence(
  rule: ScanRule,
  match: RegExpMatchArray,
  line: string
): Confidence {
  const matchLength = match[0].length;
  const lineLength = line.trim().length;

  if (rule.validator) {
    return "high";
  }

  const ratio = lineLength > 0 ? matchLength / lineLength : 0;
  if (ratio > 0.5) {
    return "high";
  }
  if (ratio > 0.2) {
    return "medium";
  }
  return "low";
}

export function scanFiles(
  files: FileContent[],
  rules: ScanRule[]
): RuleMatch[] {
  const matches: RuleMatch[] = [];

  for (const file of files) {
    if (shouldSkipFile(file.path)) {
      continue;
    }

    const lines = file.content.split("\n");

    for (const rule of rules) {
      if (rule.fileFilter && !rule.fileFilter(file.path)) {
        continue;
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(line)) !== null) {
          if (rule.validator && !rule.validator(match, file.content)) {
            continue;
          }

          let confidence = determineConfidence(rule, match, line);

          if (
            isCommentLine(line) ||
            isInsideBlockComment(lines, i) ||
            isTestAssertionOrExample(line)
          ) {
            confidence = "low";
          }

          const severity = rule.severityAdjuster
            ? rule.severityAdjuster(match, file.content)
            : rule.severity;

          matches.push({
            ruleId: rule.id,
            category: rule.category,
            severity,
            title: rule.title,
            description: rule.description,
            filePath: file.path,
            lineNumber: i + 1,
            snippet: line.trim(),
            confidence,
            remediation: rule.remediation,
          });

          if (!rule.pattern.flags.includes("g")) {
            break;
          }
        }
      }
    }
  }

  return matches;
}

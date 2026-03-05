import { describe, it, expect } from "vitest";
import { scanFiles } from "@/scanner/engine";
import { allRules, commandInjectionRules } from "@/scanner/rules";
import type { FileContent } from "@/types/scan";

describe("command-injection rules", () => {
  it("all 8 command-injection rules are present in allRules", () => {
    const ciInAll = allRules.filter((r) => r.category === "command-injection");
    expect(ciInAll).toHaveLength(8);
    expect(ciInAll.map((r) => r.id).sort()).toEqual(["CI001", "CI002", "CI003", "CI004", "CI005", "CI006", "CI007", "CI008"]);
  });

  it("CI001 fires on exec with template literal", () => {
    const files: FileContent[] = [{ path: "cmd.ts", content: "exec(`ls ${userInput}`);" }];
    const matches = scanFiles(files, commandInjectionRules);
    expect(matches.some((m) => m.ruleId === "CI001")).toBe(true);
  });

  it("CI001 does not fire on exec with static string", () => {
    const files: FileContent[] = [{ path: "cmd.ts", content: `execSync("ls -la");` }];
    const matches = scanFiles(files, commandInjectionRules);
    expect(matches.some((m) => m.ruleId === "CI001")).toBe(false);
  });

  it("CI002 fires on eval()", () => {
    const files: FileContent[] = [{ path: "cmd.ts", content: `eval(userInput);` }];
    const matches = scanFiles(files, commandInjectionRules);
    expect(matches.some((m) => m.ruleId === "CI002")).toBe(true);
  });

  it("CI002 does not fire without eval", () => {
    const files: FileContent[] = [{ path: "cmd.ts", content: `JSON.parse(data);` }];
    const matches = scanFiles(files, commandInjectionRules);
    expect(matches.some((m) => m.ruleId === "CI002")).toBe(false);
  });

  it("CI003 fires on spawn with shell: true", () => {
    const files: FileContent[] = [{ path: "cmd.ts", content: `spawn("cmd", args, { shell: true });` }];
    const matches = scanFiles(files, commandInjectionRules);
    expect(matches.some((m) => m.ruleId === "CI003")).toBe(true);
  });

  it("CI003 does not fire on spawn without shell option", () => {
    const files: FileContent[] = [{ path: "cmd.ts", content: `spawn("node", ["index.js"]);` }];
    const matches = scanFiles(files, commandInjectionRules);
    expect(matches.some((m) => m.ruleId === "CI003")).toBe(false);
  });

  it("CI004 fires on os.system()", () => {
    const files: FileContent[] = [{ path: "cmd.py", content: `os.system(cmd)` }];
    const matches = scanFiles(files, commandInjectionRules);
    expect(matches.some((m) => m.ruleId === "CI004")).toBe(true);
  });

  it("CI004 does not fire on non-python files", () => {
    const files: FileContent[] = [{ path: "cmd.ts", content: `os.system(cmd)` }];
    const matches = scanFiles(files, commandInjectionRules);
    expect(matches.some((m) => m.ruleId === "CI004")).toBe(false);
  });

  it("CI005 fires on subprocess with shell=True", () => {
    const files: FileContent[] = [{ path: "cmd.py", content: `subprocess.run(cmd, shell=True)` }];
    const matches = scanFiles(files, commandInjectionRules);
    expect(matches.some((m) => m.ruleId === "CI005")).toBe(true);
  });

  it("CI005 does not fire on subprocess without shell", () => {
    const files: FileContent[] = [{ path: "cmd.py", content: `subprocess.run(["ls", "-la"])` }];
    const matches = scanFiles(files, commandInjectionRules);
    expect(matches.some((m) => m.ruleId === "CI005")).toBe(false);
  });

  it("CI006 fires on exec() in Python", () => {
    const files: FileContent[] = [{ path: "cmd.py", content: `exec(code_string)` }];
    const matches = scanFiles(files, commandInjectionRules);
    expect(matches.some((m) => m.ruleId === "CI006")).toBe(true);
  });

  it("CI006 does not fire on non-python files", () => {
    const files: FileContent[] = [{ path: "cmd.ts", content: `execute(query)` }];
    const matches = scanFiles(files, commandInjectionRules);
    expect(matches.some((m) => m.ruleId === "CI006")).toBe(false);
  });

  it("CI007 fires on new Function()", () => {
    const files: FileContent[] = [{ path: "cmd.ts", content: `const fn = new Function("return " + expr);` }];
    const matches = scanFiles(files, commandInjectionRules);
    expect(matches.some((m) => m.ruleId === "CI007")).toBe(true);
  });

  it("CI007 does not fire without Function constructor", () => {
    const files: FileContent[] = [{ path: "cmd.ts", content: `function add(a, b) { return a + b; }` }];
    const matches = scanFiles(files, commandInjectionRules);
    expect(matches.some((m) => m.ruleId === "CI007")).toBe(false);
  });

  it("CI008 fires on child_process import with exec usage", () => {
    const files: FileContent[] = [{ path: "cmd.ts", content: `const cp = require("child_process");\ncp.exec(cmd);` }];
    const matches = scanFiles(files, commandInjectionRules);
    expect(matches.some((m) => m.ruleId === "CI008")).toBe(true);
  });

  it("CI008 does not fire on child_process import without exec", () => {
    const files: FileContent[] = [{ path: "cmd.ts", content: `const cp = require("child_process");\nconsole.log("imported");` }];
    const matches = scanFiles(files, commandInjectionRules);
    expect(matches.some((m) => m.ruleId === "CI008")).toBe(false);
  });
});

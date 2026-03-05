import { describe, it, expect } from "vitest";
import { scanFiles } from "@/scanner/engine";
import { allRules, ssrfRules } from "@/scanner/rules";
import type { FileContent } from "@/types/scan";

describe("ssrf rules", () => {
  it("all 4 ssrf rules are present in allRules", () => {
    const ssrfInAll = allRules.filter((r) => r.category === "ssrf");
    expect(ssrfInAll).toHaveLength(4);
    expect(ssrfInAll.map((r) => r.id).sort()).toEqual(["SSRF001", "SSRF002", "SSRF003", "SSRF004"]);
  });

  it("SSRF001 fires on fetch with variable URL", () => {
    const files: FileContent[] = [{ path: "api.ts", content: `fetch(userUrl)` }];
    const matches = scanFiles(files, ssrfRules);
    expect(matches.some((m) => m.ruleId === "SSRF001")).toBe(true);
  });

  it("SSRF001 does not fire on fetch with static URL", () => {
    const files: FileContent[] = [{ path: "api.ts", content: `fetch("https://api.example.com/data")` }];
    const matches = scanFiles(files, ssrfRules);
    expect(matches.some((m) => m.ruleId === "SSRF001")).toBe(false);
  });

  it("SSRF002 fires on localhost URL", () => {
    const files: FileContent[] = [{ path: "api.ts", content: `fetch("http://127.0.0.1:8080/admin")` }];
    const matches = scanFiles(files, ssrfRules);
    expect(matches.some((m) => m.ruleId === "SSRF002")).toBe(true);
  });

  it("SSRF002 does not fire on external URL", () => {
    const files: FileContent[] = [{ path: "api.ts", content: `fetch("https://api.example.com")` }];
    const matches = scanFiles(files, ssrfRules);
    expect(matches.some((m) => m.ruleId === "SSRF002")).toBe(false);
  });

  it("SSRF003 fires on private IP range", () => {
    const files: FileContent[] = [{ path: "api.ts", content: `fetch("http://192.168.1.1:3000/data")` }];
    const matches = scanFiles(files, ssrfRules);
    expect(matches.some((m) => m.ruleId === "SSRF003")).toBe(true);
  });

  it("SSRF003 does not fire on public IP", () => {
    const files: FileContent[] = [{ path: "api.ts", content: `fetch("https://8.8.8.8/dns")` }];
    const matches = scanFiles(files, ssrfRules);
    expect(matches.some((m) => m.ruleId === "SSRF003")).toBe(false);
  });

  it("SSRF004 fires on URL from user input", () => {
    const files: FileContent[] = [{ path: "api.ts", content: "const u = new URL(`https://${req.body.host}/api`);" }];
    const matches = scanFiles(files, ssrfRules);
    expect(matches.some((m) => m.ruleId === "SSRF004")).toBe(true);
  });

  it("SSRF004 does not fire on static URL construction", () => {
    const files: FileContent[] = [{ path: "api.ts", content: `const u = new URL("https://api.example.com/data");` }];
    const matches = scanFiles(files, ssrfRules);
    expect(matches.some((m) => m.ruleId === "SSRF004")).toBe(false);
  });
});

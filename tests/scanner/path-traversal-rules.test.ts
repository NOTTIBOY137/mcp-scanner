import { describe, it, expect } from "vitest";
import { scanFiles } from "@/scanner/engine";
import { allRules, pathTraversalRules } from "@/scanner/rules";
import type { FileContent } from "@/types/scan";

describe("path-traversal rules", () => {
  it("all 5 path-traversal rules are present in allRules", () => {
    const ptInAll = allRules.filter((r) => r.category === "path-traversal");
    expect(ptInAll).toHaveLength(5);
    expect(ptInAll.map((r) => r.id).sort()).toEqual(["PT001", "PT002", "PT003", "PT004", "PT005"]);
  });

  it("PT001 fires on traversal to /etc/passwd", () => {
    const files: FileContent[] = [{ path: "file.ts", content: `const p = "../../../etc/passwd";` }];
    const matches = scanFiles(files, pathTraversalRules);
    expect(matches.some((m) => m.ruleId === "PT001")).toBe(true);
  });

  it("PT001 does not fire on normal paths", () => {
    const files: FileContent[] = [{ path: "file.ts", content: `const p = "./config/settings.json";` }];
    const matches = scanFiles(files, pathTraversalRules);
    expect(matches.some((m) => m.ruleId === "PT001")).toBe(false);
  });

  it("PT002 fires on path.join with req input", () => {
    const files: FileContent[] = [{ path: "file.ts", content: `const p = path.join(baseDir, req.params.file);` }];
    const matches = scanFiles(files, pathTraversalRules);
    expect(matches.some((m) => m.ruleId === "PT002")).toBe(true);
  });

  it("PT002 does not fire on static path.join", () => {
    const files: FileContent[] = [{ path: "file.ts", content: `const p = path.join(__dirname, "config");` }];
    const matches = scanFiles(files, pathTraversalRules);
    expect(matches.some((m) => m.ruleId === "PT002")).toBe(false);
  });

  it("PT003 fires on /etc/passwd string", () => {
    const files: FileContent[] = [{ path: "file.ts", content: `const f = "/etc/passwd";` }];
    const matches = scanFiles(files, pathTraversalRules);
    expect(matches.some((m) => m.ruleId === "PT003")).toBe(true);
  });

  it("PT003 does not fire on normal string", () => {
    const files: FileContent[] = [{ path: "file.ts", content: `const f = "/var/log/app.log";` }];
    const matches = scanFiles(files, pathTraversalRules);
    expect(matches.some((m) => m.ruleId === "PT003")).toBe(false);
  });

  it("PT004 fires on fs.readFile with variable", () => {
    const files: FileContent[] = [{ path: "file.ts", content: `fs.readFile(userPath, "utf8", cb);` }];
    const matches = scanFiles(files, pathTraversalRules);
    expect(matches.some((m) => m.ruleId === "PT004")).toBe(true);
  });

  it("PT004 does not fire on fs.readFile with static path", () => {
    const files: FileContent[] = [{ path: "file.ts", content: `fs.readFile("/config/app.json", "utf8", cb);` }];
    const matches = scanFiles(files, pathTraversalRules);
    expect(matches.some((m) => m.ruleId === "PT004")).toBe(false);
  });

  it("PT005 fires on readFileSync of .env", () => {
    const files: FileContent[] = [{ path: "file.ts", content: `const env = readFileSync(".env");` }];
    const matches = scanFiles(files, pathTraversalRules);
    expect(matches.some((m) => m.ruleId === "PT005")).toBe(true);
  });

  it("PT005 does not fire when dotenv is imported", () => {
    const files: FileContent[] = [{ path: "file.ts", content: `import dotenv from "dotenv";\nconst env = readFileSync(".env");` }];
    const matches = scanFiles(files, pathTraversalRules);
    expect(matches.some((m) => m.ruleId === "PT005")).toBe(false);
  });
});

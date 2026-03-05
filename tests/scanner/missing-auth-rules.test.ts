import { describe, it, expect } from "vitest";
import { scanFiles } from "@/scanner/engine";
import { allRules, missingAuthRules } from "@/scanner/rules";
import type { FileContent } from "@/types/scan";

describe("missing-auth rules", () => {
  it("all 4 missing-auth rules are present in allRules", () => {
    const maInAll = allRules.filter((r) => r.category === "missing-auth");
    expect(maInAll).toHaveLength(4);
    expect(maInAll.map((r) => r.id).sort()).toEqual(["MA001", "MA002", "MA003", "MA004"]);
  });

  it("MA001 fires on 0.0.0.0 binding", () => {
    const files: FileContent[] = [{ path: "server.ts", content: `app.listen(3000, "0.0.0.0");` }];
    const matches = scanFiles(files, missingAuthRules);
    expect(matches.some((m) => m.ruleId === "MA001")).toBe(true);
  });

  it("MA001 does not fire on localhost binding", () => {
    const files: FileContent[] = [{ path: "server.ts", content: `app.listen(3000, "127.0.0.1");` }];
    const matches = scanFiles(files, missingAuthRules);
    expect(matches.some((m) => m.ruleId === "MA001")).toBe(false);
  });

  it("MA002 fires on CORS wildcard", () => {
    const files: FileContent[] = [{ path: "server.ts", content: `Access-Control-Allow-Origin: "*"` }];
    const matches = scanFiles(files, missingAuthRules);
    expect(matches.some((m) => m.ruleId === "MA002")).toBe(true);
  });

  it("MA002 does not fire on specific CORS origin", () => {
    const files: FileContent[] = [{ path: "server.ts", content: `Access-Control-Allow-Origin: "https://example.com"` }];
    const matches = scanFiles(files, missingAuthRules);
    expect(matches.some((m) => m.ruleId === "MA002")).toBe(false);
  });

  it("MA003 fires on route without auth middleware", () => {
    const files: FileContent[] = [{ path: "routes.ts", content: `app.get("/users", async (req, res) => {` }];
    const matches = scanFiles(files, missingAuthRules);
    expect(matches.some((m) => m.ruleId === "MA003")).toBe(true);
  });

  it("MA003 does not fire when auth middleware present", () => {
    const files: FileContent[] = [{ path: "routes.ts", content: `const authenticate = require("./auth");\napp.get("/users", async (req, res) => {` }];
    const matches = scanFiles(files, missingAuthRules);
    expect(matches.some((m) => m.ruleId === "MA003")).toBe(false);
  });

  it("MA004 fires on direct req.body usage in exec", () => {
    const files: FileContent[] = [{ path: "routes.ts", content: `req.body.cmd exec("ls")` }];
    const matches = scanFiles(files, missingAuthRules);
    expect(matches.some((m) => m.ruleId === "MA004")).toBe(true);
  });

  it("MA004 does not fire on validated input", () => {
    const files: FileContent[] = [{ path: "routes.ts", content: `const validated = schema.parse(req.body);` }];
    const matches = scanFiles(files, missingAuthRules);
    expect(matches.some((m) => m.ruleId === "MA004")).toBe(false);
  });
});

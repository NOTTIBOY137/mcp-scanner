import { describe, it, expect } from "vitest";
import { scanFiles } from "@/scanner/engine";
import { allRules, credentialTheftRules } from "@/scanner/rules";
import type { FileContent } from "@/types/scan";

describe("credential-theft rules", () => {
  it("all 7 credential-theft rules are present in allRules", () => {
    const ctInAll = allRules.filter((r) => r.category === "credential-theft");
    expect(ctInAll).toHaveLength(7);
    expect(ctInAll.map((r) => r.id).sort()).toEqual(["CT001", "CT002", "CT003", "CT004", "CT005", "CT006", "CT007"]);
  });

  it("CT001 fires on bracket access to API_KEY", () => {
    const files: FileContent[] = [{ path: "cred.ts", content: `const key = process.env["API_KEY"];` }];
    const matches = scanFiles(files, credentialTheftRules);
    expect(matches.some((m) => m.ruleId === "CT001")).toBe(true);
  });

  it("CT001 does not fire on normal env access", () => {
    const files: FileContent[] = [{ path: "cred.ts", content: `const port = process.env["PORT"];` }];
    const matches = scanFiles(files, credentialTheftRules);
    expect(matches.some((m) => m.ruleId === "CT001")).toBe(false);
  });

  it("CT002 fires on reading .aws/credentials", () => {
    const files: FileContent[] = [{ path: "cred.ts", content: `readFileSync("/home/user/.aws/credentials")` }];
    const matches = scanFiles(files, credentialTheftRules);
    expect(matches.some((m) => m.ruleId === "CT002")).toBe(true);
  });

  it("CT002 does not fire on normal file read", () => {
    const files: FileContent[] = [{ path: "cred.ts", content: `readFileSync("/app/config.json")` }];
    const matches = scanFiles(files, credentialTheftRules);
    expect(matches.some((m) => m.ruleId === "CT002")).toBe(false);
  });

  it("CT003 fires on Base64 encoding of secret", () => {
    const files: FileContent[] = [{ path: "cred.ts", content: `Buffer.from(process.env.SECRET)` }];
    const matches = scanFiles(files, credentialTheftRules);
    expect(matches.some((m) => m.ruleId === "CT003")).toBe(true);
  });

  it("CT003 does not fire on Base64 of normal data", () => {
    const files: FileContent[] = [{ path: "cred.ts", content: `Buffer.from("hello world")` }];
    const matches = scanFiles(files, credentialTheftRules);
    expect(matches.some((m) => m.ruleId === "CT003")).toBe(false);
  });

  it("CT004 fires on fetch with process.env", () => {
    const files: FileContent[] = [{ path: "cred.ts", content: `fetch(url, { body: JSON.stringify(process.env) })` }];
    const matches = scanFiles(files, credentialTheftRules);
    expect(matches.some((m) => m.ruleId === "CT004")).toBe(true);
  });

  it("CT004 does not fire on normal fetch", () => {
    const files: FileContent[] = [{ path: "cred.ts", content: `fetch("https://api.example.com", { body: JSON.stringify({ name: "test" }) })` }];
    const matches = scanFiles(files, credentialTheftRules);
    expect(matches.some((m) => m.ruleId === "CT004")).toBe(false);
  });

  it("CT005 fires on JSON.stringify(process.env)", () => {
    const files: FileContent[] = [{ path: "cred.ts", content: `const all = JSON.stringify(process.env);` }];
    const matches = scanFiles(files, credentialTheftRules);
    expect(matches.some((m) => m.ruleId === "CT005")).toBe(true);
  });

  it("CT005 does not fire on specific env var", () => {
    const files: FileContent[] = [{ path: "cred.ts", content: `const port = process.env.PORT;` }];
    const matches = scanFiles(files, credentialTheftRules);
    expect(matches.some((m) => m.ruleId === "CT005")).toBe(false);
  });

  it("CT006 fires on hardcoded API key", () => {
    const files: FileContent[] = [{ path: "cred.ts", content: `const key = "sk-abcdefghijklmnopqrstuvwxyz1234567890";` }];
    const matches = scanFiles(files, credentialTheftRules);
    expect(matches.some((m) => m.ruleId === "CT006")).toBe(true);
  });

  it("CT006 does not fire on normal string", () => {
    const files: FileContent[] = [{ path: "cred.ts", content: `const msg = "Hello world";` }];
    const matches = scanFiles(files, credentialTheftRules);
    expect(matches.some((m) => m.ruleId === "CT006")).toBe(false);
  });

  it("CT007 fires on dot-notation SECRET access", () => {
    const files: FileContent[] = [{ path: "cred.ts", content: `const s = process.env.MY_SECRET;` }];
    const matches = scanFiles(files, credentialTheftRules);
    expect(matches.some((m) => m.ruleId === "CT007")).toBe(true);
  });

  it("CT007 does not fire on safe env access", () => {
    const files: FileContent[] = [{ path: "cred.ts", content: `const mode = process.env.NODE_ENV;` }];
    const matches = scanFiles(files, credentialTheftRules);
    expect(matches.some((m) => m.ruleId === "CT007")).toBe(false);
  });
});

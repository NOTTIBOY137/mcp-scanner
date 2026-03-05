import { describe, it, expect } from "vitest";
import { hashToolDefinition, detectToolDefinitions } from "@/scanner/hasher";

describe("hashToolDefinition", () => {
  it("returns a deterministic hash", () => {
    const hash1 = hashToolDefinition("some content");
    const hash2 = hashToolDefinition("some content");
    expect(hash1).toBe(hash2);
  });

  it("returns a 64-character hex string", () => {
    const hash = hashToolDefinition("test");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns different hashes for different inputs", () => {
    const h1 = hashToolDefinition("input-a");
    const h2 = hashToolDefinition("input-b");
    expect(h1).not.toBe(h2);
  });

  it("handles empty string", () => {
    const hash = hashToolDefinition("");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("detectToolDefinitions", () => {
  it("detects server.tool() pattern", () => {
    const content = `server.tool("myTool", handler);`;
    const defs = detectToolDefinitions(content);
    expect(defs).toHaveLength(1);
    expect(defs[0].name).toBe("myTool");
  });

  it("detects name: pattern", () => {
    const content = `const tool = { name: "calculator", fn: calc };`;
    const defs = detectToolDefinitions(content);
    expect(defs.some((d) => d.name === "calculator")).toBe(true);
  });

  it("detects .addTool() pattern", () => {
    const content = `.addTool({ name: "fetcher", description: "Fetches data" });`;
    const defs = detectToolDefinitions(content);
    expect(defs.some((d) => d.name === "fetcher")).toBe(true);
  });

  it("deduplicates tool names", () => {
    const content = `server.tool("dup", h1);\nserver.tool("dup", h2);`;
    const defs = detectToolDefinitions(content);
    const dupCount = defs.filter((d) => d.name === "dup").length;
    expect(dupCount).toBe(1);
  });

  it("returns empty array for clean code with no tool definitions", () => {
    const content = `const x = 1;\nconsole.log("hello world");`;
    const defs = detectToolDefinitions(content);
    expect(defs).toHaveLength(0);
  });

  it("each definition includes a hash", () => {
    const content = `server.tool("hashed", handler);`;
    const defs = detectToolDefinitions(content);
    expect(defs[0].hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

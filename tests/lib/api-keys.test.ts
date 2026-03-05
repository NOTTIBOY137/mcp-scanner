import { describe, it, expect, vi } from "vitest";

// Mock DB before importing module
vi.mock("@/lib/db", () => ({
  db: {},
}));

vi.mock("@/db/schema", () => ({
  apiKeys: {},
}));

import { hashApiKey, generateApiKey, getPlanLimits } from "@/lib/api-keys";

describe("hashApiKey", () => {
  it("produces a 64-char hex string (SHA-256)", async () => {
    const hash = await hashApiKey("test");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for the same input", async () => {
    const a = await hashApiKey("hello-world");
    const b = await hashApiKey("hello-world");
    expect(a).toBe(b);
  });

  it("produces different hashes for different inputs", async () => {
    const a = await hashApiKey("input-a");
    const b = await hashApiKey("input-b");
    expect(a).not.toBe(b);
  });
});

describe("generateApiKey", () => {
  it("returns { raw, hash, prefix } with correct formats", async () => {
    const key = await generateApiKey();

    expect(key.raw).toMatch(/^mcp_/);
    expect(key.prefix).toBe(key.raw.slice(0, 12));
    expect(key.hash).toHaveLength(64);
    expect(key.hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("getPlanLimits", () => {
  it('returns { daily: 100, maxClaims: 1 } for "free"', () => {
    expect(getPlanLimits("free")).toEqual({ daily: 100, maxClaims: 1 });
  });

  it('returns { daily: 1000, maxClaims: 10 } for "pro"', () => {
    expect(getPlanLimits("pro")).toEqual({ daily: 1_000, maxClaims: 10 });
  });

  it('returns { daily: 10000, maxClaims: 100 } for "team"', () => {
    expect(getPlanLimits("team")).toEqual({ daily: 10_000, maxClaims: 100 });
  });

  it("defaults to free limits for unknown plan", () => {
    expect(getPlanLimits("unknown")).toEqual({ daily: 100, maxClaims: 1 });
  });
});

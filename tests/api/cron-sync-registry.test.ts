import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindFirst = vi.fn();
const mockInsert = vi.fn().mockResolvedValue(undefined);
const mockUpdate = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      servers: {
        findFirst: (...args: any[]) => mockFindFirst(...args),
      },
    },
    insert: () => ({
      values: (...args: any[]) => mockInsert(...args),
    }),
    update: () => ({
      set: () => ({
        where: (...args: any[]) => mockUpdate(...args),
      }),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  servers: { repoUrl: "repo_url", id: "id" },
}));

vi.mock("@paralleldrive/cuid2", () => ({
  createId: () => "mock-cuid",
}));

const originalFetch = globalThis.fetch;

import { GET } from "@/app/api/cron/sync-registry/route";

describe("GET /api/cron/sync-registry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = originalFetch;
    delete (process.env as any).CRON_SECRET;
  });

  it("returns 401 with wrong secret", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const req = new Request("http://localhost/api/cron/sync-registry", {
      headers: { authorization: "Bearer wrong-secret" },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns synced:0 when registry is unavailable", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(null) as any;
    const req = new Request("http://localhost/api/cron/sync-registry");
    const res = await GET(req);
    const json = await res.json();
    expect(json.synced).toBe(0);
  });

  it("returns synced:0 on non-ok response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false }) as any;
    const req = new Request("http://localhost/api/cron/sync-registry");
    const res = await GET(req);
    const json = await res.json();
    expect(json.synced).toBe(0);
  });

  it("inserts new server from registry", async () => {
    mockFindFirst.mockResolvedValue(null);
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          servers: [
            {
              name: "test-server",
              slug: "test",
              repository: { url: "https://github.com/a/b", owner: "a", repo: "b" },
              description: "A test server",
              stars: 10,
              verified: true,
            },
          ],
        }),
    }) as any;

    const req = new Request("http://localhost/api/cron/sync-registry");
    const res = await GET(req);
    const json = await res.json();
    expect(json.synced).toBe(1);
    expect(mockInsert).toHaveBeenCalled();
  });

  it("updates existing server from registry", async () => {
    mockFindFirst.mockResolvedValue({ id: "existing-id", stars: 5 });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          servers: [
            {
              name: "test-server",
              slug: "test",
              repository: { url: "https://github.com/a/b" },
              stars: 20,
              verified: false,
            },
          ],
        }),
    }) as any;

    const req = new Request("http://localhost/api/cron/sync-registry");
    const res = await GET(req);
    const json = await res.json();
    expect(json.synced).toBe(1);
    expect(mockUpdate).toHaveBeenCalled();
  });
});

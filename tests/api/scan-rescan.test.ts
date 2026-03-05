import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockFindFirst = vi.fn();
const mockInsert = vi.fn().mockResolvedValue(undefined);

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      servers: { findFirst: (...args: any[]) => mockFindFirst(...args) },
    },
    insert: () => ({
      values: (...args: any[]) => mockInsert(...args),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  servers: { id: "id" },
  scans: {},
}));

vi.mock("@paralleldrive/cuid2", () => ({
  createId: () => "mock-scan-id",
}));

vi.mock("next/server", async () => {
  const actual = await vi.importActual("next/server");
  return {
    ...actual,
    after: vi.fn((fn: () => void) => fn()),
  };
});

vi.mock("@/lib/scan-runner", () => ({
  runScanInBackground: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/scan/rescan/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/scan/rescan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/scan/rescan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without auth", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(makeRequest({ serverId: "s1" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 for missing server", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockFindFirst.mockResolvedValue(null);
    const res = await POST(makeRequest({ serverId: "no-exist" }));
    expect(res.status).toBe(404);
  });

  it("creates new scan for existing server", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockFindFirst.mockResolvedValue({ id: "srv-1", owner: "test", repo: "repo" });

    const res = await POST(makeRequest({ serverId: "srv-1" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toHaveProperty("id");
    expect(json.status).toBe("pending");
  });
});

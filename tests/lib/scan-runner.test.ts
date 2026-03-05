import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpdate = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });
const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });

vi.mock("@/lib/db", () => ({
  db: {
    update: (...args: any[]) => mockUpdate(...args),
    insert: (...args: any[]) => mockInsert(...args),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([]),
        }),
      }),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  servers: {},
  scans: { id: "id" },
  findings: {},
  toolHashes: {},
  serverClaims: {},
  emailPreferences: {},
}));

vi.mock("@/lib/github", () => ({
  getRepoInfo: vi.fn().mockResolvedValue({ name: "test", description: "desc", stars: 10, language: "TypeScript" }),
  getRepoTree: vi.fn().mockResolvedValue([{ path: "src/index.ts" }]),
  batchFetchFiles: vi.fn().mockResolvedValue([{ path: "src/index.ts", content: "console.log('hello')" }]),
}));

vi.mock("@/scanner/engine", () => ({
  scanFiles: vi.fn().mockReturnValue([]),
}));

vi.mock("@/scanner/rules", () => ({
  allRules: [],
}));

vi.mock("@/scanner/grader", () => ({
  calculateGrade: vi.fn().mockReturnValue({ grade: "A", score: 100, categoryScores: {} }),
}));

vi.mock("@/scanner/hasher", () => ({
  detectToolDefinitions: vi.fn().mockReturnValue([]),
}));

vi.mock("@/lib/redis", () => ({
  cacheScanResult: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/webhooks", () => ({
  deliverWebhooks: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/email", () => ({
  sendScanCompletionEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@paralleldrive/cuid2", () => ({
  createId: () => "mock-cuid",
}));

import { runScanInBackground } from "@/lib/scan-runner";
import { deliverWebhooks } from "@/lib/webhooks";

describe("runScanInBackground", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls deliverWebhooks on successful completion", async () => {
    await runScanInBackground({
      scanId: "scan-1",
      serverId: "srv-1",
      owner: "test-org",
      repo: "test-repo",
    });

    expect(deliverWebhooks).toHaveBeenCalledWith(
      "scan.completed",
      expect.objectContaining({
        scanId: "scan-1",
        serverId: "srv-1",
        grade: "A",
        score: 100,
      })
    );
  });

  it("calls deliverWebhooks on failure", async () => {
    const { getRepoInfo } = await import("@/lib/github");
    (getRepoInfo as any).mockRejectedValueOnce(new Error("Network error"));

    await runScanInBackground({
      scanId: "scan-2",
      serverId: "srv-1",
      owner: "fail-org",
      repo: "fail-repo",
    });

    expect(deliverWebhooks).toHaveBeenCalledWith(
      "scan.failed",
      expect.objectContaining({ scanId: "scan-2", serverId: "srv-1" })
    );
  });
});

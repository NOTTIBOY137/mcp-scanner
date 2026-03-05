import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSelectClaims = vi.fn();
const mockSelectWebhooks = vi.fn();
const mockInsertDelivery = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/db", () => ({
  db: {
    select: () => {
      const idx = (globalThis as any).__whTestSelectIdx++;
      if (idx === 0) {
        return {
          from: () => ({
            where: () => mockSelectClaims(),
          }),
        };
      }
      return {
        from: () => ({
          where: () => mockSelectWebhooks(),
        }),
      };
    },
    insert: () => ({
      values: (...args: any[]) => mockInsertDelivery(...args),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  webhooks: { clerkUserId: "clerk_user_id", active: "active" },
  webhookDeliveries: { webhookId: "webhook_id" },
  serverClaims: { serverId: "server_id", verified: "verified" },
}));

vi.mock("@paralleldrive/cuid2", () => ({
  createId: () => "mock-cuid",
}));

process.env.NEXT_PUBLIC_APP_URL = "https://mcptrust.dev";

import { signPayload, deliverWebhooks } from "@/lib/webhooks";

describe("webhooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__whTestSelectIdx = 0;
  });

  describe("signPayload", () => {
    it("returns consistent HMAC-SHA256 hex digest", () => {
      const sig1 = signPayload('{"test": true}', "secret-key");
      const sig2 = signPayload('{"test": true}', "secret-key");
      expect(sig1).toBe(sig2);
      expect(sig1).toMatch(/^[a-f0-9]{64}$/);
    });

    it("returns different signatures for different secrets", () => {
      const sig1 = signPayload("data", "key1");
      const sig2 = signPayload("data", "key2");
      expect(sig1).not.toBe(sig2);
    });
  });

  describe("deliverWebhooks", () => {
    it("does nothing when no claimed owners exist", async () => {
      mockSelectClaims.mockResolvedValue([]);

      await deliverWebhooks("scan.completed", {
        scanId: "s1",
        serverId: "srv1",
        grade: "A",
        score: 95,
        findingsCount: 0,
      });

      expect(mockInsertDelivery).not.toHaveBeenCalled();
    });

    it("delivers to active webhooks for claimed owner", async () => {
      mockSelectClaims.mockResolvedValue([{ clerkUserId: "owner-1" }]);
      mockSelectWebhooks.mockResolvedValue([
        {
          id: "wh-1",
          url: "https://example.com/hook",
          secret: "test-secret",
          events: ["scan.completed"],
          active: true,
        },
      ]);

      // Mock fetch
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      global.fetch = mockFetch;

      await deliverWebhooks("scan.completed", {
        scanId: "s1",
        serverId: "srv1",
        grade: "B",
        score: 80,
        findingsCount: 3,
      });

      expect(mockFetch).toHaveBeenCalledOnce();
      expect(mockFetch.mock.calls[0][0]).toBe("https://example.com/hook");
      expect(mockInsertDelivery).toHaveBeenCalledOnce();
    });

    it("retries with backoff delays on failure", async () => {
      vi.useFakeTimers();
      mockSelectClaims.mockResolvedValue([{ clerkUserId: "owner-1" }]);
      mockSelectWebhooks.mockResolvedValue([
        {
          id: "wh-1",
          url: "https://failing.example.com/hook",
          secret: "test-secret",
          events: ["scan.completed"],
          active: true,
        },
      ]);

      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) return Promise.resolve({ ok: false, status: 500 });
        return Promise.resolve({ ok: true, status: 200 });
      });
      global.fetch = mockFetch;

      const promise = deliverWebhooks("scan.completed", {
        scanId: "s1",
        serverId: "srv1",
        grade: "C",
        score: 60,
        findingsCount: 5,
      });

      // Advance timers through all backoff delays
      await vi.advanceTimersByTimeAsync(10000);

      await promise;

      expect(mockFetch).toHaveBeenCalledTimes(3);
      vi.useRealTimers();
    });

    it("records correct attempt count after retries exhausted", async () => {
      vi.useFakeTimers();
      mockSelectClaims.mockResolvedValue([{ clerkUserId: "owner-1" }]);
      mockSelectWebhooks.mockResolvedValue([
        {
          id: "wh-1",
          url: "https://failing.example.com/hook",
          secret: "test-secret",
          events: ["scan.completed"],
          active: true,
        },
      ]);

      const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
      global.fetch = mockFetch;

      const promise = deliverWebhooks("scan.completed", {
        scanId: "s1",
        serverId: "srv1",
        grade: "D",
        score: 40,
        findingsCount: 10,
      });

      await vi.advanceTimersByTimeAsync(10000);

      await promise;

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockInsertDelivery).toHaveBeenCalledOnce();
      const deliveryRecord = mockInsertDelivery.mock.calls[0][0];
      expect(deliveryRecord.attempts).toBe(3);
      vi.useRealTimers();
    });

    it("logs delivery after all retries exhausted", async () => {
      vi.useFakeTimers();
      mockSelectClaims.mockResolvedValue([{ clerkUserId: "owner-1" }]);
      mockSelectWebhooks.mockResolvedValue([
        {
          id: "wh-1",
          url: "https://failing.example.com/hook",
          secret: "test-secret",
          events: ["scan.completed"],
          active: true,
        },
      ]);

      const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
      global.fetch = mockFetch;

      const promise = deliverWebhooks("scan.completed", {
        scanId: "s1",
        serverId: "srv1",
      });

      await vi.advanceTimersByTimeAsync(10000);

      await promise;

      expect(mockInsertDelivery).toHaveBeenCalledOnce();
      const deliveryRecord = mockInsertDelivery.mock.calls[0][0];
      expect(deliveryRecord.statusCode).toBe(0);
      expect(deliveryRecord.attempts).toBe(3);
      vi.useRealTimers();
    });
  });
});

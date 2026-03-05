import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => mockSelect(),
        }),
      }),
    }),
    insert: () => ({
      values: (...args: any[]) => mockInsert(...args),
    }),
    update: () => ({
      set: () => ({
        where: () => mockUpdate(),
      }),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  emailPreferences: { clerkUserId: "clerk_user_id", scanAlerts: "scan_alerts", marketingEmails: "marketing_emails" },
}));

vi.mock("@paralleldrive/cuid2", () => ({
  createId: () => "mock-cuid",
}));

import { GET, PUT } from "@/app/api/email-preferences/route";

describe("GET /api/email-preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without auth", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns defaults when no row exists", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockSelect.mockResolvedValue([]);
    mockInsert.mockResolvedValue(undefined);

    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.scanAlerts).toBe(true);
    expect(json.marketingEmails).toBe(false);
  });

  it("returns existing preferences", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockSelect.mockResolvedValue([{ scanAlerts: false, marketingEmails: true }]);

    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.scanAlerts).toBe(false);
    expect(json.marketingEmails).toBe(true);
  });
});

describe("PUT /api/email-preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without auth", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await PUT(new Request("http://localhost", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scanAlerts: false }),
    }));
    expect(res.status).toBe(401);
  });

  it("updates preferences", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });
    // First call: check existing, second call: fetch updated
    mockSelect
      .mockResolvedValueOnce([{ id: "ep-1", scanAlerts: true, marketingEmails: false }])
      .mockResolvedValueOnce([{ scanAlerts: false, marketingEmails: false }]);
    mockUpdate.mockResolvedValue(undefined);

    const res = await PUT(new Request("http://localhost", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scanAlerts: false }),
    }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.scanAlerts).toBe(false);
  });
});

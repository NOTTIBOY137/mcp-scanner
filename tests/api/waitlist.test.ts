import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// --- Mocks ---
const mockInsert = vi.fn().mockReturnThis();
const mockValues = vi.fn().mockReturnThis();
const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/db", () => ({
  db: {
    insert: (...args: any[]) => {
      mockInsert(...args);
      return { values: (...a: any[]) => { mockValues(...a); return { onConflictDoUpdate: mockOnConflictDoUpdate }; } };
    },
  },
}));

vi.mock("@/db/schema", () => ({
  waitlist: { email: "email" },
}));

const mockRateLimit = vi.fn();
vi.mock("@/lib/rate-limit", () => ({
  waitlistRateLimit: { limit: (...args: any[]) => mockRateLimit(...args) },
}));

import { POST } from "@/app/api/waitlist/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/waitlist", {
    method: "POST",
    headers: { "x-forwarded-for": "1.2.3.4", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/waitlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
  });

  it('accepts valid { email, plan: "pro" }', async () => {
    const res = await POST(makeRequest({ email: "test@example.com", plan: "pro" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("rejects invalid email format (400)", async () => {
    const res = await POST(makeRequest({ email: "not-an-email", plan: "pro" }));
    expect(res.status).toBe(400);
  });

  it("rejects invalid plan value (400)", async () => {
    const res = await POST(makeRequest({ email: "a@b.com", plan: "invalid" }));
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate limit exceeded", async () => {
    mockRateLimit.mockResolvedValue({ success: false });
    const res = await POST(makeRequest({ email: "a@b.com", plan: "pro" }));
    expect(res.status).toBe(429);
  });

  it("upserts on duplicate email", async () => {
    await POST(makeRequest({ email: "dup@test.com", plan: "team" }));
    expect(mockOnConflictDoUpdate).toHaveBeenCalled();
  });
});

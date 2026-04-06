import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/webhooks/stripe/route";

describe("POST /api/webhooks/stripe", () => {
  it("returns 410 Gone since Stripe is disabled", async () => {
    const res = await POST();
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.error).toContain("free");
  });
});

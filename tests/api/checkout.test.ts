import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/checkout/route";

describe("POST /api/checkout", () => {
  it("returns 410 Gone since all features are free", async () => {
    const res = await POST();
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.error).toContain("free");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn().mockResolvedValue({ id: "msg-1" });

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

// Set env before importing
process.env.RESEND_API_KEY = "re_test_key";
process.env.RESEND_FROM_EMAIL = "test@mcptrust.dev";
process.env.NEXT_PUBLIC_APP_URL = "https://mcptrust.dev";

import { sendClaimVerificationEmail, sendScanCompletionEmail } from "@/lib/email";

describe("email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendClaimVerificationEmail", () => {
    it("sends email with correct params", async () => {
      await sendClaimVerificationEmail("user@test.com", {
        token: "mcptrust-verify-abc123",
        owner: "test-org",
        repo: "test-repo",
      });

      expect(mockSend).toHaveBeenCalledOnce();
      const call = mockSend.mock.calls[0][0];
      expect(call.to).toBe("user@test.com");
      expect(call.subject).toContain("test-org/test-repo");
      expect(call.html).toContain("mcptrust-verify-abc123");
    });
  });

  describe("sendScanCompletionEmail", () => {
    it("sends email with grade and score", async () => {
      await sendScanCompletionEmail("user@test.com", {
        serverName: "my-server",
        grade: "A",
        score: 95,
        scanId: "scan-123",
      });

      expect(mockSend).toHaveBeenCalledOnce();
      const call = mockSend.mock.calls[0][0];
      expect(call.to).toBe("user@test.com");
      expect(call.subject).toContain("A");
      expect(call.subject).toContain("95/100");
      expect(call.html).toContain("/results/scan-123");
    });
  });
});

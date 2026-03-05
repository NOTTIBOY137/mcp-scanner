import { Resend } from "resend";

let resend: Resend | null = null;

export function getResend(): Resend {
  if (!resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    resend = new Resend(key);
  }
  return resend;
}

const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@mcptrust.dev";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mcptrust.dev";

export async function sendClaimVerificationEmail(
  to: string,
  data: { token: string; owner: string; repo: string }
): Promise<void> {
  const { token, owner, repo } = data;
  await getResend().emails.send({
    from: fromEmail,
    to,
    subject: `Verify ownership of ${owner}/${repo} — MCP Trust`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify your MCP server ownership</h2>
        <p>You requested to claim <strong>${owner}/${repo}</strong> on MCP Trust.</p>
        <p>To complete verification, add the following token to your repository:</p>
        <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; font-family: monospace; word-break: break-all;">
          ${token}
        </div>
        <p style="margin-top: 16px;">
          Create a file named <code>.mcptrust</code> in your repo root containing this token,
          then visit your server page to complete verification.
        </p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e4e4e7;" />
        <p style="color: #71717a; font-size: 12px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendScanCompletionEmail(
  to: string,
  data: { serverName: string; grade: string; score: number; scanId: string }
): Promise<void> {
  const { serverName, grade, score, scanId } = data;
  const gradeColor =
    grade === "A" ? "#22c55e" : grade === "B" ? "#3b82f6" : grade === "C" ? "#eab308" : "#ef4444";

  await getResend().emails.send({
    from: fromEmail,
    to,
    subject: `Scan complete: ${serverName} scored ${grade} (${score}/100) — MCP Trust`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Scan Results for ${serverName}</h2>
        <div style="display: inline-block; background: ${gradeColor}20; color: ${gradeColor}; font-size: 48px; font-weight: bold; padding: 16px 24px; border-radius: 12px; border: 2px solid ${gradeColor};">
          ${grade}
        </div>
        <p style="margin-top: 16px; font-size: 18px;">Score: <strong>${score}/100</strong></p>
        <a href="${appUrl}/results/${scanId}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
          View Full Report
        </a>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e4e4e7;" />
        <p style="color: #71717a; font-size: 12px;">
          You received this because scan alerts are enabled.
          <a href="${appUrl}/dashboard#notifications">Manage preferences</a>
        </p>
      </div>
    `,
  });
}

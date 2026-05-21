import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.RESEND_FROM ?? "Lesh Space <onboarding@resend.dev>";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";

function getClient(): Resend | null {
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY missing — skipping email send");
    return null;
  }
  return new Resend(apiKey);
}

export async function sendOTP(email: string, code: string, purpose: "REGISTRATION" | "INVITE") {
  const resend = getClient();
  if (!resend) {
    console.log(`[email] OTP for ${email} (${purpose}): ${code}`);
    return { skipped: true };
  }

  const subject =
    purpose === "REGISTRATION"
      ? "Verify your Lesh Space account"
      : "Your Lesh Space invitation code";

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:12px">
      <h1 style="color:#fff;font-size:22px;margin:0 0 12px">Lesh Space</h1>
      <p style="color:#94a3b8;margin:0 0 24px">Your verification code is:</p>
      <p style="background:#1e293b;color:#fff;font-size:32px;letter-spacing:6px;text-align:center;padding:16px;border-radius:8px;margin:0 0 24px;font-weight:700">${code}</p>
      <p style="color:#64748b;font-size:13px;margin:0">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: fromAddress,
      to: email,
      subject,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email] sendOTP failed:", err);
    return { error: true };
  }
}

export async function sendInvitation(
  email: string,
  token: string,
  workspaceName: string,
  inviterName: string,
) {
  const resend = getClient();
  const link = `${appUrl}/invitations/${token}`;

  if (!resend) {
    console.log(`[email] invite for ${email} → ${link} (workspace: ${workspaceName}, from: ${inviterName})`);
    return { skipped: true };
  }

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:12px">
      <h1 style="color:#fff;font-size:22px;margin:0 0 12px">You've been invited to Lesh Space</h1>
      <p style="color:#cbd5e1;margin:0 0 20px"><strong>${inviterName}</strong> has invited you to join the <strong>${workspaceName}</strong> workspace.</p>
      <a href="${link}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Accept invitation</a>
      <p style="color:#64748b;font-size:13px;margin:24px 0 0">Or paste this link into your browser:<br/><span style="color:#94a3b8">${link}</span></p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: `${inviterName} invited you to ${workspaceName} on Lesh Space`,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email] sendInvitation failed:", err);
    return { error: true };
  }
}

// src/lib/email.ts
import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT = "465",
  SMTP_SECURE = "true", // "true" -> port 465 TLS | "false" -> port 587 STARTTLS
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  NEXT_PUBLIC_APP_URL,
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: SMTP_SECURE === "true",
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  tls: {
    // leave as-is for your dev environment (fixes "self-signed certificate" chains)
    rejectUnauthorized: false,
    servername: SMTP_HOST,
  },
});

export async function sendPasswordResetMail(opts: { to: string; token: string }) {
  const { to, token } = opts;

  const baseUrl = (NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  const link = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

  const subject = "Whistle  Password reset";
  const text = `We received a request to reset the password for ${to}.
This link expires in 30 minutes.

${link}
`;

  const html = `
  <div style="background:#0b0f14;padding:32px;color:#e6edf3;font-family:Inter,system-ui,Segoe UI,Arial">
    <div style="max-width:560px;margin:0 auto;background:#111821;border-radius:16px;padding:28px;border:1px solid #1e2630">
      <h1 style="margin:0 0 16px 0;color:#fff;font-size:22px;">Whistle</h1>
      <p style="margin:0 0 18px 0;">We received a request to reset the password for <b>${to}</b>.</p>
      <p style="margin:0 0 18px 0;">This link expires in <b>30 minutes</b>.</p>
      <a href="${link}" style="display:inline-block;background:#4ade80;color:#081018;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:600">
        Reset password
      </a>
      <p style="margin:18px 0 0 0;font-size:12px;color:#9fb0c0">
        If the button doesnt work, paste this link in your browser:<br/>
        <span style="word-break:break-all;color:#8ab4f8">${link}</span>
      </p>
    </div>
  </div>`;

  return transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
}


// lib/mailer.ts
import nodemailer from "nodemailer";

type SendOpts = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string; // override per-message if needed
};

const MAIL_PROVIDER = (process.env.MAIL_PROVIDER || "resend").toLowerCase();

/** ----------------------
 *  RESEND IMPLEMENTATION
 *  ---------------------- */
async function sendWithResend(opts: SendOpts) {
  const { Resend } = await import("resend");
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set.");

  const resend = new Resend(apiKey);

  // Prefer opts.from Р  Р’ Р ™Р’ Р  Р’ Р Р†Р љР’ Р  Р’ Р  РІ Р  Р’ Р Р†Р љРЎв„ўР  РІв„ўР ™Р’ Р  Р’ Р  РІ Р  Р’ Р Р†Р љРЎв„ўР  Р  Р Р†Р љРЎєР РЋРЎє EMAIL_FROM Р  Р’ Р ™Р’ Р  Р’ Р Р†Р љР’ Р  Р’ Р  РІ Р  Р’ Р Р†Р љРЎв„ўР  РІв„ўР ™Р’ Р  Р’ Р  РІ Р  Р’ Р Р†Р љРЎв„ўР  Р  Р Р†Р љРЎєР РЋРЎє fallback to Resend's default sender (good for quick tests)
  const fromEnv = process.env.EMAIL_FROM;
  const from = opts.from || fromEnv || "onboarding@resend.dev";

  const resp = await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });

  // Resend returns { error } on failures; surface a clear message
  const anyResp = resp as any;
  if (anyResp?.error) {
    throw new Error(
      `Resend send error: ${JSON.stringify(anyResp.error)} (from=${from})`
    );
  }
  return resp;
}

/** ----------------------
 *  GMAIL (SMTP) IMPLEMENTATION (optional)
 *  ---------------------- */
function createGmailTransporter() {
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = String(process.env.EMAIL_SECURE || "false").toLowerCase() === "true";
  const allowSelfSigned = String(process.env.SMTP_ALLOW_SELF_SIGNED || "false").toLowerCase() === "true";

  const user = (process.env.EMAIL_USER || "").trim();
  const rawPass = process.env.EMAIL_PASS || "";
  const pass = rawPass.replace(/[^a-zA-Z0-9]/g, ""); // app password is 16 alphanumerics

  if (!user || !pass) throw new Error("EMAIL_USER or EMAIL_PASS is missing for Gmail SMTP.");
  if (pass.length !== 16) throw new Error(`EMAIL_PASS must be 16 letters/numbers. Got ${pass.length}.`);

  return nodemailer.createTransport({
    host,
    port,
    secure, // true=465, false=587
    auth: { user, pass },
    tls: allowSelfSigned ? { rejectUnauthorized: false } : undefined, // dev only
    requireTLS: !secure, // enforce STARTTLS on 587
  });
}

async function sendWithGmail(opts: SendOpts) {
  const transporter = createGmailTransporter();
  const from = opts.from || process.env.EMAIL_FROM || process.env.EMAIL_USER;
  if (!from) throw new Error("EMAIL_FROM is not set for Gmail.");
  return transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}

/** ----------------------
 *  PUBLIC API
 *  ---------------------- */
export async function sendMail(opts: SendOpts) {
  if (MAIL_PROVIDER === "gmail") return await sendWithGmail(opts);
  return await sendWithResend(opts); // default to Resend
}

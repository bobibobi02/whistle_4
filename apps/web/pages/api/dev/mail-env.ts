// pages/api/dev/mail-env.ts
import type { NextApiRequest, NextApiResponse } from "next";

function mask(v?: string | null, keep = 6) {
  if (!v) return "(missing)";
  const s = String(v);
  if (s.length <= keep) return "*".repeat(s.length);
  return "*".repeat(Math.max(0, s.length - keep)) + s.slice(-keep);
}

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const provider = (process.env.MAIL_PROVIDER || "resend").toLowerCase();
  const key = process.env.RESEND_API_KEY || "";
  const from = process.env.EMAIL_FROM || "";
  const isDev = process.env.NODE_ENV !== "production";
  const debug = String(process.env.SHOW_SMTP_DEBUG || "false").toLowerCase() === "true";

  res.json({
    ok: true,
    env: isDev ? "development" : "production",
    provider,
    SHOW_SMTP_DEBUG: debug,
    EMAIL_FROM_present: !!from,
    EMAIL_FROM_value: isDev ? from : "[hidden]",
    RESEND_API_KEY_present: !!key,
    RESEND_API_KEY_masked: mask(key, 6),
    notes: [
      "MAIL_PROVIDER should be 'resend' (recommended).",
      "RESEND_API_KEY must be a valid key starting with 're_'.",
      "EMAIL_FROM must be a verified sender/domain in Resend.",
    ],
  });
}

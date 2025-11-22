// pages/api/dev/send-test.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { sendMail } from "../../../lib/mailer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const to = (req.query.to as string) || process.env.EMAIL_FROM || "";
    if (!to) return res.status(400).json({ ok: false, error: "Set ?to=you@example.com or EMAIL_FROM" });

    const html = `<p>Hello from <b>Whistle</b>. If you see this email, your mail provider is configured correctly.</p>`;
    const info = await sendMail({ to, subject: "Whistle test email", html, text: "Whistle test email" });
    return res.json({ ok: true, info });
  } catch (err: any) {
    return res.status(200).json({ ok: false, error: err?.message || String(err) });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';

type Result =
  | { ok: true; message: string; info: { host?: string; port?: number; secure?: boolean } }
  | { ok: false; error: string; detail?: string };

function buildConfigFromEnv(): { cfg?: any; error?: string } {
  const serverRaw0 = process.env.EMAIL_SERVER?.trim();

  // Discrete vars take precedence
  if (process.env.EMAIL_HOST && process.env.EMAIL_PORT && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const port = Number(process.env.EMAIL_PORT);
    const secure = String(process.env.EMAIL_SECURE || '').toLowerCase() === 'true';
    return {
      cfg: {
        host: process.env.EMAIL_HOST,
        port: isNaN(port) ? 587 : port,
        secure,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      },
    };
  }

  if (!serverRaw0) return { error: 'EMAIL_SERVER or EMAIL_HOST/PORT/USER/PASS not set' };

  let serverRaw = serverRaw0;

  // strip wrapping quotes
  if ((serverRaw.startsWith('"') && serverRaw.endsWith('"')) || (serverRaw.startsWith("'") && serverRaw.endsWith("'"))) {
    serverRaw = serverRaw.slice(1, -1);
  }
  // unescape \" -> "
  serverRaw = serverRaw.replace(/\\"/g, '"');

  const trimmed = serverRaw.trim();
  try {
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return { cfg: JSON.parse(trimmed) };
    }
  } catch {/* not JSON */}
  // treat as SMTP URL
  return { cfg: serverRaw };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Result>) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const from = process.env.EMAIL_FROM;
    if (!from) return res.status(400).json({ ok: false, error: 'EMAIL_FROM not set' });

    const { cfg, error } = buildConfigFromEnv();
    if (error) return res.status(400).json({ ok: false, error });

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport(cfg as any);

    await transporter.verify();
    await transporter.sendMail({
      to: from, // for Mailtrap this goes to the sandbox inbox
      from,
      subject: 'SMTP test from Whistle',
      text: 'This is a test message confirming your SMTP settings work.',
    });

    const meta =
      typeof cfg === 'string'
        ? {}
        : { host: (cfg as any).host, port: (cfg as any).port, secure: !!(cfg as any).secure };

    return res.status(200).json({ ok: true, message: 'Test email sent (check your SMTP inbox)', info: meta });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: 'Send failed', detail: String(e?.message || e) });
  }
}

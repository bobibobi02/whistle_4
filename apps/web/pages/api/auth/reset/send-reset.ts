// pages/api/auth/reset/send-reset.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

type Ok = { ok: true };

async function sendPasswordResetMail(to: string, link: string) {
  const provider = (process.env.MAIL_PROVIDER || 'gmail').toLowerCase();

  if (provider === 'resend') {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY || '');
    const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    try {
      await resend.emails.send({
        from,
        to,
        subject: 'Reset your password',
        html: `
          <div style="font-family:system-ui,Segoe UI,Arial">
            <h2>Reset your password</h2>
            <p>Click the button below to reset your password. The link expires in 30 minutes.</p>
            <p>
              <a href="${link}" style="display:inline-block;padding:10px 16px;border-radius:6px;background:#2563eb;color:#fff;text-decoration:none">
                Reset Password
              </a>
            </p>
            <p>If the button doesnt work, paste this link into your browser:</p>
            <p><a href="${link}">${link}</a></p>
          </div>
        `,
      });
    } catch (e) {
      console.warn('Resend send error:', e);
    }
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT || 587),
    secure: String(process.env.EMAIL_SECURE || 'false') === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls:
      String(process.env.SMTP_ALLOW_SELF_SIGNED || 'false') === 'true'
        ? { rejectUnauthorized: false }
        : undefined,
  });

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || '';
  await transporter.sendMail({
    from,
    to,
    subject: 'Reset your password',
    html: `
      <div style="font-family:system-ui,Segoe UI,Arial">
        <h2>Reset your password</h2>
        <p>Click the button below to reset your password. The link expires in 30 minutes.</p>
        <p>
          <a href="${link}" style="display:inline-block;padding:10px 16px;border-radius:6px;background:#2563eb;color:#fff;text-decoration:none">
            Reset Password
          </a>
        </p>
        <p>If the button doesnt work, paste this link into your browser:</p>
        <p><a href="${link}">${link}</a></p>
      </div>
    `,
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const email = String(req.body?.email || '').trim().toLowerCase();
  const plausible = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  try {
    if (plausible) {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      await prisma.passwordResetToken.deleteMany({
        where: { email, createdAt: { lt: fiveMinAgo } },
      });

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      try {
        await prisma.passwordResetToken.create({
          data: { email, token, expiresAt },
        });

        const base =
          process.env.APP_BASE_URL ||
          process.env.NEXTAUTH_URL ||
          'http://localhost:3000';

        const link = `${base}/reset?token=${encodeURIComponent(token)}&email=${encodeURIComponent(
          email
        )}`;

        await sendPasswordResetMail(email, link);
      } catch (e) {
        console.warn('send-reset warning (create/send):', e);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('send-reset unexpected error:', e);
    return res.status(200).json({ ok: true });
  }
}


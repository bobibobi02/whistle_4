// apps/web/pages/api/auth/reset/confirm.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prismadb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const email = String(req.body?.email || '').trim().toLowerCase();
  const token = String(req.body?.token || '').trim();
  const newPassword = String(req.body?.password || '');

  if (!email || !token || newPassword.length < 8) {
    return res.status(400).json({ ok: false, error: 'Invalid payload' });
  }

  try {
    const record = await prisma.passwordResetToken.findFirst({
      where: { email, token },
    });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ ok: false, error: 'Invalid or expired token' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // IMPORTANT: update `passwordHash`, not `password`
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    // Burn the token
    await prisma.passwordResetToken.deleteMany({ where: { email } }).catch(() => {});

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}

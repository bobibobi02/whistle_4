// apps/web/pages/api/auth/signup.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prismadb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!name || !email || password.length < 8) {
    return res.status(400).json({ ok: false, error: 'Invalid payload' });
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      // DO NOT include `password` in select; field is `passwordHash`
      select: { id: true, name: true, email: true, passwordHash: true },
    });

    const passwordHash = await bcrypt.hash(password, 10);

    if (existing) {
      // If account exists but without password (e.g., OAuth), set one.
      if (!existing.passwordHash) {
        await prisma.user.update({
          where: { email },
          data: { passwordHash }, // <-- fix: use passwordHash, not password
        });
      }
      return res.status(200).json({ ok: true });
    }

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash, // <-- fix: use passwordHash, not password
      },
    });

    return res.status(201).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}

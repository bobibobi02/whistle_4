// apps/web/pages/api/comments/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prismadb';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = String(req.query.id || '');
  if (!id) return res.status(400).json({ ok: false, error: 'id required' });

  if (req.method === 'GET') {
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true  } },
        },
    });
    if (!comment) return res.status(404).json({ ok: false, error: 'Not found' });
    return res.status(200).json({ ok: true, comment });
  }

  if (req.method === 'PUT') {
    const session = (await getServerSession(req, res, authOptions)) as any;
    const email = session?.user?.email as string | undefined;
    if (!email) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const existing = await prisma.comment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ ok: false, error: 'Not found' });
    if (existing.userEmail !== email.toLowerCase())
      return res.status(403).json({ ok: false, error: 'Forbidden' });

    const body = String(req.body?.content ?? req.body?.body ?? '').trim();
    if (!body) return res.status(400).json({ ok: false, error: 'Body required' });

    const updated = await prisma.comment.update({
      where: { id },
      data: { body },
    });
    return res.status(200).json({ ok: true, comment: updated });
  }

  if (req.method === 'DELETE') {
    const session = (await getServerSession(req, res, authOptions)) as any;
    const email = session?.user?.email as string | undefined;
    if (!email) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const existing = await prisma.comment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ ok: false, error: 'Not found' });
    if (existing.userEmail !== email.toLowerCase())
      return res.status(403).json({ ok: false, error: 'Forbidden' });

    await prisma.comment.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}

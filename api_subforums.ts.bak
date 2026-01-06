import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const subforums = await prisma.subforum.findMany({
      orderBy: { name: 'asc' },
    });

    res.status(200).json(subforums);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subforums' });
  }
}

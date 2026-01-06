import type { NextApiRequest, NextApiResponse } from 'next';
import { searchPosts } from '../../lib/meili';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { q, subforum, author, dateFrom, dateTo, limit } = req.query;
  const filters = [];

  if (subforum) filters.push(`subforum = "${subforum}"`);
  if (author) filters.push(`userEmail = "${author}"`);
  if (dateFrom) filters.push(`createdAt >= ${Date.parse(dateFrom as string)}`);
  if (dateTo) filters.push(`createdAt <= ${Date.parse(dateTo as string)}`);

  const result = await searchPosts(
    typeof q === 'string' ? q : '',
    filters.length ? filters.join(' AND ') : undefined,
    typeof limit === 'string' ? parseInt(limit) : undefined
  );
  res.json(result.hits);
}
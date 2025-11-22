import type { NextApiRequest, NextApiResponse } from "next";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // TEMP: comment voting not wired to current schema. Avoid TS/Prisma errors.
  // TODO: implement using your actual model (e.g., `Vote` with { commentId, userEmail, value }).
  if (req.method !== "POST") return res.status(405).end();
  return res.status(200).json({ ok: true });
}

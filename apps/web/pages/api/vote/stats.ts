import type { NextApiRequest, NextApiResponse } from "next";

type StatsBody = {
  postId?: string;
  postIds?: string[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed" });
  }

  let body: StatsBody;
  try {
    body = req.body ?? {};
    if (typeof body === "string") {
      body = JSON.parse(body);
    }
  } catch {
    return res
      .status(400)
      .json({ ok: false, error: "Invalid JSON body" });
  }

  const { postId, postIds } = body;

  // Single post – for now just return 0 safely
  if (postId && typeof postId === "string") {
    return res.status(200).json({ postId, score: 0 });
  }

  // Multiple posts – return an object with all scores = 0
  if (Array.isArray(postIds) && postIds.length > 0) {
    const map: Record<string, { score: number }> = {};
    for (const id of postIds) {
      map[id] = { score: 0 };
    }
    return res.status(200).json(map);
  }

  return res
    .status(400)
    .json({ ok: false, error: "postId or postIds is required" });
}

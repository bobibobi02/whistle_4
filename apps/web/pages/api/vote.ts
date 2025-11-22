import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prismadb";
import { authOptions } from "./auth/[...nextauth]";

type VoteBody = {
  postId?: string;
  value?: number;
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

  let body: VoteBody;
  try {
    body = req.body ?? {};
    if (typeof body === "string") {
      body = JSON.parse(body);
    }
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid JSON body" });
  }

  const { postId, value } = body;

  if (!postId || typeof postId !== "string") {
    return res
      .status(400)
      .json({ ok: false, error: "postId is required" });
  }

  if (typeof value !== "number" || ![-1, 0, 1].includes(value)) {
    return res.status(400).json({
      ok: false,
      error: "value must be -1, 0, or 1",
    });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res
        .status(401)
        .json({ ok: false, error: "Not authenticated" });
    }

    const userEmail = session.user.email;

    // Handle unvote (value === 0) by deleting existing vote if present
    if (value === 0) {
      await prisma.vote.deleteMany({
        where: {
          postId,
          userEmail,
        },
      });
    } else {
      // Upsert vote for this user + post
      await prisma.vote.upsert({
        where: {
          userEmail_postId: {
            userEmail,
            postId,
          },
        },
        update: {
          value,
        },
        create: {
          userEmail,
          postId,
          value,
        },
      });
    }

    // Recompute score for this post
    const votes = await prisma.vote.findMany({
      where: { postId },
      select: { value: true },
    });

    const score = votes.reduce((sum, v) => sum + (v.value || 0), 0);

    return res.status(200).json({
      ok: true,
      postId,
      value,
      score,
    });
  } catch (err) {
    console.error("[api/vote] error", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to record vote" });
  }
}

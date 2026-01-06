import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import { getPostVoteStats, type VoteValue } from "../../../lib/voteStats";

type StatsResponse =
  | {
      upvotes: number;
      downvotes: number;
      userVote: VoteValue;
      success?: boolean;
    }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatsResponse>
) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res
      .status(405)
      .json({ error: `Method ${req.method ?? "UNKNOWN"} Not Allowed` });
  }

  let postId: string | undefined;

  if (req.method === "GET") {
    const q = req.query.postId;
    postId = Array.isArray(q) ? q[0] : q;
  } else {
    postId = req.body?.postId;
  }

  if (!postId || typeof postId !== "string") {
    return res.status(400).json({ error: "postId is required" });
  }

  try {
    const session = await getServerSession(req, res, authOptions).catch(
      () => null
    );

    let userId: string | null = null;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      userId = user?.id ?? null;
    }

    const stats = await getPostVoteStats(postId, userId);

    return res.status(200).json({
      upvotes: stats.upvotes,
      downvotes: stats.downvotes,
      userVote: stats.userVote,
      success: true,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /api/vote/stats:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

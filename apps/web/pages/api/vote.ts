import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "../../lib/prisma";
import { getPostVoteStats, type VoteValue } from "../../lib/voteStats";

type VoteResponse =
  | {
      upvotes: number;
      downvotes: number;
      userVote: VoteValue;
      success?: boolean;
    }
  | { error: string };

function normalizeVoteValue(value: unknown, direction: unknown): VoteValue {
  if (typeof value === "number") {
    if (value > 0) return 1;
    if (value < 0) return -1;
    return 0;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      if (parsed > 0) return 1;
      if (parsed < 0) return -1;
      return 0;
    }
  }

  if (typeof direction === "string") {
    const d = direction.toLowerCase();
    if (d === "up" || d === "upvote") return 1;
    if (d === "down" || d === "downvote") return -1;
    if (d === "clear" || d === "unvote" || d === "neutral") return 0;
  }

  // If we get here, the payload is weird – caller might still expect a response.
  // We'll treat it as "no change" (0) instead of throwing.
  return 0;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VoteResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ error: `Method ${req.method ?? "UNKNOWN"} Not Allowed` });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { postId, value, direction } = req.body ?? {};

    if (!postId || typeof postId !== "string") {
      return res.status(400).json({ error: "postId is required" });
    }

    const numeric: VoteValue = normalizeVoteValue(value, direction);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const existing = await prisma.vote.findFirst({
      where: { userId: user.id, postId },
      select: { id: true, value: true },
    });

    let finalValue: VoteValue = numeric;

    if (!existing) {
      // No existing vote
      if (numeric !== 0) {
        await prisma.vote.create({
          data: {
            userId: user.id,
            userEmail: user.email,
            postId,
            value: numeric,
          },
        });
      } else {
        finalValue = 0;
      }
    } else {
      // Existing vote – toggle logic
      if (numeric === 0 || existing.value === numeric) {
        // Clear vote
        finalValue = 0;
      } else {
        // Switch direction
        finalValue = numeric;
      }

      await prisma.vote.update({
        where: { id: existing.id },
        data: { value: finalValue },
      });
    }

    const stats = await getPostVoteStats(postId, user.id);

    return res.status(200).json({
      upvotes: stats.upvotes,
      downvotes: stats.downvotes,
      userVote: stats.userVote,
      success: true,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /api/vote:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

import { prisma } from "./prisma";

export type VoteValue = -1 | 0 | 1;

export type VoteStats = {
  upvotes: number;
  downvotes: number;
  userVote: VoteValue;
};

export async function getPostVoteStats(
  postId: string,
  userId?: string | null
): Promise<VoteStats> {
  if (!postId) {
    return { upvotes: 0, downvotes: 0, userVote: 0 };
  }

  const [votes, userVote] = await Promise.all([
    prisma.vote.findMany({
      where: { postId },
      select: { value: true },
    }),
    userId
      ? prisma.vote.findFirst({
          where: { postId, userId },
          select: { value: true },
        })
      : Promise.resolve(null),
  ]);

  let upvotes = 0;
  let downvotes = 0;

  for (const v of votes) {
    if (v.value > 0) upvotes++;
    else if (v.value < 0) downvotes++;
  }

  return {
    upvotes,
    downvotes,
    userVote: (userVote?.value ?? 0) as VoteValue,
  };
}

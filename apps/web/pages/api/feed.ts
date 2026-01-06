import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type Sort = "latest" | "popular";

type FeedPost = {
  id: string;
  title: string;
  content: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  loop: {
    id: string;
    name: string;
    slug: string;
  } | null;
  imageUrl: string | null;
  upvotes: number;
  downvotes: number;
  score: number;
  userVote: number;
  commentCount: number;
};

type FeedResponse = {
  posts: FeedPost[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FeedResponse | { error: string }>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  const userEmail = session?.user?.email as string | undefined;

  let currentUserId: string | undefined;
  if (userEmail) {
    const dbUser = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });
    currentUserId = dbUser?.id;
  }

  const sortParam = (req.query.sort as string) || "latest";
  const sort: Sort = sortParam === "popular" ? "popular" : "latest";

  const limitParam = req.query.limit as string | undefined;
  const parsedLimit = parseInt(limitParam ?? "10", 10);
  const limit = Math.min(Math.max(parsedLimit || 10, 1), 50);

  const windowParam = (req.query.window as string) || "7d";

  let since: Date | undefined;
  if (sort === "popular") {
    const now = new Date();
    switch (windowParam) {
      case "24h":
      case "1d":
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "30d":
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "7d":
      default:
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }
  }

  const where: Prisma.PostWhereInput = {};
  if (since) {
    where.createdAt = { gte: since };
  }

  const take = sort === "popular" ? limit * 3 : limit;

  const basePosts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      subforum: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (basePosts.length === 0) {
    return res.status(200).json({ posts: [] });
  }

  const postIds = basePosts.map((p) => p.id);

  // All votes for these posts
  const votes = await prisma.vote.findMany({
    where: { postId: { in: postIds } },
    select: { postId: true, value: true },
  });

  const voteMap = new Map<
    string,
    { upvotes: number; downvotes: number; score: number }
  >();

  for (const v of votes) {
    const record =
      voteMap.get(v.postId) ?? { upvotes: 0, downvotes: 0, score: 0 };
    if (v.value > 0) {
      record.upvotes += 1;
      record.score += 1;
    } else if (v.value < 0) {
      record.downvotes += 1;
      record.score -= 1;
    }
    voteMap.set(v.postId, record);
  }

  // Per-user votes
  const userVoteMap = new Map<string, number>();
  if (currentUserId) {
    const userVotes = await prisma.vote.findMany({
      where: { postId: { in: postIds }, userId: currentUserId },
      select: { postId: true, value: true },
    });
    for (const v of userVotes) {
      userVoteMap.set(v.postId, v.value);
    }
  }

  // Comment counts
  const commentCounts = await prisma.comment.groupBy({
    by: ["postId"],
    where: { postId: { in: postIds } },
    _count: { postId: true },
  });

  const commentCountMap = new Map<string, number>();
  for (const row of commentCounts) {
    commentCountMap.set(row.postId, row._count.postId);
  }

  let postsWithStats: FeedPost[] = basePosts.map((post) => {
    const voteStats =
      voteMap.get(post.id) ?? { upvotes: 0, downvotes: 0, score: 0 };
    const userVote = userVoteMap.get(post.id) ?? 0;
    const comments = commentCountMap.get(post.id) ?? 0;

    const imageUrl = (post as any).imageUrl ?? (post as any).mediaUrl ?? null;

    return {
      id: post.id,
      title: (post as any).title ?? "",
      content: (post as any).content ?? null,
      createdAt: post.createdAt.toISOString(),
      author: post.user
        ? {
            id: post.user.id,
            name: post.user.name,
            image: post.user.image,
          }
        : null,
      loop: post.subforum
        ? {
            id: post.subforum.id,
            name: post.subforum.name,
            slug: post.subforum.name,
          }
        : null,
      imageUrl,
      upvotes: voteStats.upvotes,
      downvotes: voteStats.downvotes,
      score: voteStats.score,
      userVote,
      commentCount: comments,
    };
  });

  if (sort === "popular") {
    postsWithStats = postsWithStats
      .sort((a, b) => {
        if (b.score === a.score) {
          return (
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
          );
        }
        return b.score - a.score;
      })
      .slice(0, limit);
  } else {
    postsWithStats = postsWithStats.slice(0, limit);
  }

  return res.status(200).json({ posts: postsWithStats });
}

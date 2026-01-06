import { prisma } from "@/lib/prisma";

export type UserStats = {
  postKarma: number;
  commentKarma: number;
  postsCount: number;
  commentsCount: number;
};

export type AchievementId =
  | "first_post"
  | "first_comment"
  | "hundred_karma"
  | "whistle_early_supporter";

export type Achievement = {
  id: AchievementId;
  name: string;
  description: string;
};

export type UserAchievement = Achievement & {
  unlocked: boolean;
};

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_post",
    name: "First Whistle",
    description: "Created your first post on Whistle.",
  },
  {
    id: "first_comment",
    name: "First Reply",
    description: "Posted your first comment.",
  },
  {
    id: "hundred_karma",
    name: "100 Karma",
    description: "Reached a total of 100 karma from posts and comments.",
  },
  {
    id: "whistle_early_supporter",
    name: "Early Whistler",
    description: "Joined Whistle in the early days.",
  },
];

export async function getUserStats(userId: string): Promise<UserStats> {
  // Count posts and comments by this user
  const [postsCount, commentsCount] = await Promise.all([
    prisma.post.count({
      where: { userId: userId },
    }),
    prisma.comment.count({
      where: { userId: userId },
    }),
  ]);

  // Gather IDs for karma aggregation
  const [userPosts, userComments] = await Promise.all([
    prisma.post.findMany({
      where: { userId: userId },
      select: { id: true },
    }),
    prisma.comment.findMany({
      where: { userId: userId },
      select: { id: true },
    }),
  ]);

  const postIds = userPosts.map((p) => p.id);
  const commentIds = userComments.map((c) => c.id);

  let postKarma = 0;
  let commentKarma = 0;

  if (postIds.length > 0) {
    const agg = await prisma.vote.aggregate({
      _sum: { value: true },
      where: { postId: { in: postIds } },
    });
    postKarma = agg._sum.value ?? 0;
  }

  if (commentIds.length > 0) {
    const agg = await prisma.commentVote.aggregate({
      _sum: { value: true },
      where: { commentId: { in: commentIds } },
    });
    commentKarma = agg._sum.value ?? 0;
  }

  return {
    postKarma,
    commentKarma,
    postsCount,
    commentsCount,
  };
}

function isAchievementUnlocked(
  achievementId: AchievementId,
  stats: UserStats,
  userCreatedAt?: Date | null,
): boolean {
  const totalKarma = stats.postKarma + stats.commentKarma;

  switch (achievementId) {
    case "first_post":
      return stats.postsCount > 0;
    case "first_comment":
      return stats.commentsCount > 0;
    case "hundred_karma":
      return totalKarma >= 100;
    case "whistle_early_supporter":
      if (!userCreatedAt) return false;
      // For now, treat accounts created before 2025 as "early".
      const cutoff = new Date("2025-01-01T00:00:00.000Z");
      return userCreatedAt < cutoff;
    default:
      return false;
  }
}

export function buildUserAchievements(
  stats: UserStats,
  userCreatedAt?: Date | null,
): UserAchievement[] {
  return ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    unlocked: isAchievementUnlocked(
      achievement.id,
      stats,
      userCreatedAt ?? null,
    ),
  }));
}


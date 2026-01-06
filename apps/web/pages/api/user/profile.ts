import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { getUserStats, buildUserAchievements } from "@/lib/userStats";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = (session.user as any).id as string | undefined;

    if (!userId) {
      return res.status(400).json({ error: "Missing user id in session" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const stats = await getUserStats(user.id);
    const achievements = buildUserAchievements(stats, null);

    return res.status(200).json({
      user,
      stats,
      achievements,
    });
  } catch (error) {
    console.error("Error in /api/user/profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

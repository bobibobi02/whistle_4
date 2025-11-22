import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prismadb";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const postId = String(req.query.postId || "");
  if (!postId) {
    return res.status(400).json({ ok: false, error: "postId required" });
  }

  if (req.method === "GET") {
    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: { user: true },
      });

      if (!post) {
        return res.status(404).json({ ok: false, error: "Post not found" });
      }

      return res.status(200).json(post);
    } catch (err) {
      console.error("[post GET]", err);
      return res
        .status(500)
        .json({ ok: false, error: "Failed to load post" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session?.user?.email) {
        return res
          .status(401)
          .json({ ok: false, error: "Not authenticated" });
      }

      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { id: true, userEmail: true },
      });

      if (!post) {
        return res.status(404).json({ ok: false, error: "Post not found" });
      }

      if (
        !post.userEmail ||
        post.userEmail.toLowerCase() !== session.user.email.toLowerCase()
      ) {
        return res.status(403).json({
          ok: false,
          error: "You are not allowed to delete this post",
        });
      }

      await prisma.post.delete({
        where: { id: postId },
      });

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("[post DELETE]", err);
      return res
        .status(500)
        .json({ ok: false, error: "Failed to delete post" });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}

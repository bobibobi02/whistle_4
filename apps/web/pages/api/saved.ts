import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    const userEmail = (session?.user as any)?.email || null;
    if (!userEmail) return res.status(401).json({ error: "Not authenticated" });

    if (req.method === "GET") {
      const postId = String(req.query.postId || "");
      if (postId) {
        //  your unique is userEmail_postId (not Saved_userEmail_postId)
        const exists = await prisma.saved.findUnique({
          where: { userEmail_postId: { userEmail, postId } },
          select: { id: true },
        });
        return res.status(200).json({ saved: !!exists });
      }
      // list all saved post ids for this user
      const rows = await prisma.saved.findMany({
        where: { userEmail },
        select: { postId: true },
      });
      return res.status(200).json({ savedPostIds: rows.map(r => r.postId) });
    }

    if (req.method === "POST") {
      const { postId } = req.body as { postId?: string };
      if (!postId) return res.status(400).json({ error: "postId required" });

      const exists = await prisma.saved.findUnique({
        where: { userEmail_postId: { userEmail, postId } },
        select: { id: true },
      });

      if (exists) {
        await prisma.saved.delete({ where: { userEmail_postId: { userEmail, postId } } });
        return res.status(200).json({ saved: false });
      }

      // Create using your columns; Prisma will set FKs to User/Post by fields
      await prisma.saved.create({ data: { userEmail, postId } });
      return res.status(201).json({ saved: true });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e: any) {
    console.error("saved API error:", e);
    return res.status(500).json({ error: e?.message || "Internal Server Error" });
  }
}


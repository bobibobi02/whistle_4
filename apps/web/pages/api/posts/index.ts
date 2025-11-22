import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  // =============== POST: create post ===============
  if (req.method === "POST") {
    if (!session?.user?.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const {
        title,
        content,
        body,
        subforumName,
        imageUrl,
        imageUrls,
        mediaUrl,
      } = req.body || {};

      const textBody = (body ?? content ?? "").toString();
      const cleanTitle = (title ?? "").toString();

      if (!cleanTitle && !textBody) {
        return res.status(400).json({ error: "Title or body is required" });
      }

      // ----- normalize loop / subforum name -----
      const rawLoop = (subforumName ?? "").toString().trim();
      const loopName = rawLoop || "general";

      // ----- normalize images -----
      const normalizedImages: string[] = Array.isArray(imageUrls)
        ? imageUrls.filter((u) => !!u && typeof u === "string")
        : [];

      if (!normalizedImages.length && typeof imageUrl === "string" && imageUrl) {
        normalizedImages.push(imageUrl);
      }

      const mainMediaUrl =
        (typeof mediaUrl === "string" && mediaUrl) ||
        (typeof imageUrl === "string" && imageUrl) ||
        (normalizedImages[0] ?? null);

      const createData: any = {
        title: cleanTitle,
        body: textBody,
        mediaUrl: mainMediaUrl,
        imageUrls: normalizedImages,
        user: {
          connect: {
            email: session.user.email!,
          },
        },
        // IMPORTANT: subforum is REQUIRED by Prisma, so always provide it
        subforum: {
          connectOrCreate: {
            where: {
              // assumes `name` is unique on Subforum
              name: loopName,
            },
            create: {
              name: loopName,
              title: loopName, // <-- REQUIRED FIELD FIX
              description:
                loopName === "general"
                  ? "Default Whistle loop"
                  : `Loop: ${loopName}`,
            },
          },
        },
      };

      const post = await prisma.post.create({
        data: createData,
        include: { user: true },
      });

      return res.status(201).json(post);
    } catch (error: any) {
      console.error("POST /api/posts error", error);
      return res.status(500).json({ error: "Failed to create post" });
    }
  }

  // =============== GET: single post or feed ===============
  if (req.method === "GET") {
    try {
      const { id, limit, sort } = req.query;

      // ----- single post by id -----
      if (typeof id === "string" && id.length > 0) {
        const post = await prisma.post.findUnique({
          where: { id },
          include: { user: true },
        });

        if (!post) {
          return res.status(404).json({ error: "Post not found" });
        }

        return res.status(200).json(post);
      }

      // ----- feed listing -----
      const take =
        typeof limit === "string" && !Number.isNaN(Number(limit))
          ? Math.min(parseInt(limit, 10), 50)
          : 20;

      const orderBy =
        sort === "old"
          ? { createdAt: "asc" as const }
          : { createdAt: "desc" as const };

      const posts = await prisma.post.findMany({
        take,
        orderBy,
        include: { user: true },
      });

      return res.status(200).json(posts);
    } catch (error: any) {
      console.error("GET /api/posts error", error);
      return res.status(500).json({ error: "Failed to fetch posts" });
    }
  }

  res.setHeader("Allow", "GET,POST");
  return res.status(405).json({ error: "Method not allowed" });
}

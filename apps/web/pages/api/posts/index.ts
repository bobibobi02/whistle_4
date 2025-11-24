// AUTO-REPLACED by PowerShell full-fix block (Whistle)
// Posts API: supports create + feed + filters + back-compat body->content
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseNumber(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseWindow(windowStr: string | undefined) {
  if (!windowStr || windowStr === "all") return undefined;
  const now = new Date();
  if (windowStr.endsWith("d")) {
    const days = parseInt(windowStr.replace("d", ""), 10);
    if (Number.isFinite(days) && days > 0) {
      return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }
  }
  return undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  // =============== POST: create post ===============
  if (req.method === "POST") {
    try {
      if (!session?.user?.email) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});

      const title = (body.title ?? "").toString().trim();

      // Back-compat: UI may send `body`; schema uses `content`
      const incomingContent = body.content ?? body.body ?? "";
      const content =
        incomingContent == null ? "" : incomingContent.toString();

      const loopNameRaw =
        body.loopName ??
        body.loop ??
        body.subforumName ??
        body.subforum ??
        "general";
      const loopName = loopNameRaw.toString().trim() || "general";

      const mediaUrl =
        body.mediaUrl != null ? body.mediaUrl.toString() : null;

      const imageUrls: string[] = Array.isArray(body.imageUrls)
        ? body.imageUrls.filter(Boolean).map((x: any) => x.toString())
        : mediaUrl
        ? [mediaUrl]
        : [];

      if (!title) {
        res.status(400).json({ error: "Title is required" });
        return;
      }

      const createData: any = {
        title,
        content,
        mediaUrl: mediaUrl || (imageUrls[0] ?? null),
        imageUrls,
        subforum: {
          connectOrCreate: {
            where: { name: loopName }, // Subforum.name is unique
            create: {
              name: loopName,
              title: loopName,
              description:
                loopName === "general"
                  ? "Default Whistle loop"
                  : `Loop: ${loopName}`,
            },
          },
        },
      };

      // EXTRA safety for any old payloads
      if (createData.body != null && createData.content == null) {
        createData.content = createData.body;
      }
      delete createData.body;
      delete createData.userId;

      // Ensure DB user exists for this session (Neon may not have User row yet)
      const sessionEmail = (session?.user as any)?.email;
      if (sessionEmail) {
        const dbUser = await prisma.user.upsert({
          where: { email: sessionEmail },
          update: {},
          create: {
            email: sessionEmail,
            name: (session?.user as any)?.name ?? null,
            image: (session?.user as any)?.image ?? null,
          },
        });

        // connect relation, do NOT set userId scalar
        createData.user = { connect: { id: dbUser.id } };

        // denormalized fields (your schema has these as optional)
        createData.userEmail = sessionEmail;
        createData.userName =
          dbUser.name ?? (session?.user as any)?.name ?? null;
      }

      const post = await prisma.post.create({
        data: createData,
        include: {
          user: true,
          subforum: true,
          _count: { select: { comments: true, votes: true, saved: true } },
        },
      });

      res.status(201).json(post);
      return;
    } catch (err: any) {
      console.error("POST /api/posts error", err);
      res.status(500).json({ error: err?.message ?? "Create post failed" });
      return;
    }
  }

  // =============== GET: list / single post ===============
  if (req.method === "GET") {
    try {
      const {
        id,
        ids,
        sort = "popular",
        limit = "12",
        window = "7d",
        user,
        loop,
        subforum,
        // allow cache-buster param without using it
        t,
      } = req.query as Record<string, string | undefined>;

      // fetch single post by id
      if (id) {
        const post = await prisma.post.findUnique({
          where: { id },
          include: {
            user: true,
            subforum: true,
            votes: true,
            saved: true,
            _count: { select: { comments: true, votes: true, saved: true } },
          },
        });

        if (!post) {
          res.status(404).json({ error: "Post not found" });
          return;
        }

        res.status(200).json(post);
        return;
      }

      const where: any = {};

      // ids=a,b,c (saved posts list)
      if (ids) {
        const list = ids
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (list.length) where.id = { in: list };
      }

      // user=me or user=email
      if (user) {
        if (user === "me") {
          const email = (session?.user as any)?.email ?? null;
          if (!email) {
            res.status(401).json({ error: "Not authenticated" });
            return;
          }
          where.userEmail = email;
        } else {
          where.userEmail = user;
        }
      }

      const loopName = (loop ?? subforum)?.toString().trim();
      if (loopName) {
        where.subforum = { name: loopName };
      }

      const since = parseWindow(window);
      if (since) where.createdAt = { gte: since };

      const take = parseNumber(limit, 12);

      const orderBy =
        sort === "new"
          ? [{ createdAt: "desc" as const }]
          : sort === "old"
          ? [{ createdAt: "asc" as const }]
          : [
              { votes: { _count: "desc" as const } },
              { createdAt: "desc" as const },
            ];

      const posts = await prisma.post.findMany({
        where,
        take,
        orderBy,
        include: {
          user: true,
          subforum: true,
          _count: { select: { comments: true, votes: true, saved: true } },
        },
      });

      res.status(200).json(posts);
      return;
    } catch (err: any) {
      console.error("GET /api/posts error", err);
      res.status(500).json({ error: err?.message ?? "Fetch posts failed" });
      return;
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).json({ error: "Method not allowed" });
}
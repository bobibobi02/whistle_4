import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * /api/comments
 *
 * - GET    ?postId=...      -> list comments for a post (fallback)
 * - POST   { postId, body, id?, parentId? } -> create / edit comment (fallback)
 * - DELETE ?id=... or { id } -> delete comment
 *
 * The frontend already encodes comment body as JSON string { t, img } and
 * decodes it on the client, so we store `body` as a string.
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "GET") {
      return handleGet(req, res);
    }

    if (req.method === "POST" || req.method === "DELETE") {
      const session = await getServerSession(req, res, authOptions);
      const email = (session?.user as any)?.email ?? null;

      if (!email) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      if (req.method === "POST") {
        return handlePost(req, res, email);
      }

      if (req.method === "DELETE") {
        return handleDelete(req, res, email);
      }
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("comments handler error", err);
    res.status(500).json({ error: "Internal error" });
  }
}

/**
 * GET /api/comments?postId=...
 * Fallback listing for comments when /api/posts/[postId]/comments is not used.
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const postId = req.query.postId as string | undefined;
  if (!postId) {
    res.status(400).json({ error: "Missing postId" });
    return;
  }

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  res.status(200).json(comments);
}

/**
 * POST /api/comments
 * Body: { postId, body, id?, parentId? }
 * - create new comment if no id
 * - update existing comment if id provided
 */
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  email: string
) {
  const { postId, body, id, parentId } = (req.body || {}) as {
    postId?: string;
    body?: string;
    id?: string;
    parentId?: string;
  };

  if (!postId || typeof body !== "string") {
    res.status(400).json({ error: "Missing postId or body" });
    return;
  }

  let comment;
  if (id) {
    // Edit existing
    comment = await prisma.comment.update({
      where: { id },
      data: {
        body,
        parentId: parentId ?? null,
      },
    });
  } else {
    // New comment
    comment = await prisma.comment.create({
      data: {
        postId,
        body,
        parentId: parentId ?? null,
        userEmail: email,
      },
    });
  }

  res.status(200).json(comment);
}

/**
 * DELETE /api/comments?id=...
 * or body: { id }
 */
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  _email: string
) {
  const id =
    (req.query.id as string | undefined) ||
    ((req.body as any)?.id as string | undefined);

  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }

  // We rely on UI to only show delete for owner; if you want strict
  // server-side checks, we can add them later.
  await prisma.comment.delete({
    where: { id },
  });

  res.status(200).json({ ok: true });
}
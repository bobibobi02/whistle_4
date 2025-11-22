import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

import prisma from "@/lib/prismadb";
import { authOptions } from "../../auth/[...nextauth]";

type CommentPayload = {
  id?: string;
  body?: string;
  parentId?: string | null;
};

// Safely try to parse comment body as JSON { t?: string; img?: string }
function parseBodyJson(
  raw: string | null | undefined
): null | { t?: string; img?: string } {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object") {
      return obj as { t?: string; img?: string };
    }
  } catch {
    // not JSON – ignore
  }
  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const postId = String(req.query.postId || "");
  if (!postId) {
    return res.status(400).json({ error: "Missing postId" });
  }

  if (req.method === "GET") {
    try {
      const comments = await prisma.comment.findMany({
        where: { postId },
        orderBy: { createdAt: "asc" },
        include: { user: true },
      });

      return res.status(200).json(comments);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("GET /api/posts/[postId]/comments error:", e);
      return res.status(500).json({ error: "Failed to fetch comments" });
    }
  }

  if (req.method === "POST") {
    return handlePost(req, res, postId);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  postId: string
) {
  const session = await getServerSession(req, res, authOptions);
  const userEmail = session?.user?.email || null;

  if (!session || !userEmail) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { id, body, parentId }: CommentPayload =
    (req.body || {}) as CommentPayload;

  const bodyRaw = (body ?? "").toString();
  const bodyTrimmed = bodyRaw.trim();

  // ----- CREATE -----
  if (!id) {
    if (!bodyTrimmed) {
      return res
        .status(400)
        .json({ error: "Comment body is required" });
    }

    try {
      const created = await prisma.comment.create({
        data: {
          postId,
          userEmail,
          parentId: parentId || null,
          body: bodyRaw,
        },
        include: { user: true },
      });

      return res.status(201).json({ ok: true, comment: created });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("CREATE comment error:", e);
      return res.status(500).json({ error: "Failed to create comment" });
    }
  }

  // ----- EDIT -----
  try {
    const existing = await prisma.comment.findUnique({
      where: { id },
    });

    if (!existing || existing.postId !== postId) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (existing.userEmail !== userEmail) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const existingBody = existing.body ?? "";
    const existingObj = parseBodyJson(existingBody);
    const newObj = parseBodyJson(bodyRaw);

    let finalBody: string;

    if (newObj) {
      // If new body JSON has NO img but old one does, keep old image
      const mergedImg = newObj.img ?? existingObj?.img;

      if (mergedImg) {
        const textPart =
          typeof newObj.t === "string"
            ? newObj.t
            : bodyTrimmed || existingObj?.t || "";
        finalBody = JSON.stringify({
          t: textPart,
          img: mergedImg,
        });
      } else {
        // No image in new or old -> just use what client sent
        finalBody = bodyRaw;
      }
    } else if (existingObj?.img) {
      // Old body had image JSON, new body is plain text -> keep image
      const newText = bodyTrimmed || existingObj.t || "";
      finalBody = JSON.stringify({
        t: newText,
        img: existingObj.img,
      });
    } else {
      // Plain text before and after
      finalBody = bodyRaw;
    }

    if (!finalBody.trim()) {
      return res
        .status(400)
        .json({ error: "Comment cannot be empty after edit" });
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: {
        body: finalBody,
      },
      include: { user: true },
    });

    return res.status(200).json({ ok: true, comment: updated });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("UPDATE comment error:", e);
    return res.status(500).json({ error: "Failed to update comment" });
  }
}

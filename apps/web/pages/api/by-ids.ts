// apps/web/pages/api/by-ids.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const g = globalThis as any;
const prisma: PrismaClient =
  g.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
if (process.env.NODE_ENV !== "production") g.prisma = prisma;

type Ok = { posts: any[] };
type Err = { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const idsParam = String(req.query.ids ?? "").trim();
  if (!idsParam) return res.status(400).json({ error: "Missing ?ids=<comma-separated-ids>" });

  const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
  if (!ids.length) return res.status(400).json({ error: "No valid IDs provided" });

  try {
    const posts = await prisma.post.findMany({
      where: { id: { in: ids } },
      include: {
        _count: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({ posts });
  } catch (e) {
    console.error("by-ids error:", e);
    return res.status(500).json({ error: "Failed to fetch posts" });
  }
}

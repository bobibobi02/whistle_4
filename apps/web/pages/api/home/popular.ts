/* apps/web/pages/api/home/popular.ts
 *
 * Returns a "popular posts" feed for a given time window.
 * Score heuristic: score = votes*2 + comments
 *
 * Notes:
 * - Uses Post.body (NOT Post.content).
 * - Selects Post.imageUrls when present. If the column is missing
 *   (older DBs), it falls back to [] without crashing.
 * - Only allows GET.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// Parse a simple "window" like "7d", "24h", with a default of 7 days.
function parseWindow(input: string | string[] | undefined): number {
  const raw = Array.isArray(input) ? input[0] : input;
  if (!raw) return 7 * 24 * 60 * 60 * 1000; // 7 days in ms

  const m = String(raw).trim().match(/^(\d+)\s*(d|h)$/i);
  if (!m) return 7 * 24 * 60 * 60 * 1000;

  const value = Number(m[1]);
  const unit = m[2].toLowerCase();
  if (Number.isNaN(value) || value <= 0) return 7 * 24 * 60 * 60 * 1000;

  return unit === "h" ? value * 60 * 60 * 1000 : value * 24 * 60 * 60 * 1000;
}

function isMissingColumn(e: unknown, table: string, column: string) {
  // P2022 => "The column `main.<Table>.<column>` does not exist"
  return (
    typeof e === "object" &&
    e !== null &&
    (e as any).code === "P2022" &&
    String((e as any).meta?.column || "").endsWith(`${table}.${column}`)
  );
}

type PopularPost = {
  id: string;
  title: string;
  body: string;
  mediaUrl: string | null;
  userEmail: string;
  subforumName: string | null;
  createdAt: string;
  updatedAt: string;
  imageUrls: string[];
  likesCount: number;
  commentsCount: number;
  counts: {
    comments: number;
    votes: number;
  };
  score: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    // Keep method guard consistent across the app
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const limit = Math.max(1, Math.min(50, Number(req.query.limit ?? 12)));
  const windowMs = parseWindow(req.query.window);
  const windowDate = new Date(Date.now() - windowMs);

  const where = {
    createdAt: { gte: windowDate },
  };

  // Base select with Post.body (not content)
  const baseSelect = {
    id: true,
    title: true,
    body: true,
    mediaUrl: true,
    userEmail: true,
    subforumName: true,
    createdAt: true,
    updatedAt: true,
    _count: {
      select: {
        comments: true,
        votes: true,
      },
    },
  } as const;

  // Try with imageUrls selected. If column doesn't exist, retry without it.
  let rows: Array<{
    id: string;
    title: string;
    body: string;
    mediaUrl: string | null;
    userEmail: string;
    subforumName: string | null;
    createdAt: Date;
    updatedAt: Date;
    imageUrls?: unknown;
    _count: { comments: number; votes: number };
  }> = [];

  try {
    rows = await prisma.post.findMany({
      where,
      orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }],
      take: 500, // pull a decent pool, then score + slice
      select: { ...baseSelect, imageUrls: true },
    });
  } catch (e) {
    if (isMissingColumn(e, "Post", "imageUrls")) {
      console.warn(
        "[Whistle] Warning: Post.imageUrls column is missing in the connected DB. " +
          "Falling back to imageUrls: []. Verify DATABASE_URL points to the DB you migrated."
      );
      rows = await prisma.post.findMany({
        where,
        orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }],
        take: 500,
        select: baseSelect,
      });
    } else {
      console.error("/api/home/popular unexpected error:", e);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // Score, sort, and slice.
  const scored: PopularPost[] = rows.map((r) => {
    const comments = r._count.comments ?? 0;
    const votes = r._count.votes ?? 0;
    const score = votes * 2 + comments;

    let imageUrls: string[] = [];
    // We expect imageUrls as JSON array (TEXT in SQLite). Be defensive.
    if (
      typeof (r as any).imageUrls !== "undefined" &&
      (r as any).imageUrls !== null
    ) {
      try {
        const val = (r as any).imageUrls;
        if (Array.isArray(val)) {
          imageUrls = val as string[];
        } else if (typeof val === "string") {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) imageUrls = parsed as string[];
        }
      } catch {
        imageUrls = [];
      }
    }

    return {
      id: r.id,
      title: r.title,
      body: r.body,
      mediaUrl: r.mediaUrl,
      userEmail: r.userEmail,
      subforumName: r.subforumName,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      imageUrls,
      likesCount: votes,
      commentsCount: comments,
      counts: { comments, votes },
      score,
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const da = new Date(a.createdAt).getTime();
    const db = new Date(b.createdAt).getTime();
    if (db !== da) return db - da;
    return b.id.localeCompare(a.id);
  });

  const data = scored.slice(0, limit);

  return res.status(200).json({
    limit,
    windowMs,
    count: data.length,
    posts: data,
  });
}
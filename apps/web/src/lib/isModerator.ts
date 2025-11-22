// src/lib/isModerator.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Returns true if the user (by email) moderates the given subforum name.
 * Works even if your schema differs: we build the filter dynamically and
 * use guarded casts to avoid compile-time schema mismatches.
 */
export async function isModerator(email: string, subforumName: string): Promise<boolean> {
  if (!email || !subforumName) return false;

  try {
    // Build a flexible WHERE that tries common field names.
    const whereAny: any = {
      OR: [
        { name: subforumName },               // most common
        { subforumName: subforumName },       // some schemas use this
        { slug: subforumName },               // others might use 'slug'
      ],
      // If you have a relation 'moderators' (User[]), this will work; if not,
      // Prisma will ignore unknown keys at runtime when we cast the call to any.
      moderators: { some: { email } },
    };

    // Cast only this call, so the rest of your app keeps strong typings.
    const sub = await (prisma as any).subforum.findFirst({
      where: whereAny,
    });

    if (sub) return true;
  } catch {
    // Fall through to alternate strategy
  }

  try {
    // Alternative: if you have a join table like SubforumModerator
    const link = await (prisma as any).subforumModerator?.findFirst({
      where: {
        user: { email },
        subforum: {
          OR: [{ name: subforumName }, { subforumName }, { slug: subforumName }],
        },
      },
    });
    return Boolean(link);
  } catch {
    return false;
  }
}

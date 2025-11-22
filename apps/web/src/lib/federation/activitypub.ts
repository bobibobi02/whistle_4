// src/lib/federation/activitypub.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function recordFollow(followerEmail: string, followingEmail: string) {
  try {
    // If Follow model exists, this will work; otherwise we just no-op.
    // @ts-ignore  guarded access to optional model
    if (prisma.follow?.create) {
      // @ts-ignore
      await prisma.follow.create({
        data: { followerEmail, followingEmail },
      });
    }
  } catch {
    // swallow if model not present
  }
}


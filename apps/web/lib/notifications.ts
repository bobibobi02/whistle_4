import { prisma } from "./prisma";

export type NotificationType = "COMMENT" | "REPLY" | "UPVOTE" | "MENTION";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  message: string;
  postId?: string;
  fromUserId?: string;
}

// Generic helper – do not notify yourself
export async function createNotification({
  userId,
  type,
  message,
  postId,
  fromUserId,
}: CreateNotificationParams) {
  if (!userId || userId === fromUserId) return null;

  return prisma.notification.create({
    data: {
      userId,
      type,
      message,
      postId,
      fromUserId,
    },
  });
}

// Notify post author when someone comments
export async function notifyPostAuthorOfComment(
  postId: string,
  commenterUserId: string,
  commenterName: string
) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true, title: true },
  });

  if (!post?.userId || post.userId === commenterUserId) return;

  await createNotification({
    userId: post.userId,
    type: "COMMENT",
    message: `${commenterName} commented on your post "${(post.title ?? "").slice(
      0,
      30
    )}..."`,
    postId,
    fromUserId: commenterUserId,
  });
}

// Notify parent comment author when someone replies
export async function notifyParentCommentAuthor(
  parentCommentId: string,
  replierUserId: string,
  replierName: string,
  postId: string
) {
  const parent = await prisma.comment.findUnique({
    where: { id: parentCommentId },
    select: { userId: true },
  });

  if (!parent?.userId || parent.userId === replierUserId) return;

  await createNotification({
    userId: parent.userId,
    type: "REPLY",
    message: `${replierName} replied to your comment`,
    postId,
    fromUserId: replierUserId,
  });
}

// Notify post author on upvote (only on upvotes, not downvotes)
export async function notifyPostAuthorOfVote(
  postId: string,
  voterUserId: string,
  voterName: string,
  isUpvote: boolean
) {
  if (!isUpvote) return;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true, title: true },
  });

  if (!post?.userId || post.userId === voterUserId) return;

  await createNotification({
    userId: post.userId,
    type: "UPVOTE",
    message: `${voterName} upvoted your post "${(post.title ?? "").slice(
      0,
      30
    )}..."`,
    postId,
    fromUserId: voterUserId,
  });
}

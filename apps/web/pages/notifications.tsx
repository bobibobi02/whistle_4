// pages/notifications.tsx
import Head from "next/head";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";

const prisma = new PrismaClient();

type Notif = {
  id: string;
  type?: string | null;
  message: string;
  createdAt?: string | Date | null;
  postId?: string | null;
  read?: boolean | null;
};

type PageProps = {
  notifications: Notif[];
  userEmail: string;
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const session: any = await getServerSession(ctx.req, ctx.res, authOptions as any);
  const email: string | null = session?.user?.email?.toLowerCase?.() ?? null;

  if (!email) {
    return {
      redirect: { destination: "/api/auth/signin?callbackUrl=/notifications", permanent: false },
    };
  }

  let notifications: Notif[] = [];

  // Try to use a Notification model if it exists; otherwise, fall back to empty.
  try {
    // If your schema has `model Notification`, uncomment/adjust the fields you actually have.
    // The @ts-ignore suppresses the type error when the model doesn't exist in generated types.
    // @ts-ignore
    const rows = await prisma.notification.findMany({
      // Adjust to your schema  this assumes a user relation by email
      where: { user: { email } },
      orderBy: { createdAt: "desc" },
      include: { post: true }, // remove if your model doesn't have this relation
    });

    notifications = rows.map((n: any) => ({
      id: String(n.id ?? ""),
      type: n.type ?? null,
      message:
        n.message ??
        (n.type === "comment"
          ? "Someone commented on your post."
          : n.type === "vote"
          ? "Your post received a new vote."
          : "You have a new notification."),
      createdAt: n.createdAt ?? null,
      postId: n.postId ?? null,
      read: Boolean(n.read),
    }));

    // Mark unread as read (best effort)
    // @ts-ignore
    await prisma.notification.updateMany({
      where: { user: { email }, read: false },
      data: { read: true },
    });
  } catch {
    // No Notification model in schema (or shape differs)  continue with empty list
    notifications = [];
  }

  return {
    props: {
      notifications: JSON.parse(JSON.stringify(notifications)),
      userEmail: email,
    },
  };
};

function timeAgo(isoish?: string | Date | null) {
  if (!isoish) return "";
  const t = new Date(isoish).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.floor((Date.now() - t) / 1000);
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.345, "week"],
    [12, "month"],
  ];
  let v = s;
  let u: Intl.RelativeTimeFormatUnit = "second";
  for (const [step, unit] of steps) {
    if (v < step) break;
    v = Math.floor(v / step);
    u = unit;
  }
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(-v, u);
}

export default function Notifications({ notifications, userEmail }: PageProps) {
  return (
    <>
      <Head>
        <title>Notifications  Whistle</title>
      </Head>

      <main className="container max-w-2xl mx-auto py-6">
        <h1 className="text-2xl font-semibold mb-4">Notifications</h1>
        <p className="text-sm text-gray-600 mb-6">
          Signed in as <span className="font-medium">{userEmail}</span>
        </p>

        {!notifications?.length ? (
          <div className="rounded border p-4 bg-white">
            <p>You have no notifications.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {notifications.map((n) => (
              <li key={n.id} className="rounded border p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {n.message || "You have a new notification."}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {n.postId ? (
                    <Link
                      href={`/post/${encodeURIComponent(n.postId)}`}
                      className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
                    >
                      View
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}


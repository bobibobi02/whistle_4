// apps/web/pages/saved.tsx
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

// ---- Prisma singleton (safe in Next dev)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
// ----

type AnyPost = Record<string, any>;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  // Cast to any so TS doesn't block on unknown session shape
  const session: any = await getServerSession(ctx.req, ctx.res, authOptions as any);
  const email: string | null = session?.user?.email?.toLowerCase?.() || null;

  if (!email) {
    return {
      redirect: { destination: "/api/auth/signin?callbackUrl=/saved", permanent: false },
    };
  }

  // Get saved post IDs for this user (schema uses userEmail)
  const saves = await prisma.saved.findMany({
    where: { userEmail: email },
    select: { postId: true },
    orderBy: { createdAt: "desc" },
  });

  const postIds = saves.map((s) => s.postId);
  const posts = postIds.length
    ? await prisma.post.findMany({
        where: { id: { in: postIds } },
        include: { user: true, votes: true, comments: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return {
    props: {
      posts: JSON.parse(JSON.stringify(posts)),
      userName: (session?.user?.name as string) ?? "",
    },
  };
};

function timeAgo(when?: string | Date | null) {
  if (!when) return "";
  const t = new Date(when).getTime();
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

export default function SavedPage({
  posts,
  userName,
}: {
  posts: AnyPost[];
  userName: string;
}) {
  const prettyName =
    userName?.trim() || (posts[0]?.user?.email ? posts[0].user.email.split("@")[0] : "Your");

  const getLikes = (p: AnyPost) =>
    typeof p.likesCount === "number"
      ? p.likesCount
      : typeof p.likes === "number"
      ? p.likes
      : Array.isArray(p.votes)
      ? p.votes.filter((v: any) => v?.value > 0).length
      : 0;

  const getComments = (p: AnyPost) =>
    typeof p.commentsCount === "number"
      ? p.commentsCount
      : Array.isArray(p.comments)
      ? p.comments.length
      : 0;

  return (
    <>
      <Head>
        <title>Whistle  Saved Posts</title>
      </Head>

      <main className="feed-wrap">
        <h1 style={{ margin: "8px 0 14px" }}>{prettyName}&apos;s Saved Posts</h1>

        {!posts?.length ? (
          <p>You have no saved posts yet.</p>
        ) : (
          <ul className="feed-list">
            {posts.map((p) => (
              <li key={p.id}>
                <article className="post-card">
                  <div className="post-head">
                    <span className="post-avatar">
                      <img
                        src="/icons/whistle-glow-512.png"
                        alt=""
                        width={24}
                        height={24}
                        style={{ width: 24, height: 24, objectFit: "contain" }}
                      />
                    </span>
                    <span className="post-user">
                      {p.user?.name ||
                        p.user?.email?.split?.("@")?.[0] ||
                        "user"}
                    </span>
                    <span className="post-time"> {timeAgo(p.createdAt)}</span>
                  </div>

                  {p.title ? (
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{p.title}</div>
                  ) : null}

                  <div className="post-content">{p.content}</div>

                  {p.mediaUrl ? (
                    <img
                      src={p.mediaUrl}
                      alt=""
                      style={{ width: "100%", height: "auto", borderRadius: 12, marginBottom: 12 }}
                    />
                  ) : null}

                  <div className="post-meta">
                    <span className="meta-pill" title="Likes">
                       <strong>{getLikes(p)}</strong>
                    </span>
                    <span className="meta-pill" title="Comments">
                       <strong>{getComments(p)}</strong>
                    </span>
                    <Link href={`/post/${p.id}`} className="view-link">
                      View post  
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}


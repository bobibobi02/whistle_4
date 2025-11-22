import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

type User = {
  email: string;
  name?: string | null;
};

type Post = {
  id: string;
  title: string;
  body?: string | null;
  content?: string | null;
  text?: string | null;
  imageUrls?: string[] | null;
  imageUrl?: string | null;
  image?: string | null;
  mediaUrl?: string | null;
  createdAt: string;
  user?: User | null;
};

const getAllImages = (post: Post): string[] => {
  const urls = new Set<string>();
  if (Array.isArray(post.imageUrls)) {
    for (const u of post.imageUrls) {
      if (u) urls.add(u);
    }
  }
  if (post.mediaUrl) urls.add(post.mediaUrl);
  if (post.imageUrl) urls.add(post.imageUrl);
  const anyPost = post as any;
  if (typeof anyPost.image === "string" && anyPost.image) {
    urls.add(anyPost.image);
  }
  return Array.from(urls);
};

async function sendVote(postId: string, value: number): Promise<boolean> {
  try {
    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ postId, value }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const FeedPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/posts?sort=popular&limit=12&window=7d", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!res.ok) {
          throw new Error("Failed to load posts");
        }
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e.message ?? "Failed to load posts");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <main
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: "24px 16px 48px",
        color: "#E5E7EB",
      }}
    >
      <header
        style={{
          marginBottom: 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Feed</h1>
        <Link
          href="/create"
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: "none",
            background: "linear-gradient(to right,#22C55E,#16A34A)",
            color: "#020817",
            fontWeight: 600,
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          + Create post
        </Link>
      </header>

      {loading && <div>Loading posts…</div>}
      {error && (
        <div style={{ color: "#FCA5A5", marginBottom: 8 }}>{error}</div>
      )}

      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {posts.map((post) => (
          <FeedPostRow
            key={post.id}
            post={post}
            onOpen={() => router.push(`/post/${post.id}`)}
            canVote={!!session?.user}
          />
        ))}
      </ul>
    </main>
  );
};

const FeedPostRow: React.FC<{
  post: Post;
  onOpen: () => void;
  canVote: boolean;
}> = ({ post, onOpen, canVote }) => {
  const [score, setScore] = useState<number>(0);
  const [myVote, setMyVote] = useState<0 | 1 | -1>(0);

  const images = getAllImages(post);
  const bodyText = (
    post.body ??
    (post as any).content ??
    (post as any).text ??
    ""
  ).toString();
  const hasBody = bodyText.trim().length > 0;
  const excerpt =
    hasBody && bodyText.length > 220
      ? bodyText.slice(0, 220).trimEnd() + "…"
      : bodyText;

  const authorName =
    post.user?.name || post.user?.email || "whistler";

  const handleVote = async (next: 1 | -1) => {
    if (!canVote) return;
    const prev = myVote;
    const newVote = prev === next ? 0 : next;
    setMyVote(newVote);
    setScore((s) => s + (newVote - prev));
    const ok = await sendVote(post.id, newVote);
    if (!ok) {
      setMyVote(prev);
      setScore((s) => s - (newVote - prev));
    }
  };

  const created = new Date(post.createdAt);
  const createdLabel = created.toLocaleString();

  return (
    <li
      style={{
        padding: "14px 0",
        borderBottom: "1px solid rgba(31,41,55,0.9)",
      }}
    >
      <article
        style={{
          display: "grid",
          gridTemplateColumns: "48px 1fr",
          gap: 16,
        }}
      >
        {/* Vote column (same idea as view page) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            marginTop: 4,
          }}
        >
          <button
            type="button"
            onClick={() => handleVote(1)}
            style={{
              width: 22,
              height: 22,
              borderRadius: 7,
              border: "none",
              background:
                myVote === 1 ? "#22C55E" : "rgba(148,163,184,0.18)",
              color: myVote === 1 ? "#020817" : "#9CA3AF",
              cursor: canVote ? "pointer" : "default",
            }}
          />
          <div
            style={{
              minWidth: 26,
              textAlign: "center",
              fontSize: 11,
              fontWeight: 600,
              color: score >= 0 ? "#22C55E" : "#F97316",
            }}
          >
            {score}
          </div>
          <button
            type="button"
            onClick={() => handleVote(-1)}
            style={{
              width: 22,
              height: 22,
              borderRadius: 7,
              border: "none",
              background:
                myVote === -1 ? "#F97316" : "rgba(148,163,184,0.18)",
              color: myVote === -1 ? "#020817" : "#9CA3AF",
              cursor: canVote ? "pointer" : "default",
            }}
          />
        </div>

        {/* Post content */}
        <div
          onClick={onOpen}
          style={{
            cursor: "pointer",
          }}
        >
          {/* Title + meta */}
          <header
            style={{
              marginBottom: 6,
            }}
          >
            <h2
              style={{
                margin: 0,
                marginBottom: 2,
                fontSize: 18,
                fontWeight: 600,
                color: "#F9FAFB",
              }}
            >
              {post.title}
            </h2>
            <div
              style={{
                fontSize: 11,
                color: "#9CA3AF",
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span>Posted by</span>
              <span style={{ color: "#E5E7EB", fontWeight: 500 }}>
                {authorName}
              </span>
              <span>•</span>
              <span>{createdLabel}</span>
            </div>
          </header>

          {/* Body excerpt above image */}
          {hasBody && (
            <p
              style={{
                marginTop: 8,
                marginBottom: images.length ? 10 : 4,
                whiteSpace: "pre-wrap",
                color: "#D1D5DB",
                lineHeight: 1.6,
                fontSize: 14,
              }}
            >
              {excerpt}
            </p>
          )}

          {/* Image preview – gradient frame but smaller, no giant blue card */}
          {images.length > 0 && (
            <div
              style={{
                maxWidth: 420,
              }}
            >
              <div
                style={{
                  borderRadius: 22,
                  padding: 6,
                  background:
                    "linear-gradient(135deg,#22C55E,#0EA5E9,#1D4ED8)",
                }}
              >
                <div
                  style={{
                    borderRadius: 18,
                    overflow: "hidden",
                    backgroundColor: "#020817",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[0]}
                    alt="Post media"
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                      objectFit: "cover",
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </article>
    </li>
  );
};

export default FeedPage;

// pages/index.tsx - Whistle homepage (canonical design, fixed fetch loop + robust /api/posts URL)

import Head from "next/head";
import VoteColumn from "../components/VoteColumn";
import type { NextPage } from "next";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

type VoteDir = "up" | "down" | null;

interface FeedUser {
  name?: string | null;
}

interface FeedPost {
  id: string;
  title: string;
  content: string | null;
  mediaUrl: string | null;
  likesCount: number;
  commentsCount: number;
  timestamp: string | null;
  user?: FeedUser | null;
  saved?: boolean;
}

const PAGE_SIZE = 12;
const LS_VOTE_PREFIX = "whistle_vote_";
const LS_SAVE_PREFIX = "whistle_save_";

function timeAgo(iso: string | null | undefined) {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diff = Math.max(0, now.getTime() - date.getTime());

  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min${min === 1 ? "" : "s"} ago`;

  const h = Math.floor(min / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;

  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;

  const w = Math.floor(d / 7);
  if (w < 4) return `${w} week${w === 1 ? "" : "s"} ago`;

  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} month${mo === 1 ? "" : "s"} ago`;

  const y = Math.floor(d / 365);
  return `${y} year${y === 1 ? "" : "s"} ago`;
}

// Recursively search the raw response for any array of objects that look like posts
function findCandidateArrays(raw: any): any[] {
  const out: any[] = [];
  const visited = new Set<any>();

  function dfs(node: any, depth: number) {
    if (!node || depth > 4) return;
    if (visited.has(node)) return;
    visited.add(node);

    if (Array.isArray(node)) {
      if (node.length && typeof node[0] === "object") {
        out.push(node);
      }
      return;
    }

    if (typeof node === "object") {
      for (const key of Object.keys(node)) {
        dfs((node as any)[key], depth + 1);
      }
    }
  }

  dfs(raw, 0);
  return out;
}

// Normalize whatever /api/posts returns into FeedPost[]
function extractAndNormalizePosts(raw: any): FeedPost[] {
  if (!raw) return [];

  const candidates = findCandidateArrays(raw);
  const arr = candidates.find(
    (val) => Array.isArray(val) && val.length && typeof val[0] === "object",
  ) as any[] | undefined;

  if (!arr) return [];

  const normalized: FeedPost[] = arr
    .filter((item) => item && typeof item === "object" && "id" in item)
    .map((item: any) => {
      const mediaUrl =
        item.mediaUrl ??
        (Array.isArray(item.imageUrls) && item.imageUrls.length
          ? item.imageUrls[0]
          : null) ??
        (typeof item.imageUrl === "string" ? item.imageUrl : null);

      const user =
        item.user ??
        item.author ??
        (item.userName || item.username
          ? { name: item.userName ?? item.username }
          : null);

      const commentsCount =
        typeof item.commentsCount === "number"
          ? item.commentsCount
          : typeof item._count?.comments === "number"
          ? item._count.comments
          : Array.isArray(item.comments)
          ? item.comments.length
          : 0;

      let likesCount: number;
      if (typeof item.likesCount === "number") {
        likesCount = item.likesCount;
      } else if (typeof item.score === "number") {
        likesCount = item.score;
      } else if (Array.isArray(item.votes)) {
        likesCount = item.votes.reduce((acc: number, v: any) => {
          const dir = v.direction ?? v.value ?? v.vote;
          if (dir === 1 || dir === "UP" || dir === "up") return acc + 1;
          if (dir === -1 || dir === "DOWN" || dir === "down") return acc - 1;
          return acc;
        }, 0);
      } else {
        likesCount = 0;
      }

      const timestamp: string | null =
        typeof item.timestamp === "string"
          ? item.timestamp
          : typeof item.createdAt === "string"
          ? item.createdAt
          : typeof item.created_at === "string"
          ? item.created_at
          : null;

      const saved: boolean =
        typeof item.saved === "boolean"
          ? item.saved
          : !!item.savedId || !!item.isSaved || !!item.savedByMe;

      return {
        id: String(item.id),
        title: item.title ?? "(untitled)",
        content:
          typeof item.content === "string"
            ? item.content
            : typeof item.body === "string"
            ? item.body
            : null,
        mediaUrl: mediaUrl ?? null,
        likesCount,
        commentsCount,
        timestamp,
        user,
        saved,
      };
    });

  return normalized;
}

const HomePage: NextPage = () => {
  const { data: session } = useSession();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [voteMap, setVoteMap] = useState<Record<string, VoteDir>>({});
  const [scoreMap, setScoreMap] = useState<Record<string, number>>({});
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [debugRaw, setDebugRaw] = useState<any | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null); // kept for layout, infinite scroll is OFF

  const getScore = useCallback(
    (post: FeedPost) => {
      const override = scoreMap[post.id];
      if (typeof override === "number") return override;
      return post.likesCount ?? 0;
    },
    [scoreMap],
  );

  // Initial load: fetch once per mount (no dependency on `loading` to avoid loops)
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        // Try several URLs, use the first that gives us actual posts.
        const urls = [
          `/api/posts?sort=latest&limit=${PAGE_SIZE}`,
          `/api/posts?sort=popular&limit=${PAGE_SIZE}&window=7d`,
          `/api/posts`,
        ];

        let found = false;

        for (let i = 0; i < urls.length; i++) {
          const url = urls[i];
          try {
            const res = await fetch(url, {
              method: "GET",
              cache: "no-store",
              headers: {
                Accept: "application/json",
                "Cache-Control": "no-cache, no-store, max-age=0",
                Pragma: "no-cache",
              },
            });

            if (!res.ok) {
              console.error("Failed to load posts from", url, res.status);
              continue;
            }

            const raw: any = await res.json().catch(() => null);
            if (cancelled) return;

            const pagePosts = extractAndNormalizePosts(raw);

            // If we got posts OR this is the last fallback URL, use it.
            if (pagePosts.length > 0 || i === urls.length - 1) {
              if (cancelled) return;
              setDebugRaw(raw);
              setPosts(pagePosts);
              found = true;
              break;
            }
          } catch (err) {
            console.error("Error calling", url, err);
            if (cancelled) return;
            continue;
          }
        }

        if (!found && !cancelled) {
          setDebugRaw(null);
          setPosts([]);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error loading posts", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // Hydrate votes + saves from localStorage whenever posts change
  useEffect(() => {
    if (!Array.isArray(posts) || posts.length === 0) return;

    const nextVotes: Record<string, VoteDir> = {};
    const nextScores: Record<string, number> = {};
    const nextSaves: Record<string, boolean> = {};

    for (const p of posts) {
      // Votes
      try {
        const v = localStorage.getItem(LS_VOTE_PREFIX + p.id);
        const vote: VoteDir = v === "up" ? "up" : v === "down" ? "down" : null;
        nextVotes[p.id] = vote;

        let base = p.likesCount ?? 0;

        if (vote === "up" && base < 1) base = 1;
        if (vote === "down" && base > -1 && base < 0) base = -1;

        nextScores[p.id] = base;
      } catch {
        nextScores[p.id] = p.likesCount ?? 0;
      }

      // Saved
      try {
        const s = localStorage.getItem(LS_SAVE_PREFIX + p.id);
        if (s === "1") nextSaves[p.id] = true;
        else if (s === "0") nextSaves[p.id] = false;
        else if (typeof p.saved === "boolean") nextSaves[p.id] = p.saved;
      } catch {
        if (typeof p.saved === "boolean") nextSaves[p.id] = p.saved;
      }
    }

    if (Object.keys(nextVotes).length) {
      setVoteMap((prev) => ({ ...nextVotes, ...prev }));
    }
    if (Object.keys(nextScores).length) {
      setScoreMap((prev) => ({ ...nextScores, ...prev }));
    }
    if (Object.keys(nextSaves).length) {
      setSavedMap((prev) => ({ ...nextSaves, ...prev }));
    }
  }, [posts]);

  // Local helper to adjust score
  const applyDelta = useCallback(
    (postId: string, delta: number) => {
      setScoreMap((prev) => {
        const currentFromState = prev[postId];
        const baseFromPosts =
          posts.find((p) => p.id === postId)?.likesCount ?? 0;

        const currentScore =
          typeof currentFromState === "number" ? currentFromState : baseFromPosts;

        return { ...prev, [postId]: currentScore + delta };
      });
    },
    [posts],
  );

  const vote = useCallback(
    async (postId: string, dir: 1 | -1) => {
      if (!session?.user) return;

      setVoteMap((prev) => {
        const current = prev[postId] ?? null;
        let next: VoteDir;
        let delta = 0;

        if (dir === 1) {
          if (current === "up") {
            next = null;
            delta = -1;
          } else if (current === "down") {
            next = "up";
            delta = 2;
          } else {
            next = "up";
            delta = 1;
          }
        } else {
          if (current === "down") {
            next = null;
            delta = 1;
          } else if (current === "up") {
            next = "down";
            delta = -2;
          } else {
            next = "down";
            delta = -1;
          }
        }

        // Optimistic local score update
        applyDelta(postId, delta);

        // Persist local vote for cross-page sync
        try {
          localStorage.setItem(
            LS_VOTE_PREFIX + postId,
            next === "up" ? "up" : next === "down" ? "down" : "",
          );
        } catch {
          /* ignore */
        }

        // Fire and forget server update
        (async () => {
          try {
            await fetch("/api/vote", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                postId,
                direction: next,
              }),
            });
          } catch (err) {
            console.error(err);
          }
        })();

        return { ...prev, [postId]: next };
      });
    },
    [applyDelta, session?.user],
  );

  const toggleSave = useCallback(
    async (postId: string) => {
      if (!session?.user) return;

      setSavedMap((prev) => {
        const next = !prev[postId];
        const updated = { ...prev, [postId]: next };

        try {
          localStorage.setItem(LS_SAVE_PREFIX + postId, next ? "1" : "0");
        } catch {
          /* ignore */
        }

        (async () => {
          try {
            await fetch("/api/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ postId, save: next }),
            });
          } catch (err) {
            console.error(err);
          }
        })();

        return updated;
      });
    },
    [session?.user],
  );

  const share = useCallback(async (postId: string) => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/post/${postId}`
        : `/post/${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Whistle", url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert("Link copied to clipboard.");
      }
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <>
      <Head>
        <title>Whistle · Feed</title>
      </Head>

      <main className="feed-wrap">
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <h1 style={{ fontWeight: 800, fontSize: "1.1rem" }}>Feed</h1>
        </header>

        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {Array.isArray(posts) &&
            posts.map((post) => {
              const voted = voteMap[post.id] ?? null;
              const score = getScore(post);
              const liked = Math.max(0, score);
              const disliked = Math.max(0, -score);
              const saved = savedMap[post.id] ?? post.saved ?? false;
              const mediaUrl = post.mediaUrl ?? null;

              return (
                <li key={post.id}>
                  <article
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Vote column */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 4,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => vote(post.id, 1)}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 7,
                          border: "none",
                          background:
                            voted === "up"
                              ? "#22C55E"
                              : "rgba(148,163,184,0.18)",
                          color: voted === "up" ? "#020817" : "#9CA3AF",
                          cursor: session?.user ? "pointer" : "default",
                        }}
                      />
                      <div
                        style={{
                          minWidth: 30,
                          textAlign: "center",
                          fontSize: 11,
                          fontWeight: 600,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <span style={{ color: "#22C55E" }}>{liked}</span>
                        <span style={{ color: "#F97316" }}>{disliked}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => vote(post.id, -1)}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 7,
                          border: "none",
                          background:
                            voted === "down"
                              ? "#F97316"
                              : "rgba(148,163,184,0.18)",
                          color: voted === "down" ? "#020817" : "#9CA3AF",
                          cursor: session?.user ? "pointer" : "default",
                        }}
                      />
                    </div>

                    {/* Main content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <header style={{ marginBottom: 8, textAlign: "left" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 12,
                          }}
                        >
                          <div>
                            <h2
                              style={{
                                margin: 0,
                                marginBottom: 2,
                                fontSize: 18,
                                fontWeight: 700,
                                color: "#F9FAFB",
                              }}
                            >
                              <a
                                href={`/post/${post.id}`}
                                style={{
                                  color: "inherit",
                                  textDecoration: "none",
                                }}
                              >
                                {post.title}
                              </a>
                            </h2>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 6,
                                fontSize: 11,
                                color: "#9CA3AF",
                              }}
                            >
                              <span>
                                {post.user?.name || "bobi"} ·{" "}
                                {timeAgo(post.timestamp)} ·{" "}
                                {post.commentsCount} comment
                                {post.commentsCount === 1 ? "" : "s"}
                              </span>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 12,
                              color: "#E5E7EB",
                            }}
                          >
                            <span style={{ fontSize: 14 }}>💬</span>
                            <span>{post.commentsCount}</span>
                          </div>
                        </div>
                      </header>

                      {mediaUrl && (
                        <div
                          style={{
                            marginBottom: 8,
                            overflow: "hidden",
                            borderRadius: 18,
                            border: "2px solid #22C55E",
                            background: "#020617",
                          }}
                        >
                          <a
                            href={`/post/${post.id}`}
                            style={{ display: "block" }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={mediaUrl}
                              alt={post.title}
                              style={{
                                width: "100%",
                                maxHeight: 520,
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          </a>
                        </div>
                      )}

                      {post.content && (
                        <p
                          style={{
                            margin: 0,
                            marginBottom: 8,
                            fontSize: 14,
                            color: "#E5E7EB",
                            whiteSpace: "pre-line",
                          }}
                        >
                          {post.content}
                        </p>
                      )}

                      <footer
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 11,
                          color: "#9CA3AF",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSave(post.id)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 999,
                            border: "1px solid rgba(148,163,184,0.4)",
                            background: saved
                              ? "rgba(34,197,94,0.12)"
                              : "transparent",
                            color: saved ? "#BBF7D0" : "#E5E7EB",
                            cursor: session?.user ? "pointer" : "default",
                            fontSize: 11,
                          }}
                        >
                          {saved ? "Saved" : "Save"}
                        </button>

                        <button
                          type="button"
                          onClick={() => share(post.id)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 999,
                            border: "1px solid rgba(148,163,184,0.4)",
                            background: "transparent",
                            color: "#E5E7EB",
                            cursor: "pointer",
                            fontSize: 11,
                          }}
                        >
                          Share
                        </button>
                      </footer>
                    </div>
                  </article>
                </li>
              );
            })}
        </ul>

        <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />

        {/* Debug box: only shows when there are no posts */}
        {Array.isArray(posts) && posts.length === 0 && !loading && (
          <section
            style={{
              marginTop: 24,
              padding: 16,
              borderRadius: 12,
              border: "1px solid rgba(248,250,252,0.08)",
              background: "rgba(15,23,42,0.92)",
              fontSize: 12,
              color: "#E5E7EB",
              maxWidth: 700,
              maxHeight: 320,
              overflow: "auto",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              Debug info: raw response from /api/posts
            </div>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                margin: 0,
              }}
            >
              {debugRaw
                ? JSON.stringify(debugRaw, null, 2)
                : "No data received yet."}
            </pre>
          </section>
        )}

        {loading && (
          <div
            style={{
              height: 36,
              display: "grid",
              placeItems: "center",
              opacity: 0.9,
            }}
          >
            <div className="small-muted">Loading...</div>
          </div>
        )}
      </main>
    </>
  );
};

export default HomePage;


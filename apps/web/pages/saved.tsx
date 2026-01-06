import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type SavedMap = Record<string, boolean>;

const LS_SAVE_PREFIX = "whistle:save:";
const SAVE_EVENTS = ["whistle:posts-mutated"];

async function fetchSavedIdsFromServer(): Promise<string[]> {
  try {
    const res = await fetch("/api/saved", { credentials: "same-origin" });
    if (!res.ok) return [];
    const data = await res.json().catch(() => ({} as any));
    if (Array.isArray((data as any)?.ids)) {
      return (data as any).ids.map((x: any) => String(x));
    }
    return [];
  } catch {
    return [];
  }
}

function SavedPage() {
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [savedMap, setSavedMap] = useState<SavedMap>({});
  const [error, setError] = useState<string | null>(null);

  // Initial load: fetch saved IDs and then fetch posts by ids
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const ids = await fetchSavedIdsFromServer();
      if (cancelled) return;

      setSavedIds(ids);
      const initialMap: SavedMap = {};
      ids.forEach((id) => (initialMap[id] = true));
      setSavedMap(initialMap);

      if (!ids.length) {
        setPosts([]);
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        params.set("ids", ids.join(","));
        const res = await fetch(`/api/posts?${params.toString()}`, {
          credentials: "same-origin",
        });
        if (!res.ok) throw new Error("Failed to fetch saved posts.");
        const json = await res.json().catch(() => []);
        if (!Array.isArray(json)) throw new Error("Bad posts response.");
        setPosts(json as any[]);
      } catch (err: any) {
        console.error(err);
        setError(err?.message ?? "Failed to load saved posts.");
        setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSave = useCallback(
    async (id: string) => {
      if (!id) return;

      const current = savedMap[id] ?? true;
      const next = !current;

      // Optimistic UI
      setSavedMap((m) => ({ ...m, [id]: next }));
      setSavedIds((ids) => {
        if (next) {
          return ids.includes(id) ? ids : [...ids, id];
        }
        return ids.filter((x) => x !== id);
      });
      if (!next) {
        // If unsaving from Saved page, remove the card
        setPosts((cur) => cur.filter((p: any) => String(p.id) !== id));
      }

      try {
        const res = await fetch("/api/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ postId: String(id), action: "toggle" }),
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({} as any));
          if (typeof data.saved === "boolean") {
            setSavedMap((m) => ({ ...m, [id]: !!data.saved }));
          }
        }

        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(
              LS_SAVE_PREFIX + id,
              next ? "1" : "0"
            );
            for (const ev of SAVE_EVENTS) {
              window.dispatchEvent(new Event(ev));
              window.localStorage.setItem(ev, String(Date.now()));
            }
          } catch {
            // ignore
          }
        }
      } catch (e) {
        // Revert on failure
        console.error(e);
        setSavedMap((m) => ({ ...m, [id]: current }));
        alert("Save/Unsave failed. Please try again.");
      }
    },
    [savedMap]
  );

  return (
    <main className="page page-saved">
      <section className="page-header" style={{ marginBottom: 16 }}>
        <h1 className="page-title">Saved posts</h1>
      </section>

      {loading && (
        <p className="text-muted" style={{ marginTop: 8 }}>
          Loading your saved posts…
        </p>
      )}

      {!loading && error && (
        <p className="text-error" style={{ marginTop: 8 }}>
          {error}
        </p>
      )}

      {!loading && !error && posts.length === 0 && (
        <p className="text-muted" style={{ marginTop: 8 }}>
          You have no saved posts yet. Go to the{" "}
          <Link href="/feed">feed</Link> and tap &quot;Save&quot; on something
          interesting.
        </p>
      )}

      <div className="saved-grid" style={{ marginTop: 16 }}>
        {posts.map((p: any) => {
          const id = String(p.id);
          const isSaved = !!savedMap[id];

          return (
            <article
              key={id}
              className="post-card"
              style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: 12,
                background: "var(--whistle-card-bg, rgba(255,255,255,0.02))",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div
                className="post-card-header"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  marginBottom: 8,
                }}
              >
                <div
                  className="post-title-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Link
                    href={`/post/${id}`}
                    className="post-title"
                    style={{
                      fontWeight: 600,
                      fontSize: 16,
                      textDecoration: "none",
                    }}
                  >
                    {p.title}
                  </Link>

                  <button
                    type="button"
                    onClick={() => toggleSave(id)}
                    title={isSaved ? "Saved" : "Save"}
                    style={{
                      marginLeft: "auto",
                      padding: "4px 10px",
                      fontSize: 12,
                      borderRadius: 999,
                      border: "none",
                      cursor: "pointer",
                      background: isSaved
                        ? "var(--whistle-green, #3bd671)"
                        : "rgba(255,255,255,0.08)",
                    }}
                  >
                    {isSaved ? "Saved" : "Save"}
                  </button>
                </div>

                {p?.subforum?.name && (
                  <div
                    className="post-loop"
                    style={{ fontSize: 12, opacity: 0.8 }}
                  >
                    in{" "}
                    <Link
                      href={`/feed?loop=${encodeURIComponent(
                        p.subforum.name
                      )}`}
                    >
                      #{p.subforum.name}
                    </Link>
                  </div>
                )}
              </div>

              {p.mediaUrl && (
                <div
                  className="post-image-shell"
                  style={{
                    borderRadius: 12,
                    overflow: "hidden",
                    marginBottom: 8,
                    maxHeight: "var(--post-media-h, 360px)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.mediaUrl}
                    alt={p.title ?? ""}
                    style={{
                      display: "block",
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      background: "black",
                    }}
                  />
                </div>
              )}

              {p.content && (
                <p
                  className="post-body"
                  style={{ fontSize: 14, opacity: 0.9, whiteSpace: "pre-wrap" }}
                >
                  {p.content}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}

export default SavedPage;

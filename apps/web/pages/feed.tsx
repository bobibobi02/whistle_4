// pages/feed.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useInfinitePosts} from '@/hooks/useInfinitePosts';

/* ---------- Helpers ---------- */
type VoteDir = 'up' | 'down' | null;

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  const diff = Math.floor((Date.now() - t) / 1000);
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'], [60, 'minute'], [24, 'hour'], [7, 'day'], [4.345, 'week'], [12, 'month'],
  ];
  let v = diff; let u: Intl.RelativeTimeFormatUnit = 'second';
  for (const [s, unit] of steps) { if (v < s) break; v = Math.floor(v / s); u = unit; }
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-v, u);
}
function num(v: any): number {
  if (v == null) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && !Number.isNaN(Number(v))) return Number(v);
  if (Array.isArray(v)) return v.length;
  if (typeof v === 'object' && 'count' in v && typeof (v as any).count === 'number') return (v as any).count;
  return 0;
}
function textOrNull(...vals: any[]): string | null {
  for (const v of vals) if (typeof v === 'string' && v.trim()) return v.trim();
  return null;
}

/* ---------- Types / Normalizer ---------- */
type FeedPost = {
  id: string;
  user: { name: string } | null;
  userEmail?: string | null;
  avatarUrl?: string | null;
  timestamp: string;
  title?: string | null;
  content: string | null;
  mediaUrl?: string | null;
  likesCount: number;
  commentsCount: number;
  saved?: boolean;
};
type ApiResp = { items?: any[]; posts?: any[]; nextCursor?: string | null; error?: string };

function normalizeRow(raw: any): FeedPost | null {
  const id = raw?.id ?? raw?.postId ?? raw?._id ?? raw?.slug;
  if (!id) return null;

  const name =
    raw?.userName ?? raw?.username ?? raw?.user?.username ?? raw?.user?.name ??
    raw?.author?.username ?? raw?.author?.name ??
    (raw?.userEmail ? String(raw.userEmail).split('@')[0] : 'user');

  const email =
    raw?.userEmail ?? raw?.user?.email ?? raw?.author?.email ?? raw?.email ?? null;

  const avatar =
    raw?.user?.avatarUrl ?? raw?.user?.image ?? raw?.author?.avatarUrl ??
    raw?.author?.image ?? raw?.avatarUrl ?? null;

  const created = raw?.createdAt ?? raw?.created_at ?? raw?.timestamp ?? new Date().toISOString();

  const title = textOrNull(raw?.title);
  const content = textOrNull(
    raw?.content, raw?.text, raw?.body, raw?.message, raw?.description, raw?.caption, raw?.desc
  );

  const mediaUrl =
    raw?.mediaUrl ?? raw?.media?.url ?? raw?.imageUrl ?? raw?.image?.url ??
    raw?.images?.[0]?.url ?? raw?.attachments?.[0]?.url ?? raw?.contentUrl ??
    raw?.pictureUrl ?? raw?.fileUrl ?? raw?.url ?? raw?.src ?? null;

  const likesCount =
    num(raw?.likeCount) || num(raw?.likesCount) || num(raw?.likes) || num(raw?.upvotes) ||
    num(raw?._count?.votes) || 0;

  const commentsCount =
    num(raw?.commentsCount) || num(raw?.commentCount) || num(raw?._count?.comments) ||
    (Array.isArray(raw?.comments) ? raw.comments.length : 0);

  return {
    id: String(id),
    user: { name },
    userEmail: email,
    avatarUrl: avatar,
    timestamp: new Date(created).toISOString(),
    title,
    content: content ?? null,
    mediaUrl,
    likesCount,
    commentsCount,
    saved: !!raw?.saved,
  };
}

/* ---------- Data Fetcher (for the hook) ---------- */
async function safeJson(r: Response): Promise<ApiResp> {
  const txt = await r.text();
  try { return JSON.parse(txt); } catch { return { error: txt || `Bad response ${r.status}` }; }
}

async function fetchFeedPage(cursor: string | null) {
  const qs = new URLSearchParams();
  qs.set('sort', 'latest');
  qs.set('limit', '10');
  if (cursor) qs.set('cursor', cursor);

  const r = await fetch(`/api/posts?${qs.toString()}`, {
    cache: 'no-store',
    credentials: 'same-origin',
    headers: { 'cache-control': 'no-cache', pragma: 'no-cache' },
  });
  const json = await safeJson(r);

  if (!r.ok) {
    console.error('Feed API failed:', json.error || r.statusText);
    return { items: [], nextCursor: null };
  }

  const rawList =
    (Array.isArray(json) ? json :
    Array.isArray(json.items) ? json.items :
    Array.isArray(json.posts) ? json.posts : []);

  const items = rawList.map(normalizeRow).filter(Boolean) as FeedPost[];
  const nextCursor = (json as any).nextCursor ?? null;

  return { items: items as unknown as any[], nextCursor };
}

/* ---------- POST helpers (vote/save/share) ---------- */
async function postJSON(url: string, body: any) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json().catch(() => ({}));
}

const BRAND = '#22C55E';
const LS_VOTE_PREFIX = 'whistle:vote:';      // value: "up" | "down"
const LS_SAVE_PREFIX = 'whistle:save:';      // value: "1" | "0" | "true" | "false"
const SAVE_EVENTS = ['whistle:posts-mutated', 'whistle:saves-mutated'];
const TRUE = new Set(['1', 'true', 'yes', 'y', 'on', 't']);

/* Read saved from localStorage for a post id */
function readSavedLocal(id: string): boolean {
  try {
    const v = localStorage.getItem(LS_SAVE_PREFIX + id);
    return TRUE.has(String(v ?? '').toLowerCase().trim());
  } catch {
    return false;
  }
}

export default function FeedPage() {
  const { data: session } = useSession();

  // hook-driven pagination (stable loadMore inside)
  const { items, loading, ended, cursor, loadMore, reset, setSentinel } = useInfinitePosts({ fetchPage: fetchFeedPage });
const posts = items;
const hasMore = !ended;

  //         Always work with a safe array
  const safePosts: FeedPost[] = useMemo(
    () => (Array.isArray(posts) ? (posts as unknown as FeedPost[]) : []),
    [posts]
  );

  // UI-local (optimistic) state
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [voteMap, setVoteMap] = useState<Record<string, VoteDir>>({});
  const [scoreMap, setScoreMap] = useState<Record<string, number>>({});

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore; // keep a stable ref for the observer callback

  // Seed optimistic states from localStorage as posts arrive
  useEffect(() => {
    if (!safePosts.length) return;
    const vmap: Record<string, VoteDir> = {};
    const smap: Record<string, boolean> = {};
    const scores: Record<string, number> = {};

    for (const p of safePosts) {
      // saved: prefer localStorage (shared with post page), fallback to API's saved flag
      const savedLocal = readSavedLocal(p.id);
      if (!(p.id in savedMap)) {
        smap[p.id] = savedLocal || !!p.saved;
      }

      // votes
      let stored: VoteDir = null;
      try {
        const s = localStorage.getItem(LS_VOTE_PREFIX + p.id);
        stored = s === 'up' ? 'up' : s === 'down' ? 'down' : null;
      } catch {}
      if (stored && !(p.id in voteMap)) {
        vmap[p.id] = stored;
        const base = p.likesCount ?? 0;
        const bump = stored === 'up' ? 1 : stored === 'down' ? -1 : 0;
        if (bump) scores[p.id] = base + bump;
      }
    }

    if (Object.keys(vmap).length) setVoteMap((m) => ({ ...vmap, ...m }));
    if (Object.keys(smap).length) setSavedMap((m) => ({ ...smap, ...m }));
    if (Object.keys(scores).length) setScoreMap((m) => ({ ...scores, ...m }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safePosts]);

  // Initial load
  useEffect(() => { loadMore(); }, [loadMore]);

  // Observe sentinel to load more (stable callback, no re-installs per render)
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const onIntersect: IntersectionObserverCallback = (entries) => {
      const e = entries[0];
      if (e.isIntersecting) {
        // defer to rAF so layout settles before we ask for more
        requestAnimationFrame(() => loadMoreRef.current());
      }
    };

    const io = new IntersectionObserver(onIntersect, { root: null, rootMargin: '900px 0px', threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []); // <-- empty deps, stable due to loadMoreRef

  // Cross-tab + cross-page sync for "saved" state
  useEffect(() => {
    const refreshSavedFromLocal = () => {
      if (!safePosts.length) return;
      const smap: Record<string, boolean> = {};
      for (const p of safePosts) {
        smap[p.id] = readSavedLocal(p.id);
      }
      setSavedMap((m) => ({ ...m, ...smap }));
    };

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.startsWith(LS_SAVE_PREFIX) || SAVE_EVENTS.includes(e.key)) {
        refreshSavedFromLocal();
      }
    };

    const onCustom = () => refreshSavedFromLocal();

    window.addEventListener('storage', onStorage);
    for (const ev of SAVE_EVENTS) window.addEventListener(ev, onCustom as EventListener);

    return () => {
      window.removeEventListener('storage', onStorage);
      for (const ev of SAVE_EVENTS) window.removeEventListener(ev, onCustom as EventListener);
    };
  }, [safePosts]);

  /* ---------- Actions (optimistic + persisted) ---------- */
  const vote = async (id: string, value: 1 | -1) => {
    if (!id) return;
    const current = voteMap[id] ?? null;
    const next: VoteDir =
      current === 'up' && value === 1 ? null :
      current === 'down' && value === -1 ? null :
      (value === 1 ? 'up' : 'down');

    const post = safePosts.find(p => p.id === id);
    const base = scoreMap[id] ?? post?.likesCount ?? 0;

    let delta = 0;
    if (current === null) delta = value;
    else if (next === null) delta = current === 'up' ? -1 : +1;
    else if (current !== next) delta = value === 1 ? +2 : -2;

    setVoteMap((m) => ({ ...m, [id]: next }));
    setScoreMap((m) => ({ ...m, [id]: base + delta }));

    try {
      const sendVal = next === null ? 0 : (next === 'up' ? 1 : -1);
      const res = await postJSON('/api/vote', { postId: id, value: sendVal });
      if (typeof res?.likesCount === 'number') {
        setScoreMap((m) => ({ ...m, [id]: res.likesCount }));
      }
      try { localStorage.setItem('whistle:votes-mutated', String(Date.now())); } catch {}
    } catch (e) {
      setVoteMap((m) => ({ ...m, [id]: current }));
      setScoreMap((m) => ({ ...m, [id]: base }));
      alert('Voting failed. Please try again.');
      console.error(e);
    }
  };

  const toggleSave = async (id: string) => {
    if (!id) return;
    const next = !(savedMap[id]);
    setSavedMap((m) => ({ ...m, [id]: next }));
    try {
      // persist to server (correct endpoint)
      const res = await postJSON('/api/saved', { postId: id, action: 'toggle' });
      if (typeof res.saved === 'boolean') {
        setSavedMap((m) => ({ ...m, [id]: !!res.saved }));
      }

      // mirror in localStorage (shared with post page)
      try {
        localStorage.setItem(LS_SAVE_PREFIX + id, next ? '1' : '0');
        // fire both events so either listener style updates
        for (const ev of SAVE_EVENTS) {
          window.dispatchEvent(new Event(ev));
          localStorage.setItem(ev, String(Date.now()));
        }
      } catch {}
    } catch (e) {
      // rollback
      setSavedMap((m) => ({ ...m, [id]: !next }));
      alert('Save/Unsave failed. Please try again.');
      console.error(e);
    }
  };

  const share = async (id: string) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/post/${id}` : `/post/${id}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Whistle', url });
      else { await navigator.clipboard.writeText(url); alert('Link copied to clipboard.'); }
    } catch {}
  };

  const getScore = (p: FeedPost) => (scoreMap[p.id] ?? p.likesCount);

  /* ---------- Render ---------- */
  return (
    <>
      <Head><title>Whistle          Feed</title></Head>

      <main className="feed-wrap">
        <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <h1 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Latest Posts</h1>
          <span className="meta-pill" title="Popular lives on Home">Tip: Popular is on Home</span>
        </header>

        <ul className="feed-list" aria-live="polite">
          {(Array.isArray(posts) ? (posts as any[]) : []).map((post) => {
            const displayName = post.user?.name || 'user';
            const voted = voteMap[post.id] ?? null;
            const saved = savedMap[post.id] ?? !!post.saved;

            return (
              <li key={post.id}>
                <article className="post-card">
                  {/* header */}
                  <div className="post-head">
                    <span className="post-avatar" aria-hidden>
                      {}
                      <img
                        src={post.avatarUrl || '/icons/whistle-glow-512.png'}
                        alt=""
                        width={22}
                        height={22}
                        decoding="async"
                        style={{ width: 22, height: 22, objectFit: post.avatarUrl ? 'cover' : 'contain', borderRadius: 999 }}
                      />
                    </span>
                    <span className="post-user">{displayName}</span>
                    <span className="post-time">        {timeAgo(post.timestamp)}</span>
                  </div>

                  {/* title */}
                  {post.title && (
                    <Link href={`/post/${post.id}`} style={{ textDecoration: 'none' }}>
                      <h3
                        style={{
                          margin: '6px 0 6px',
                          fontWeight: 800,
                          letterSpacing: '-0.01em',
                          fontSize: 'clamp(18px, 2.2vw, 24px)',
                          color: 'var(--text)',
                        }}
                      >
                        {post.title}
                      </h3>
                    </Link>
                  )}

                  {/* text */}
                  {post.content && (
                    <div className="post-content" style={{ marginTop: 4, whiteSpace: 'pre-wrap', opacity: 0.95 }}>
                      {post.content}
                    </div>
                  )}

                  {/* media */}
                  {post.mediaUrl && (
                    <div className="feed-media" style={{ marginTop: post.content ? 8 : 6 }}>
                      <Link href={`/post/${post.id}`} className="feed-media-link" aria-label="Open post">
                        <div
                          className="media-shell"
                          style={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '16 / 9',
                            borderRadius: 12,
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'linear-gradient(180deg, rgba(3,7,18,0.55), rgba(3,7,18,0.35))',
                            boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
                          }}
                        >
                          {}
                          <img
                            src={post.mediaUrl}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </div>
                      </Link>
                    </div>
                  )}

                  {/* actions */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 10 }}>
                    <button
                      className={`chip${voted === 'up' ? ' active' : ''}`}
                      onClick={() => vote(post.id, +1)}
                      title="Like"
                      aria-label="Like"
                      style={{ borderColor: voted === 'up' ? BRAND : undefined, color: voted === 'up' ? BRAND : undefined }}
                    >
                      <span aria-hidden>            </span><span>Like</span>
                    </button>

                    <button
                      className={`chip${voted === 'down' ? ' active' : ''}`}
                      onClick={() => vote(post.id, -1)}
                      title="Dislike"
                      aria-label="Dislike"
                    >
                      <span aria-hidden>       </span><span>Dislike</span>
                    </button>

                    <Link
                      href={`/post/${post.id}#comments`}
                      className="chip"
                      title="Comments"
                      aria-label="Comments"
                      style={{ textDecoration: 'none' }}
                    >
                      <span aria-hidden>      </span><span>Comments</span>
                    </Link>

                    <button className="chip" onClick={() => share(post.id)} title="Share" aria-label="Share">
                      <span aria-hidden>       </span><span>Share</span>
                    </button>

                    <button
                      className={`chip${saved ? ' active' : ''}`}
                      onClick={() => toggleSave(post.id)}
                      title={saved ? 'Saved' : 'Save'}
                      aria-label={saved ? 'Unsave' : 'Save'}
                    >
                      <span aria-hidden>       </span><span>{saved ? 'Saved' : 'Save'}</span>
                    </button>

                    <span className="meta-pill" style={{ marginLeft: 'auto' }}>
                                   {getScore(post)}                {post.commentsCount}
                    </span>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>

        {/* sentinel + fixed-height status row */}
        <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />
        <div style={{ height: 36, display: 'grid', placeItems: 'center', opacity: 0.9 }}>
          {loading && hasMore && <div className="small-muted">Loading       </div>}
          {!loading && !hasMore && safePosts.length > 0 && (
            <div className="small-muted" style={{ opacity: 0.75 }}>You       ve reached the end</div>
          )}
        </div>
      </main>
    </>
  );
}



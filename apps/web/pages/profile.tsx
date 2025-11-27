'use client';

import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';

/* ---------- types / helpers you already had ---------- */
type CardPost = {
  id: string;
  userName: string;
  content: string | null;
  mediaUrl?: string | null;
  createdAt: string;
  likeCount: number;
  commentsCount: number;
};

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'y', 'on', 't']);
const SAVE_KEY_RX = /^(?:whistle(?::|-))?(?:save|saved)(?::|-)(.+)$/i;

const num = (x: any) => (typeof x === 'number' && !isNaN(x) ? x : 0);
const timeAgo = (ts?: string) => {
  try {
    const d = ts ? new Date(ts) : new Date();
    const diff = Date.now() - d.getTime();
    const mins = Math.max(1, Math.round(diff / 60000));
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    return `${days}d ago`;
  } catch { return 'just now'; }
};

function normalizeRow(raw: any): CardPost | null {
  if (!raw) return null;
  const id = raw.id ?? raw.postId ?? raw._id;
  if (!id) return null;
  const mediaUrl =
    raw.mediaUrl || raw.media?.url || raw.imageUrl ||
    (Array.isArray(raw.images) && raw.images[0]?.url) || null;

  const userName =
    raw.user?.username || raw.username || raw.user?.name || raw.displayName ||
    (raw.userEmail ? String(raw.userEmail).split('@')[0] : 'user');

  const likeCount =
    num(raw.likesCount) || num(raw.likes) ||
    (Array.isArray(raw.votes) ? raw.votes.filter((v: any) => v?.value > 0).length : 0);

  const commentsCount =
    num(raw.commentsCount) ||
    (Array.isArray(raw.comments) ? raw.comments.length : (raw._count?.comments ?? 0));

  return {
    id: String(id),
    userName,
    content: raw?.content ?? raw?.text ?? raw?.body ?? null,
    mediaUrl,
    createdAt: (raw?.createdAt ?? raw?.created_at ?? new Date().toISOString()) as string,
    likeCount,
    commentsCount,
  };
}

/* Saved IDs from LocalStorage */
function getSavedIdsFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  const ids: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) || '';
    const m = SAVE_KEY_RX.exec(key);
    if (!m) continue;
    const val = (localStorage.getItem(key) || '').toLowerCase().trim();
    if (TRUE_VALUES.has(val)) ids.push(m[1]);
  }
  return Array.from(new Set(ids));
}

/* Server-saved IDs (new) */
async function fetchServerSavedIds(): Promise<string[]> {
  try {
    const r = await fetch('/api/saved', { credentials: 'same-origin' });
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j?.ids) ? j.ids.map(String) : [];
  } catch { return []; }
}

/* "your posts" helper */
type AnyPost = Record<string, any>;
const norm = (s?: string) => (s ?? '').trim().toLowerCase();
function isMine(p: AnyPost, session: any) {
  const email = norm(session?.user?.email);
  const userId = norm((session as any)?.user?.id);
  const name = norm(session?.user?.name);
  const emailPrefix = email ? email.split('@')[0] : '';
  const postEmail = norm(p.userEmail || p.email || p.authorEmail || p.user?.email || p.author?.email);
  if (email && postEmail && email === postEmail) return true;
  const postId = norm(p.userId || p.authorId || p.ownerId || p.user?.id || p.author?.id);
  if (userId && postId && userId === postId) return true;
  const postUserName = norm(
    p.username || p.userName || p.displayName || p.user?.username || p.user?.name || p.author?.username || p.author?.name
  );
  if (postUserName) {
    if (name && postUserName === name) return true;
    if (emailPrefix && postUserName === norm(emailPrefix)) return true;
  }
  return false;
}

/* =================================================
   Profile
================================================= */
type TabKey = 'saved' | 'mine';

export default function ProfilePage() {
  const { data: session, status } = useSession();

  /* saved */
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savedPosts, setSavedPosts] = useState<CardPost[] | null>(null);
  const [savedError, setSavedError] = useState('');

  /* mine */
  const [allPosts, setAllPosts] = useState<AnyPost[] | null>(null);
  const [myError, setMyError] = useState('');

  /* tabs */
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (typeof window === 'undefined') return 'saved';
    const t = localStorage.getItem('whistle:profile-tab');
    return (t === 'mine' || t === 'saved') ? (t as TabKey) : 'saved';
  });
  const setTab = useCallback((t: TabKey) => {
    setActiveTab(t);
    try { localStorage.setItem('whistle:profile-tab', t); } catch {}
  }, []);

  /* saved: load */
  const refreshSavedIds = useCallback(() => setSavedIds(getSavedIdsFromStorage()), []);
  const loadSaved = useCallback(async (ids: string[]) => {
    setSavedPosts(null);
    setSavedError('');
    if (!ids.length) { setSavedPosts([]); return; }
    try {
      const q = encodeURIComponent(ids.join(','));
      const r = await fetch(`/api/posts?ids=${q}`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const arr: any[] = Array.isArray(data) ? data : (data.posts || data.items || []);
      const rows = arr.map(normalizeRow).filter(Boolean) as CardPost[];

      // keep Saved order
      const order = new Map(ids.map((id, i) => [id, i]));
      rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

      setSavedPosts(rows);
    } catch (e) {
      console.error('Saved load error:', e);
      setSavedError('Couldn’t load your saved posts.');
      setSavedPosts([]);
    }
  }, []);

  useEffect(() => { refreshSavedIds(); }, [refreshSavedIds]);
  useEffect(() => { loadSaved(savedIds); }, [savedIds, loadSaved]);

  // live refresh from other tabs/pages when saving
  useEffect(() => {
    const onMut = () => refreshSavedIds();
    const onStorage = (e: StorageEvent) => {
      if (e.key && (SAVE_KEY_RX.test(e.key) || e.key === 'whistle:posts-mutated')) {
        refreshSavedIds();
      }
    };
    window.addEventListener('whistle:posts-mutated', onMut as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('whistle:posts-mutated', onMut as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, [refreshSavedIds]);

  // merge server-saved IDs into LocalStorage (only when logged in)
  useEffect(() => {
    let canceled = false;
    (async () => {
      if (!session?.user?.email) return;
      const serverIds = await fetchServerSavedIds();
      if (canceled || !serverIds.length) return;
      try {
        serverIds.forEach(id => localStorage.setItem(`whistle:save:${id}`, '1'));
        window.dispatchEvent(new Event('whistle:posts-mutated'));
      } catch {}
      refreshSavedIds();
    })();
    return () => { canceled = true; };
  }, [session, refreshSavedIds]);

  function unsave(id: string) {
    try {
      const variants = [
        `whistle:save:${id}`, `whistle:saved:${id}`,
        `whistle-save-${id}`, `save:${id}`, `saved:${id}`
      ];
      variants.forEach(k => localStorage.setItem(k, '0'));
      setSavedPosts((cur) => (cur ? cur.filter((p) => p.id !== id) : cur));
      setSavedIds((cur) => cur.filter((x) => x !== id));
      window.dispatchEvent(new Event('whistle:posts-mutated'));
      try { localStorage.setItem('whistle:posts-mutated', String(Date.now())); } catch {}
      fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ postId: id, action: 'unsave' }),
      }).catch(()=>{});
    } catch {}
  }

  const toggleSaveMine = useCallback(async (id: string) => {
    if (!id) return;
    const currentlySaved = savedIds.includes(id);
    const next = !currentlySaved;

    try {
      const variants = [
        `whistle:save:${id}`, `whistle:saved:${id}`,
        `whistle-save-${id}`, `save:${id}`, `saved:${id}`
      ];
      variants.forEach((k) => localStorage.setItem(k, next ? '1' : '0'));
      window.dispatchEvent(new Event('whistle:posts-mutated'));
      try {
        localStorage.setItem('whistle:posts-mutated', String(Date.now()));
      } catch {}
    } catch {}

    setSavedIds((cur) => {
      const has = cur.includes(id);
      if (next) return has ? cur : [...cur, id];
      return cur.filter((x) => x !== id);
    });

    try {
      await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ postId: id, action: 'toggle' }),
      });
    } catch {
      // best-effort only
    }
  }, [savedIds]);

  /* mine: fetch + filter */
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        let res = await fetch('/api/posts?user=me');
        let data: any = res.ok ? await res.json() : undefined;
        if (!Array.isArray(data) && !Array.isArray(data?.items) && !Array.isArray(data?.posts)) {
          res = await fetch('/api/posts');
          if (!res.ok) throw new Error('API error');
          data = await res.json();
        }
        const items: AnyPost[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.items) ? data.items
          : Array.isArray(data?.posts) ? data.posts
          : [];
        if (!canceled) setAllPosts(items);
      } catch (e) {
        console.error(e);
        if (!canceled) { setMyError("Couldn't load posts."); setAllPosts([]); }
      }
    })();
    return () => { canceled = true; };
  }, []);

  const myPosts = useMemo(
    () => (!allPosts || !session?.user) ? [] : allPosts.filter((p) => isMine(p, session)),
    [allPosts, session]
  );

  const savedCount = savedPosts?.length ?? 0;
  const mineCount = myPosts.length;

  return (
    <>
      <Head><title>Whistle — Profile</title></Head>

      <main className="feed-wrap">
        <h1 style={{ margin: '8px 0 10px', fontWeight: 900 }}>
          {session?.user?.name || session?.user?.email?.split('@')[0] || 'Your profile'}
        </h1>

        {status === 'loading' && <p style={{ color: '#6b7280' }}>Loading session…</p>}

        {status === 'unauthenticated' && (
          <div className="form-card" style={{ padding: 16 }}>
            <p style={{ margin: 0, color: '#334155' }}>
              You&apos;re not signed in. Please{' '}
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); signIn(undefined, { callbackUrl: '/profile' }); }}
                style={{ color: '#0F5132', fontWeight: 700, textDecoration: 'underline' }}
              >
                log in
              </a>{' '}
              to view your profile.
            </p>
          </div>
        )}

        {status === 'authenticated' && (
          <>
            {/* Tabs bar */}
            <div className="profile-tabs" role="tablist" aria-label="Profile sections">
              <button
                id="tab-saved"
                className={`tab ${activeTab === 'saved' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === 'saved'}
                aria-controls="panel-saved"
                onClick={() => setTab('saved')}
                onKeyDown={(e) => { if (e.key === 'ArrowRight') setTab('mine'); }}
              >
                Saved <span className="badge">{savedCount}</span>
              </button>
              <button
                id="tab-mine"
                className={`tab ${activeTab === 'mine' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === 'mine'}
                aria-controls="panel-mine"
                onClick={() => setTab('mine')}
                onKeyDown={(e) => { if (e.key === 'ArrowLeft') setTab('saved'); }}
              >
                Your posts <span className="badge">{mineCount}</span>
              </button>
            </div>

            {/* Saved */}
            {activeTab === 'saved' && (
              <section id="panel-saved" role="tabpanel" aria-labelledby="tab-saved">
                {savedError && <p style={{ color: '#dc2626', marginTop: 4 }}>{savedError}</p>}
                {savedPosts === null ? (
                  <p style={{ color: '#6b7280' }}>Loading your saved posts…</p>
                ) : savedPosts.length === 0 ? (
                  <div className="comment-empty">You haven’t saved any posts yet.</div>
                ) : (
                  <ul className="feed-list">
                    {savedPosts.map((p) => (
                      <li key={p.id}>
                        <article className="post-card">
                          <div className="post-head">
                            <span className="post-avatar">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src="/icons/whistle-glow-512.png" alt="" width={24} height={24} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                            </span>
                            <span className="post-user">{p.userName}</span>
                            <span className="post-time">• {timeAgo(p.createdAt)}</span>
                            <button
                              onClick={() => unsave(p.id)}
                              className="chip"
                              style={{ marginLeft: 'auto' }}
                              title="Remove from saved"
                              aria-label="Remove from saved"
                            >
                              Unsave
                            </button>
                          </div>
                          {p.content && <div className="post-content">{p.content}</div>}
                          {p.mediaUrl ? (
                            <div className="feed-media">
                              <Link href={`/post/${p.id}`} className="feed-media-link" aria-label="Open post">
                                <div className="feed-media-inner">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={p.mediaUrl} alt="" />
                                </div>
                              </Link>
                            </div>
                          ) : null}
                          <div className="post-meta">
                            <span className="meta-pill" aria-label={`${p.likeCount} likes`} title={`${p.likeCount} likes`}>❤️ {p.likeCount}</span>
                            <span className="meta-pill" aria-label={`${p.commentsCount} comments`} title={`${p.commentsCount} comments`}>💬 {p.commentsCount}</span>
                            <Link href={`/post/${p.id}`} className="view-link">View post →</Link>
                          </div>
                        </article>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* Mine */}
            {activeTab === 'mine' && (
              <section id="panel-mine" role="tabpanel" aria-labelledby="tab-mine">
                {myError && <p style={{ color: '#dc2626' }}>{myError}</p>}
                {allPosts === null ? (
                  <p style={{ color: '#6b7280' }}>Loading your posts…</p>
                ) : myPosts.length === 0 ? (
                  <div className="comment-empty">You haven’t posted yet.</div>
                ) : (
                  <ul className="feed-list">
                    {myPosts.map((p) => {
                      const createdAt = p.createdAt || p.timestamp || p.created_at || new Date().toISOString();
                      const mediaUrl =
                        p.mediaUrl || p.media?.url || p.imageUrl ||
                        (Array.isArray(p.images) && p.images[0]?.url) || null;
                      const userName = p.user?.username || p.username || p.user?.name || p.displayName || 'you';
                      const likes = num(p.likesCount) || num(p.likes) ||
                        (Array.isArray(p.votes) ? p.votes.filter((v: any) => v?.value > 0).length : 0);
                      const comments = num(p.commentsCount) || (Array.isArray(p.comments) ? p.comments.length : 0);
                      const isSaved = savedIds.includes(String(p.id));

                      return (
                        <li key={p.id}>
                          <article className="post-card">
                            <div className="post-head">
                              <span className="post-avatar">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/icons/whistle-glow-512.png" alt="" width={24} height={24} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                              </span>
                              <span className="post-user">{userName}</span>
                              <span className="post-time">• {timeAgo(createdAt)}</span>
                              <button
                                type="button"
                                onClick={() => toggleSaveMine(String(p.id))}
                                className="chip"
                                style={{ marginLeft: 'auto', marginRight: 8 }}
                                title={isSaved ? 'Saved' : 'Save'}
                                aria-label={isSaved ? 'Unsave post' : 'Save post'}
                              >
                                {isSaved ? 'Saved' : 'Save'}
                              </button>
                              <Link href={`/post/${p.id}`} className="view-link">View post →</Link>
                            </div>
                            {p.title ? <div style={{ fontWeight: 700, marginBottom: 6 }}>{p.title}</div> : null}
                            {p.content ? <div className="post-content">{p.content}</div> : null}
                            {mediaUrl ? (
                              <div className="feed-media">
                                <Link href={`/post/${p.id}`} className="feed-media-link" aria-label="Open post">
                                  <div className="feed-media-inner">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={mediaUrl} alt="" />
                                  </div>
                                </Link>
                              </div>
                            ) : null}
                            <div className="post-meta">
                              <span className="meta-pill" aria-label={`${likes} likes`} title={`${likes} likes`}>❤️ {likes}</span>
                              <span className="meta-pill" aria-label={`${comments} comments`} title={`${comments} comments`}>💬 {comments}</span>
                              <Link href={`/post/${p.id}`} className="view-link">View post →</Link>
                            </div>
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
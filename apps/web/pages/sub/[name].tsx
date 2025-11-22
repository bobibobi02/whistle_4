// pages/sub/[name].tsx
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import PostCard from '@/components/post-card/PostCard';
function adaptToPostCardProps(p:any){
  return {
    postId: p.id,
    user: p.user ?? { name: (p.userEmail||"user").split("@")[0] },
    timestamp: p.createdAt ?? new Date().toISOString(),
    ...p,
  };
}

type Post = {
  id: string;
  title?: string | null;
  content?: string | null;
  mediaUrl?: string | null;
  userEmail?: string | null;
  createdAt?: string;
  likesCount?: number;
  score?: number;
  commentsCount?: number;
  _count?: { comments: number };
};

type ApiResp = { items?: Post[]; nextCursor?: string | null; error?: string };

async function safeJson(r: Response): Promise<ApiResp> {
  const txt = await r.text();
  try { return JSON.parse(txt); } catch { return { error: txt || `Bad response ${r.status}` }; }
}

function titleCase(s: string) {
  return s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function SubforumPage() {
  const router = useRouter();
  const nameParam = (router.query.name as string) || '';
  const name = decodeURIComponent(nameParam);

  const [sort, setSort] = useState<'latest' | 'popular'>('latest');
  const [items, setItems] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const LIMIT = 12;
  const WINDOW = '7d';
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const dedup = useRef<Set<string>>(new Set());

  const resetAndLoad = useCallback((mode: 'latest' | 'popular') => {
    setSort(mode);
    setItems([]);
    setCursor(null);
    setDone(false);
    setError(null);
    dedup.current = new Set();
  }, []);

  const fetchPage = useCallback(async () => {
    if (!name) return;
    if (loading || done) return;
    setLoading(true);
    setError(null);

    try {
      const qs = new URLSearchParams();
      qs.set('limit', String(LIMIT));
      qs.set('sort', sort);
      if (sort === 'popular') qs.set('window', WINDOW);
      if (cursor) qs.set('cursor', cursor);

      const r = await fetch(`/api/subforum/${encodeURIComponent(name)}?${qs.toString()}`, { cache: 'no-store' });
      const j = await safeJson(r);
      if (!r.ok) throw new Error(j?.error || 'Failed to load');

      const page = Array.isArray(j.items) ? j.items : [];
      const next = j.nextCursor ?? null;

      const clean = page.filter(p => {
        if (!p?.id) return false;
        if (dedup.current.has(p.id)) return false;
        dedup.current.add(p.id);
        return true;
      });

      setItems(prev => [...prev, ...clean]);
      setCursor(next);
      if (!next || clean.length === 0) setDone(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [name, sort, cursor, loading, done]);

  // Load on mount & when subforum changes
  useEffect(() => {
    if (!name) return;
    resetAndLoad('latest');
  }, [name, resetAndLoad]);

  // Load page whenever cursor resets (first page) or sort changes
  useEffect(() => {
    if (!name) return;
    // kick initial fetch when items cleared
    if (items.length === 0 && !loading && !done) fetchPage();
  }, [name, sort, items.length, loading, done, fetchPage]);

  // infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e.isIntersecting) fetchPage();
    }, { rootMargin: '600px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [fetchPage]);

  return (
    <>
      <Head>
        <title>{titleCase(name)}  Subforum</title>
        <meta name="description" content={`Posts in ${name} subforum`} />
      </Head>

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '16px 12px 60px' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>{titleCase(name)}</h1>

          <div style={{ display: 'inline-flex', gap: 8 }}>
            <button
              onClick={() => resetAndLoad('latest')}
              aria-pressed={sort === 'latest'}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #333',
                background: sort === 'latest' ? '#222' : 'transparent',
                color: sort === 'latest' ? 'white' : 'inherit',
                cursor: 'pointer',
              }}
            >
              Latest
            </button>
            <button
              onClick={() => resetAndLoad('popular')}
              aria-pressed={sort === 'popular'}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #333',
                background: sort === 'popular' ? '#222' : 'transparent',
                color: sort === 'popular' ? 'white' : 'inherit',
                cursor: 'pointer',
              }}
            >
              Popular (last {WINDOW})
            </button>
          </div>
        </header>

        {items.length === 0 && loading ? (
          <div className="meta-pill" style={{ marginTop: 8 }}>Loading</div>
        ) : null}

        {error ? (
          <div className="meta-pill" style={{ marginTop: 8, color: '#fecaca' }}>
            {error}
          </div>
        ) : null}

        <div style={{ display: 'grid', gap: 16 }}>
          {items.map((p) => (
            <PostCard key={p.id} {...adaptToPostCardProps(p)} />
          ))}
        </div>

        {!done && <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />}

        {loading && items.length > 0 ? (
          <div className="meta-pill" style={{ marginTop: 12 }}>Loading more</div>
        ) : null}

        {done && items.length === 0 ? (
          <div className="meta-pill" style={{ marginTop: 8 }}>No posts yet.</div>
        ) : null}

        {done && items.length > 0 ? (
          <div className="meta-pill" style={{ marginTop: 12 }}>Youre all caught up.</div>
        ) : null}
      </main>
    </>
  );
}

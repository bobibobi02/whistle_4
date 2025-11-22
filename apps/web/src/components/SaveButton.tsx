// components/SaveButton.tsx
import { useEffect, useState, useCallback } from 'react';

type Props = { postId: string; className?: string };

const KEY = (id: string) => `whistle:save:${id}`;
const EVENT = 'whistle:posts-mutated';

export default function SaveButton({ postId, className }: Props) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  // Fast local state, then confirm with server
  useEffect(() => {
    let cancelled = false;

    // localStorage first (instant UI)
    try {
      setSaved(localStorage.getItem(KEY(postId)) === '1');
    } catch {}

    // server truth
    (async () => {
      try {
        const res = await fetch(`/api/saved?postId=${encodeURIComponent(postId)}`, {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data.saved === 'boolean') {
          setSaved(!!data.saved);
          try {
            localStorage.setItem(KEY(postId), data.saved ? '1' : '0');
            window.dispatchEvent(new CustomEvent(EVENT, { detail: { type: 'save-sync', postId, saved: data.saved } }));
          } catch {}
        }
      } catch {}
    })();

    const onMutate = () => {
      try {
        setSaved(localStorage.getItem(KEY(postId)) === '1');
      } catch {}
    };
    window.addEventListener(EVENT, onMutate as EventListener);
    window.addEventListener('storage', onMutate as EventListener);

    return () => {
      cancelled = true;
      window.removeEventListener(EVENT, onMutate as EventListener);
      window.removeEventListener('storage', onMutate as EventListener);
    };
  }, [postId]);

  const toggle = useCallback(async () => {
    if (busy) return;
    const next = !saved;
    setBusy(true);
    setSaved(next);

    // optimistic local echo + cross-tab notify
    try {
      localStorage.setItem(KEY(postId), next ? '1' : '0');
      window.dispatchEvent(new CustomEvent(EVENT, { detail: { type: 'save', postId, saved: next } }));
    } catch {}

    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ postId, action: 'toggle' }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (typeof data.saved === 'boolean') setSaved(!!data.saved);
      } else {
        // revert on failure
        setSaved(!next);
        try { localStorage.setItem(KEY(postId), !next ? '1' : '0'); } catch {}
        const err = await res.json().catch(() => ({}));
        alert(err?.error || `Save failed (${res.status})`);
      }
    } catch {
      setSaved(!next);
      try { localStorage.setItem(KEY(postId), !next ? '1' : '0'); } catch {}
      alert('Network error while saving.');
    } finally {
      setBusy(false);
    }
  }, [busy, postId, saved]);

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={className ?? 'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm'}
      aria-pressed={saved}
      title={saved ? 'Unsave' : 'Save'}
    >
      {saved ? 'Saved' : 'Save Post'}
    </button>
  );
}

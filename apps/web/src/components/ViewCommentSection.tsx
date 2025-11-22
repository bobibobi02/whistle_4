// apps/web/src/components/ViewCommentSection.tsx
import React, { useMemo, useState } from 'react';

type Props = {
  username: string;
  timeAgo: string;         // e.g. "8 days ago"
  score?: number;          // post score / votes
  likes?: number;
  commentsCount?: number;

  onSubmit?: (text: string) => Promise<void> | void;
  submitting?: boolean;

  onShare?: () => void;
  onSave?: () => void;
  saved?: boolean;
};

export default function ViewCommentSection({
  username,
  timeAgo,
  score = 0,
  likes = 0,
  commentsCount = 0,
  onSubmit,
  submitting = false,
  onShare,
  onSave,
  saved = false,
}: Props) {
  const [text, setText] = useState('');
  const canPost = text.trim().length > 0 && !submitting;

  const submit = async () => {
    if (!canPost) return;
    await onSubmit?.(text.trim());
    setText('');
  };

  const saveLabel = useMemo(() => (saved ? 'Saved' : 'Save'), [saved]);

  return (
    <section className="w-full">
      {/* Username pill */}
      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500 text-white px-4 py-2">
        <UserIcon className="h-5 w-5 opacity-90" />
        <span className="font-semibold">{username}</span>
      </div>

      {/* Time ago */}
      <div className="mt-4 text-lg text-neutral-800">{timeAgo}</div>

      {/* Score (big number like in the mock) */}
      <div className="mt-6 text-4xl font-extrabold tracking-tight text-neutral-900">
        {score}
      </div>

      {/* Reactions row */}
      <div className="mt-3 flex items-center gap-3">
        <Badge count={likes} icon={<HeartIcon className="h-5 w-5" />} />
        <Badge count={commentsCount} icon={<CommentIcon className="h-5 w-5" />} />
      </div>

      {/* Comment input */}
      <div className="mt-6 rounded-2xl border-2 border-emerald-500/90 px-4 py-3">
        <textarea
          rows={3}
          className="w-full resize-y bg-transparent outline-none placeholder-neutral-400 text-neutral-900"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment"
        />
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          onClick={submit}
          disabled={!canPost}
          className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-white font-semibold shadow-sm hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          Add a comment
        </button>

        <button
          onClick={onShare}
          className="inline-flex items-center gap-2 rounded-2xl border-2 border-emerald-500 px-4 py-2 text-emerald-700 hover:bg-emerald-50 transition"
        >
          <ShareIcon className="h-5 w-5" />
        </button>

        <button
          onClick={onSave}
          className="inline-flex items-center gap-2 rounded-2xl border-2 border-emerald-500 px-4 py-2 text-emerald-700 hover:bg-emerald-50 transition"
        >
          <BookmarkIcon className="h-5 w-5" />
          <span className="font-semibold">{saveLabel}</span>
        </button>
      </div>
    </section>
  );
}

/* ---------- tiny UI helpers ---------- */

function Badge({ count, icon }: { count: number | string; icon: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-500 px-3 py-1.5 text-neutral-900">
      {icon}
      <span className="font-semibold">{count}</span>
    </div>
  );
}

/* ---------- inline icons (no library needed) ---------- */

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="2" d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" />
    </svg>
  );
}
function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="2" d="M12 21s-7.5-4.438-9.5-8.5A5.5 5.5 0 0 1 12 6.5a5.5 5.5 0 0 1 9.5 6c-2 4.062-9.5 8.5-9.5 8.5Z" />
    </svg>
  );
}
function CommentIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="2" d="M21 12a8 8 0 0 1-8 8H7l-4 3v-5a8 8 0 1 1 18-6Z" />
    </svg>
  );
}
function ShareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="2" d="M4 12v7a1 1 0 0 0 1 1h7M20 12V5a1 1 0 0 0-1-1h-7M20 4 4 20" />
    </svg>
  );
}
function BookmarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="2" d="M6 4h12v17l-6-3-6 3V4Z" />
    </svg>
  );
}

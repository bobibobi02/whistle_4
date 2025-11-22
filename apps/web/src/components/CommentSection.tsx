'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Pencil, Trash2, CornerDownRight } from 'lucide-react';

// Fallback editor state for body text
/* =========================
   Types & Normalizers
========================= */

export type CommentNode = {
  id: string;
  body: string;
  userEmail: string | null;
  userName?: string | null;
  createdAt?: string;
  parentId?: string | null;
  children?: CommentNode[];
  replies?: CommentNode[]; // some API variants
};

function normalizeNode(n: CommentNode): CommentNode {
  const kids = (n.children ?? n.replies ?? []).map(normalizeNode);
  return { ...n, children: kids };
}
function normalizeTree(nodes?: CommentNode[]): CommentNode[] {
  return (nodes ?? []).map(normalizeNode);
}
function getChildren(n: CommentNode) {
  const [content, setContent] = useState("");

  return n.children ?? [];
}

/* =========================
   API helpers (with fallbacks)
========================= */

async function apiFetchComments(postId: string): Promise<CommentNode[]> {
  let res = await fetch(`/api/posts/${postId}/comments`, { cache: 'no-store', credentials: 'same-origin' });
  if (!res.ok) {
    res = await fetch(`/api/comments?postId=${encodeURIComponent(postId)}`, {
      cache: 'no-store',
      credentials: 'same-origin',
    });
  }
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  const list: CommentNode[] = Array.isArray(data) ? data : data.items ?? data.tree ?? data.comments ?? [];
  return normalizeTree(list);
}

async function apiCreate(postId: string, body: string, parentId?: string) {
  const payload = parentId ? { body: (typeof window!=='undefined'?((document.getElementById('comment-input') as HTMLTextAreaElement|null)?.value ?? ''):''), parentId } : { body: (typeof window!=='undefined'?((document.getElementById('comment-input') as HTMLTextAreaElement|null)?.value ?? ''):'') };
  let res = await fetch(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    res = await fetch(`/api/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ postId, ...payload }),
    });
  }
  if (!res.ok) throw new Error(`Failed to post comment (${res.status})`);
}

async function apiEdit(postId: string, id: string, body: string) {
  let res = await fetch(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-http-method-override': 'PATCH',
    },
    credentials: 'same-origin',
    body: JSON.stringify({ id, body: (typeof window!=='undefined'?((document.getElementById('comment-input') as HTMLTextAreaElement|null)?.value ?? ''):'') }),
  });
  if (!res.ok) {
    res = await fetch(`/api/comments`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ id, body: (typeof window!=='undefined'?((document.getElementById('comment-input') as HTMLTextAreaElement|null)?.value ?? ''):'') }),
    });
  }
  if (!res.ok) throw new Error(`Failed to edit comment (${res.status})`);
}

async function apiDelete(postId: string, id: string) {
  let res = await fetch(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-http-method-override': 'DELETE',
    },
    credentials: 'same-origin',
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    res = await fetch(`/api/comments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ id }),
    });
  }
  if (!res.ok) throw new Error(`Failed to delete comment (${res.status})`);
}

/* =========================
   Main Section Component
========================= */

export default function CommentSection({ postId }: { postId: string }) {
  const { data: session } = useSession();
  const me = useMemo(() => (session?.user?.email || '').trim().toLowerCase(), [session?.user?.email]);

  const [tree, setTree] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // root composer
  const [composer, setComposer] = useState('');
  const canSend = composer.trim().length > 0;

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const list = await apiFetchComments(postId);
      setTree(list);
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (!postId) return;
    load();
  }, [postId, load]);

  const sendRoot = async () => {
    const text = composer.trim();
    if (!text) return;
    setComposer('');
    try {
      await apiCreate(postId, text);
      await load();
    } catch (e: any) {
      setComposer(text);
      alert(e?.message || 'Could not post comment.');
    }
  };

  return (
    <section className="mt-6">
      {/* Root composer (matches the older look) */}
      <div className="mb-4 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
        <textarea
          value={composer}
          onChange={(e) => setComposer(e.target.value)}
          placeholder="Write a comment  "
          rows={3}
          className="w-full resize-y rounded-lg border border-neutral-200 bg-white p-3 text-[15px] outline-none focus:border-emerald-500 dark:border-neutral-800 dark:bg-neutral-950"
        />
        <div className="mt-2 flex items-center justify-end">
          <button
            onClick={sendRoot}
            disabled={!canSend}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-[#22C55E] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            Add a comment
          </button>
        </div>
      </div>

      {loading && <div className="text-sm text-neutral-500">Loading  </div>}
      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {err}
        </div>
      )}

      {/* Render roots; each node handles its own children recursively */}
      <div className="space-y-3">
        {tree
          .filter((c) => !c.parentId)
          .map((c) => (
            <CommentCard
              key={c.id}
              node={c}
              me={me}
              postId={postId}
              onRefresh={load}
            />
          ))}
      </div>
    </section>
  );
}

/* =========================
   Merged "Comment" UI (old look)
========================= */

function CommentCard({
  node,
  me,
  postId,
  onRefresh,
  depth = 0,
}: {
  node: CommentNode;
  me: string;
  postId: string;
  onRefresh: () => Promise<void> | void;
  depth?: number;
}) {
  const isOwner = !!node.userEmail && node.userEmail.toLowerCase() === me;

  // local states for this comment
  const [isReplying, setIsReplying] = useState(false);
  const [replyValue, setReplyValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.body ?? "");

  const initials =
    (node.userName || node.userEmail || 'U').trim().slice(0, 1).toUpperCase() || 'U';

  const timestamp = node.createdAt
    ? new Date(node.createdAt).toLocaleString()
    : '';

  const commitReply = async () => {
    const text = replyValue.trim();
    if (!text) return;
    setReplyValue('');
    try {
      await apiCreate(postId, text, node.id);
      setIsReplying(false);
      await onRefresh();
    } catch (e: any) {
      setReplyValue(text);
      alert(e?.message || 'Could not add reply.');
    }
  };

  const commitEdit = async () => {
    const text = editValue.trim();
    if (!text) return;
    try {
      await apiEdit(postId, node.id, text);
      setIsEditing(false);
      await onRefresh();
    } catch (e: any) {
      alert(e?.message || 'Could not save edit.');
    }
  };

  const commitDelete = async () => {
    const ok = confirm('Delete this comment?');
    if (!ok) return;
    try {
      await apiDelete(postId, node.id);
      await onRefresh();
    } catch (e: any) {
      alert(e?.message || 'Could not delete comment.');
    }
  };

  return (
    <div>
      {/* Comment card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
        {/* Header */}
        <div className="mb-2 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {node.userName || node.userEmail || 'User'}
              </span>
              {timestamp && (
                <span className="truncate text-xs text-neutral-500">{timestamp}</span>
              )}
            </div>

            {/* Content / Edit */}
            {!isEditing ? (
              <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
                {node.body ?? ""}
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                <textarea
                  className="w-full rounded-lg border border-neutral-200 bg-white p-2 text-sm outline-none focus:border-emerald-500 dark:border-neutral-800 dark:bg-neutral-950"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={commitEdit}
                    className="inline-flex h-8 items-center justify-center rounded-lg bg-[#22C55E] px-3 text-sm font-medium text-white"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditValue(node.body ?? "");
                    }}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-neutral-200 px-3 text-sm dark:border-neutral-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-2 flex items-center gap-2 text-sm">
              <button
                onClick={() => setIsReplying((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
                title="Reply"
              >
                <CornerDownRight className="h-4 w-4" />
                Reply
              </button>

              {isOwner && (
                <>
                  <button
                    onClick={() => setIsEditing((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={commitDelete}
                    className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </>
              )}
            </div>

            {/* Reply editor */}
            {isReplying && (
              <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
                <textarea
                  value={replyValue}
                  onChange={(e) => setReplyValue(e.target.value)}
                  placeholder="Write a reply  "
                  rows={3}
                  className="w-full resize-y rounded-lg border border-neutral-200 bg-white p-2 text-sm outline-none focus:border-emerald-500 dark:border-neutral-800 dark:bg-neutral-950"
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={commitReply}
                    disabled={!replyValue.trim()}
                    className="inline-flex h-8 items-center justify-center rounded-lg bg-[#22C55E] px-3 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => {
                      setIsReplying(false);
                      setReplyValue('');
                    }}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-neutral-200 px-3 text-sm dark:border-neutral-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {getChildren(node).length > 0 && (
        <div className="ml-4 mt-3 space-y-3">
          {getChildren(node).map((child) => (
            <CommentCard
              key={child.id}
              node={child}
              me={me}
              postId={postId}
              onRefresh={onRefresh}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}


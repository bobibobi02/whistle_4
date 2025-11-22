// src/components/Comment.tsx
import { useState } from 'react';

type CommentModel = {
  id: string;
  postId: string;
  parentId?: string | null;
  userEmail?: string | null;
  body: string;
};

export default function Comment({ comment, userId, postId }: { comment: CommentModel; userId?: string; postId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(comment.body);
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [busy, setBusy] = useState<'save' | 'delete' | 'reply' | null>(null);

  async function saveEdit() {
    if (!text.trim()) return;
    try {
      setBusy('save');
      await fetch('/api/comments/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: comment.id, body: text }), // body (not content)
      });
      setIsEditing(false);
      // TODO: swap to SWR/React Query mutate for no-reload UX
      location.reload();
    } finally {
      setBusy(null);
    }
  }

  async function deleteComment() {
    try {
      setBusy('delete');
      await fetch('/api/comments/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: comment.id }),
      });
      location.reload();
    } finally {
      setBusy(null);
    }
  }

  async function handleReplySubmit() {
    const body = replyContent.trim();
    if (!body) return;

    try {
      setBusy('reply');
      await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body,           // body (not content)
          postId,
          parentId: comment.id,
        }),
      });
      setReplyContent('');
      setShowReply(false);
      location.reload(); // consider optimistically updating
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="border p-3 rounded mb-2">
      {isEditing ? (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full border p-2 mb-2 rounded"
            rows={3}
          />
          <div className="flex items-center gap-2">
            <button
              disabled={busy === 'save'}
              onClick={saveEdit}
              className="mr-2 bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-60"
            >
              {busy === 'save' ? 'Saving' : 'Save'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 text-white px-3 py-1 rounded"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="whitespace-pre-wrap break-words">{comment.body}</p>
          <div className="mt-2 flex gap-3 text-sm">
            <button
              onClick={() => setShowReply((v) => !v)}
              className="text-green-600 hover:underline"
            >
              Reply
            </button>
            {userId && (
              <>
                <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:underline">
                  Edit
                </button>
                <button
                  disabled={busy === 'delete'}
                  onClick={deleteComment}
                  className="text-red-600 hover:underline disabled:opacity-60"
                >
                  {busy === 'delete' ? 'Deleting' : 'Delete'}
                </button>
              </>
            )}
          </div>
        </>
      )}

      {showReply && (
        <div className="ml-4 mt-2">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Write your reply"
            rows={3}
          />
          <button
            disabled={busy === 'reply'}
            onClick={handleReplySubmit}
            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-60"
          >
            {busy === 'reply' ? 'Posting' : 'Post Reply'}
          </button>
        </div>
      )}
    </div>
  );
}


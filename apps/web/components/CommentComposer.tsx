import { useCallback, useState } from "react";
import { useToast } from "@/components/toast";

function makeCallbackUrl() {
  if (typeof window === 'undefined') return '/';
  const url = new URL(window.location.href);
  return url.pathname + url.search;
}

/**
 * Comment composer with optimistic callback.
 * Tries:  1) /api/posts/[postId]/comments
 * Falls back to: /api/comments  (body: { postId, content, parentId? })
 */
export default function CommentComposer({
  postId,
  parentId = null,
  onAdded,
  maxLen = 1000,
  placeholder = "Write a commentР  Р’ Р ™Р’ Р  РІв„ўР ™Р’ Р  Р’ Р ™Р’ Р  Р  Р  РІС™Р ™Р’ Р  Р’ Р ™Р’ Р  РІв„ўР ™Р’ Р  Р’ Р  РІ Р  Р’ Р Р†Р љРЎв„ўР  Р Р‹Р Р†РІС›РЎС›Р  Р’ Р ™Р’ Р  Р  Р  РІС™Р Р†РІС›РЎС›Р  Р’ Р Р†Р љРІћСћР  РІв„ўР ™Р’В¦",
}: {
  postId: string;
  parentId?: string | null;
  onAdded?: (comment: any) => void;
  maxLen?: number;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const toast = useToast();

  const canSend = text.trim().length > 0 && text.length <= maxLen;

  async function postJson(url: string, body: any) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
    });
    const raw = await res.text();
    let data: any = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { /* not JSON */ }
    return { ok: res.ok, status: res.status, data, raw };
  }

  const send = useCallback(async () => {
    if (!canSend || busy) return;
    setBusy(true);
    setErr("");

    const payload: any = { body: text.trim() };
    if (parentId) payload.parentId = parentId;

    try {
      // 1) Nested route
      let out = await postJson(`/api/posts/${postId}/comments`, payload);

      // 2) Fallback route
      if (!out.ok) {
        out = await postJson(`/api/comments`, { postId, ...payload });
      }

      // Handle unauthorized gracefully
      if (out.status === 401) {
        const cb = encodeURIComponent(makeCallbackUrl());
        toast("Please sign in to comment", { variant: "error" });
        if (typeof window !== 'undefined') window.location.href = `/login?callbackUrl=${cb}`;
        return;
      }

      if (!out.ok) {
        const msg =
          out.data?.error ||
          out.data?.message ||
          (typeof out.raw === "string" && out.raw.trim()) ||
          `Failed to post comment (HTTP ${out.status})`;
        throw new Error(msg);
      }

      const comment = out.data?.comment ?? out.data;
      onAdded?.(comment);
      setText("");
      toast("Comment added Р  Р’ Р ™Р’ Р  РІв„ўР ™Р’ Р  Р’ Р ™Р’ Р  Р  Р  РІС™Р ™Р’ Р  Р’ Р ™Р’ Р  Р’ Р  РІв„–Р  Р’ Р  Р №Р  Р  Р Р†Р љРЎєР РЋРЎєР  Р’ Р ™Р’ Р  РІв„ўР ™Р’ Р  Р’ Р ™Р’ Р  Р Р‹Р Р†Р љРЎС™", { variant: "success" });
    } catch (e: any) {
      const msg = e?.message || "Failed to post comment";
      setErr(msg);
      toast(msg, { variant: "error" });
    } finally {
      setBusy(false);
    }
  }, [busy, canSend, onAdded, parentId, postId, text, toast]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const remaining = Math.max(0, maxLen - text.length);

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          className="input"
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          maxLength={maxLen + 1}
          aria-label="Write a comment"
          style={{ flex: 1 }}
        />
        <button className="btn-solid" disabled={!canSend || busy} onClick={send}>
          {busy ? "SendingР  Р’ Р ™Р’ Р  РІв„ўР ™Р’ Р  Р’ Р ™Р’ Р  Р  Р  РІС™Р ™Р’ Р  Р’ Р ™Р’ Р  РІв„ўР ™Р’ Р  Р’ Р  РІ Р  Р’ Р Р†Р љРЎв„ўР  Р Р‹Р Р†РІС›РЎС›Р  Р’ Р ™Р’ Р  Р  Р  РІС™Р Р†РІС›РЎС›Р  Р’ Р Р†Р љРІћСћР  РІв„ўР ™Р’В¦" : "Send"}
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.8 }}>{remaining} left</span>
        {err && (
          <span role="alert" style={{ color: "#dc2626", fontSize: 12 }}>
            {err}
          </span>
        )}
      </div>
    </div>
  );
}

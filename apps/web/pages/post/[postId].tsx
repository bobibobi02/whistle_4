import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import ConfirmDeleteOverlay from "../../components/ConfirmDeleteOverlay";

/* ========= Types ========= */

type User = {
  email: string;
  name?: string | null;
};

type RawComment = {
  id: string;
  postId: string;
  userEmail: string;
  createdAt: string;
  updatedAt?: string | null;
  body?: string | null;
  text?: string | null;
  content?: string | null;
  parentId?: string | null;
  user?: User | null;
};

type CommentNode = RawComment & {
  content: string;
  imageUrl?: string | null;
  children: CommentNode[];
};

type Post = {
  id: string;
  title: string;
  body?: string | null;
  content?: string | null;
  text?: string | null;
  imageUrls?: string[] | null;
  imageUrl?: string | null;
  image?: string | null;
  mediaUrl?: string | null;
  user?: User | null;
};

/* ========= Comment body encoder / decoder ========= */

type DecodedComment = {
  text: string;
  imageUrl: string | null;
};

function decodeCommentBody(rawInput: unknown): DecodedComment {
  const raw = (rawInput ?? "").toString();
  if (!raw) return { text: "", imageUrl: null };

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const text =
        typeof (parsed as any).t === "string" ? (parsed as any).t : "";
      const imageUrl =
        typeof (parsed as any).img === "string" && (parsed as any).img
          ? (parsed as any).img
          : null;
      if ("t" in (parsed as any) || "img" in (parsed as any)) {
        return { text, imageUrl };
      }
    }
  } catch {
    // not JSON, just plain text
  }

  return { text: raw, imageUrl: null };
}

/* ========= Helpers ========= */

function buildTree(rows: RawComment[]): CommentNode[] {
  const byId = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  rows.forEach((c) => {
    const rawBody = c.body ?? c.text ?? c.content ?? "";
    const decoded = decodeCommentBody(rawBody);
    byId.set(c.id, {
      ...(c as any),
      content: decoded.text,
      imageUrl: decoded.imageUrl,
      children: [],
    });
  });

  rows.forEach((c) => {
    const node = byId.get(c.id)!;
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

const getAllImages = (post: Post | null): string[] => {
  if (!post) return [];
  const urls = new Set<string>();

  if (Array.isArray(post.imageUrls)) {
    for (const u of post.imageUrls) {
      if (u) urls.add(u);
    }
  }

  if (post.mediaUrl) urls.add(post.mediaUrl);
  if (post.imageUrl) urls.add(post.imageUrl);

  const anyPost = post as any;
  if (typeof anyPost.image === "string" && anyPost.image) {
    urls.add(anyPost.image);
  }

  return Array.from(urls);
};

/* ========= Vote helpers (post) ========= */

async function fetchPostScore(postId: string): Promise<number | null> {
  try {
    const res = await fetch("/api/vote/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ postId }),
    });
    if (!res.ok) return null;

    const data = await res.json().catch(() => null);
    if (!data) return null;

    if (typeof data.score === "number") return data.score;
    if (typeof data.total === "number") return data.total;
    if (data[postId] && typeof data[postId].score === "number") {
      return data[postId].score;
    }

    return null;
  } catch {
    return null;
  }
}

async function sendVote(postId: string, value: number): Promise<boolean> {
  try {
    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ postId, value }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/* ========= API helpers ========= */

async function fetchPost(postId: string): Promise<Post | null> {
  const res = await fetch(`/api/posts?id=${encodeURIComponent(postId)}`, {
    cache: "no-store",
    credentials: "same-origin",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) ? (data[0] ?? null) : data;
}

async function fetchComments(postId: string): Promise<RawComment[]> {
  let res = await fetch(`/api/posts/${postId}/comments`, {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!res.ok) {
    res = await fetch(`/api/comments?postId=${encodeURIComponent(postId)}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
  }

  if (!res.ok) return [];
  const rows: RawComment[] = await res.json();
  return rows;
}

async function saveComment(args: {
  postId: string;
  body: string;
  id?: string;
  parentId?: string;
}) {
  let res = await fetch(`/api/posts/${args.postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(args),
  }).catch(() => null);

  if (!res || !res.ok) {
    res = await fetch(`/api/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(args),
    }).catch(() => null);
  }

  if (!res) throw new Error("Comment failed");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Comment failed");
  return data;
}

async function deleteComment(id: string) {
  const res = await fetch(`/api/comments?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "same-origin",
  }).catch(() => null);

  if (!res) throw new Error("Delete failed");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Delete failed");
}

async function deletePost(id: string) {
  const res = await fetch("/api/posts/" + encodeURIComponent(id), {
    method: "DELETE",
    credentials: "same-origin",
  }).catch(() => null);

  if (!res) {
    throw new Error("Delete failed");
  }

  const data = await res.json().catch(() => ({} as any));

  if (!res.ok || (data && (data as any).ok === false)) {
    throw new Error("Delete failed");
  }
}

/* ========= Page ========= */

const PostPage: React.FC = () => {
  const router = useRouter();
  const postId = (router.query.postId as string) || "";
  const { data: session } = useSession();
  const currentUserEmail = session?.user?.email ?? null;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<RawComment[]>([]);
  const [loading, setLoading] = useState(true);

  const [score, setScore] = useState<number | null>(null);
  const [myVote, setMyVote] = useState<0 | 1 | -1>(0);

  const [composer, setComposer] = useState("");
  const [mode, setMode] =
    useState<null | { type: "reply" | "edit"; commentId: string }>(null);

  const [commentImageUrl, setCommentImageUrl] = useState<string | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<
    string | null
  >(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // delete overlay state (comments)
  const [deleteTargetCommentId, setDeleteTargetCommentId] = useState<string | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  // delete overlay state (post)
  const [showPostDelete, setShowPostDelete] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  useEffect(() => {
    if (!postId) return;
    (async () => {
      setLoading(true);
      const [p, c, s] = await Promise.all([
        fetchPost(postId),
        fetchComments(postId),
        fetchPostScore(postId),
      ]);
      setPost(p);
      setComments(c);
      setScore(s);
      setMyVote(0);
      setLoading(false);
    })();
  }, [postId]);

  const tree = useMemo(() => buildTree(comments), [comments]);

  const refresh = async () => {
    if (!postId) return;
    setComments(await fetchComments(postId));
    setScore(await fetchPostScore(postId));
  };

  const focusComposer = () => {
    const el = document.getElementById(
      "comment-composer"
    ) as HTMLTextAreaElement | null;
    el?.focus();
  };

  const startReply = (id: string) => {
    setMode({ type: "reply", commentId: id });
    setComposer("");
    setCommentImageUrl(null);
    setCommentImagePreview(null);
    setUploadError(null);
    focusComposer();
  };

  const startEdit = (id: string, text: string) => {
    setMode({ type: "edit", commentId: id });
    setComposer(text);
    setCommentImageUrl(null);
    setCommentImagePreview(null);
    setUploadError(null);
    focusComposer();
  };

  const resetComposer = () => {
    setMode(null);
    setComposer("");
    setCommentImageUrl(null);
    setCommentImagePreview(null);
    setUploadError(null);
  };

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploadingImage(true);
    setCommentImagePreview(null);
    setCommentImageUrl(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      const data = await uploadRes.json().catch(() => ({} as any));

      let url: string | null = null;
      if (typeof data.url === "string") {
        url = data.url;
      } else if (Array.isArray(data.urls) && data.urls[0]) {
        url = data.urls[0];
      }

      if (!url) {
        throw new Error("Upload did not return a URL");
      }

      setCommentImageUrl(url);
      setCommentImagePreview(url);
    } catch {
      setUploadError("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const submit = async () => {
    if (!postId) return;
    const rawBody = composer.trim();

    if (!rawBody && !commentImageUrl) return;

    const bodyToSend = JSON.stringify({
      t: rawBody,
      img: commentImageUrl || null,
    });

    const payload: {
      postId: string;
      body: string;
      id?: string;
      parentId?: string;
    } = { postId, body: bodyToSend };

    if (mode?.type === "edit") payload.id = mode.commentId;
    if (mode?.type === "reply") payload.parentId = mode.commentId;

    await saveComment(payload);
    resetComposer();
    await refresh();
  };

  // open overlay for comment delete
  const askDeleteComment = (id: string) => {
    setDeleteTargetCommentId(id);
  };

  const performDeleteComment = async () => {
    if (!deleteTargetCommentId) return;
    setIsDeletingComment(true);
    try {
      await deleteComment(deleteTargetCommentId);
      await refresh();
    } finally {
      setIsDeletingComment(false);
      setDeleteTargetCommentId(null);
    }
  };

  const cancelDeleteComment = () => {
    if (isDeletingComment) return;
    setDeleteTargetCommentId(null);
  };

  // post delete
  const canDeletePost = !!currentUserEmail;

  const askDeletePost = () => {
    if (!canDeletePost) return;
    setShowPostDelete(true);
  };

  const performDeletePost = async () => {
    if (!post) return;
    setIsDeletingPost(true);
    try {
      await deletePost(post.id);
      router.push("/");
    } finally {
      setIsDeletingPost(false);
      setShowPostDelete(false);
    }
  };

  const cancelDeletePost = () => {
    if (isDeletingPost) return;
    setShowPostDelete(false);
  };

  const handleVote = async (next: 1 | -1) => {
    if (!postId || !session?.user) return;

    const prev = myVote;
    const newVote = prev === next ? 0 : next;

    setMyVote(newVote);
    setScore((s) => {
      const base = s ?? 0;
      return base + (newVote - prev);
    });

    const ok = await sendVote(postId, newVote);
    if (!ok) {
      setMyVote(prev);
      setScore((s) => {
        const base = s ?? 0;
        return base - (newVote - prev);
      });
    }
  };

  if (!postId) return <div style={{ padding: 24 }}>Missing post id.</div>;
  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!post) return <div style={{ padding: 24 }}>Post not found.</div>;

  const composerButtonLabel =
    mode?.type === "reply"
      ? "Reply"
      : mode?.type === "edit"
      ? "Save edit"
      : "Add comment";

  const images = getAllImages(post);

  const bodyText = (
    post.body ??
    (post as any).content ??
    (post as any).text ??
    ""
  ).toString();
  const hasBody = bodyText.trim().length > 0;

  const authorName = post.user?.name || post.user?.email || "whistler";

  return (
    <>
      <main
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "24px 16px 48px",
          color: "#E5E7EB",
        }}
      >
        {/* Back link */}
        <div style={{ marginBottom: 16 }}>
          <Link
            href="/"
            style={{
              color: "#22C55E",
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Back to Feed
          </Link>
        </div>

        {/* Post row */}
        <article
          style={{
            display: "grid",
            gridTemplateColumns: "48px 1fr",
            gap: 16,
            paddingBottom: 24,
            marginBottom: 18,
            borderBottom: "1px solid rgba(31,41,55,0.9)",
          }}
        >
          {/* Vote column */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              marginTop: 4,
            }}
          >
            <button
              type="button"
              onClick={() => handleVote(1)}
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                border: "none",
                background:
                  myVote === 1 ? "#22C55E" : "rgba(148,163,184,0.18)",
                color: myVote === 1 ? "#020817" : "#9CA3AF",
                cursor: session?.user ? "pointer" : "default",
              }}
            />
            <div
              style={{
                minWidth: 30,
                textAlign: "center",
                fontSize: 11,
                fontWeight: 600,
                color: (score ?? 0) >= 0 ? "#22C55E" : "#F97316",
              }}
            >
              {score ?? 0}
            </div>
            <button
              type="button"
              onClick={() => handleVote(-1)}
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                border: "none",
                background:
                  myVote === -1 ? "#F97316" : "rgba(148,163,184,0.18)",
                color: myVote === -1 ? "#020817" : "#9CA3AF",
                cursor: session?.user ? "pointer" : "default",
              }}
            />
          </div>

          {/* Post content column */}
          <div>
            <header
              style={{
                marginBottom: 8,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div>
                  <h1
                    style={{
                      margin: 0,
                      marginBottom: 2,
                      fontSize: 24,
                      fontWeight: 700,
                      color: "#F9FAFB",
                    }}
                  >
                    {post.title}
                  </h1>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#9CA3AF",
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>Posted by</span>
                    <span style={{ color: "#E5E7EB", fontWeight: 500 }}>
                      {authorName}
                    </span>
                  </div>
                </div>

                {canDeletePost && (
                  <button
                    type="button"
                    onClick={askDeletePost}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 999,
                      border: "1px solid rgba(248,113,113,0.9)",
                      background: "transparent",
                      color: "#FCA5A5",
                      fontSize: 11,
                      cursor: "pointer",
                      marginTop: 2,
                    }}
                  >
                    Delete post
                  </button>
                )}
              </div>
            </header>

            {hasBody && (
              <p
                style={{
                  marginTop: 10,
                  marginBottom: images.length ? 16 : 0,
                  whiteSpace: "pre-wrap",
                  color: "#D1D5DB",
                  lineHeight: 1.7,
                  fontSize: 14,
                }}
              >
                {bodyText}
              </p>
            )}

            {images.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    borderRadius: 26,
                    padding: 10,
                    background:
                      "linear-gradient(135deg,#22C55E,#0EA5E9,#1D4ED8)",
                    maxWidth: 520,
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      borderRadius: 22,
                      overflow: "hidden",
                      backgroundColor: "#020817",
                    }}
                  >
                    {images.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={src}
                        alt="Post media"
                        style={{
                          width: "100%",
                          height: "auto",
                          display: "block",
                          objectFit: "contain",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Composer */}
        <section style={{ marginBottom: 22 }}>
          <textarea
            id="comment-composer"
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            placeholder="Add useful thoughts..."
            rows={3}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid rgba(75,85,99,0.9)",
              background: "transparent",
              color: "#E5E7EB",
              fontSize: 13,
              resize: "vertical",
              outline: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 8,
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={handlePickImage}
                style={{
                  padding: "5px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.7)",
                  background: "transparent",
                  color: "#9CA3AF",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                {isUploadingImage ? "Uploading…" : "Attach image"}
              </button>
              {commentImagePreview && (
                <div
                  style={{
                    borderRadius: 14,
                    padding: 3,
                    background:
                      "linear-gradient(135deg,#22C55E,#0EA5E9,#1D4ED8)",
                    maxWidth: 120,
                  }}
                >
                  <div
                    style={{
                      borderRadius: 11,
                      overflow: "hidden",
                      backgroundColor: "#020817",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={commentImagePreview}
                      alt="Attached"
                      style={{
                        width: "100%",
                        height: "auto",
                        display: "block",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                </div>
              )}
              {uploadError && (
                <span style={{ color: "#FCA5A5", fontSize: 11 }}>
                  {uploadError}
                </span>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {mode && (
                <button
                  type="button"
                  onClick={resetComposer}
                  style={{
                    padding: "5px 11px",
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,0.5)",
                    background: "transparent",
                    color: "#9CA3AF",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={submit}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "none",
                  background: "linear-gradient(to right,#22C55E,#16A34A)",
                  color: "#020817",
                  fontWeight: 600,
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                {composerButtonLabel}
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </section>

        {/* Comments */}
        <section>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#E5E7EB",
              marginBottom: 8,
            }}
          >
            Comments
          </h2>
          <CommentList
            nodes={tree}
            depth={0}
            onReply={startReply}
            onEdit={startEdit}
            onDelete={askDeleteComment}
            currentUserEmail={currentUserEmail}
          />
        </section>
      </main>

      {/* Post delete overlay */}
      {showPostDelete && (
        <ConfirmDeleteOverlay
          title="Delete post"
          message="Are you sure you want to delete this post? This action cannot be undone."
          confirming={isDeletingPost}
          onCancel={cancelDeletePost}
          onConfirm={performDeletePost}
        />
      )}

      {/* Comment delete overlay */}
      {deleteTargetCommentId && (
        <ConfirmDeleteOverlay
          title="Delete comment"
          message="Are you sure you want to delete this comment? This action cannot be undone."
          confirming={isDeletingComment}
          onCancel={cancelDeleteComment}
          onConfirm={performDeleteComment}
        />
      )}
    </>
  );
};

/* ========= Threaded comment tree ========= */

function CommentList(props: {
  nodes: CommentNode[];
  depth: number;
  onReply: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  currentUserEmail: string | null;
}) {
  const { nodes, depth, onReply, onEdit, onDelete, currentUserEmail } = props;
  if (!nodes?.length) return null;

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {nodes.map((n) => (
        <li key={n.id} style={{ marginTop: depth === 0 ? 10 : 6 }}>
          <CommentItem
            node={n}
            depth={depth}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            currentUserEmail={currentUserEmail}
          />

          {n.children?.length > 0 && (
            <div
              style={{
                marginLeft: 22,
                marginTop: 4,
                paddingLeft: 14,
                borderLeft: "2px solid rgba(55,65,81,0.9)",
              }}
            >
              <CommentList
                nodes={n.children}
                depth={depth + 1}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                currentUserEmail={currentUserEmail}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function CommentItem(props: {
  node: CommentNode;
  depth: number;
  onReply: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  currentUserEmail: string | null;
}) {
  const { node, onReply, onEdit, onDelete, currentUserEmail } = props;

  const author = node.user?.name || node.userEmail || "user";
  const avatar = (author[0] || "?").toUpperCase();
  const isOwner =
    !!currentUserEmail &&
    currentUserEmail.toLowerCase() === node.userEmail.toLowerCase();

  const [vote, setVote] = useState<0 | 1 | -1>(0);
  const [score, setScore] = useState<number>(0);

  const imageUrl = node.imageUrl ?? null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const vKey = `whistle:commentVote:${node.id}`;
      const sKey = `whistle:commentScore:${node.id}`;
      const storedV = window.localStorage.getItem(vKey);
      const storedS = window.localStorage.getItem(sKey);

      if (storedV === "1" || storedV === "-1" || storedV === "0") {
        setVote(storedV === "1" ? 1 : storedV === "-1" ? -1 : 0);
      }
      if (storedS !== null && !Number.isNaN(Number(storedS))) {
        setScore(Number(storedS));
      }
    } catch {
      // ignore
    }
  }, [node.id]);

  const handleCommentVote = (next: 1 | -1) => {
    const prev = vote;
    const newVote = prev === next ? 0 : next;

    setVote(newVote);
    setScore((prevScore) => {
      const updated = prevScore + (newVote - prev);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(
            `whistle:commentVote:${node.id}`,
            String(newVote)
          );
          window.localStorage.setItem(
            `whistle:commentScore:${node.id}`,
            String(updated)
          );
        } catch {
          // ignore
        }
      }
      return updated;
    });
  };

  const hasText = (node.content ?? "").toString().trim().length > 0;

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "999px",
          background: "#22C55E26",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          color: "#BBF7D0",
          flexShrink: 0,
        }}
      >
        {avatar}
      </div>

      {/* Comment vote column */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          marginTop: 2,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => handleCommentVote(1)}
          style={{
            width: 18,
            height: 18,
            borderRadius: 5,
            border: "none",
            background:
              vote === 1 ? "#22C55E" : "rgba(148,163,184,0.18)",
            color: vote === 1 ? "#020817" : "#9CA3AF",
            cursor: "pointer",
          }}
        />
        <div
          style={{
            minWidth: 20,
            textAlign: "center",
            fontSize: 9,
            fontWeight: 600,
            color: score >= 0 ? "#22C55E" : "#F97316",
          }}
        >
          {score}
        </div>
        <button
          type="button"
          onClick={() => handleCommentVote(-1)}
          style={{
            width: 18,
            height: 18,
            borderRadius: 5,
            border: "none",
            background:
              vote === -1 ? "#F97316" : "rgba(148,163,184,0.18)",
            color: vote === -1 ? "#020817" : "#9CA3AF",
            cursor: "pointer",
          }}
        />
      </div>

      {/* Comment bubble */}
      <div
        style={{
          flex: 1,
          borderRadius: 10,
          background: "transparent",
          border: "1px solid rgba(31,41,55,0.7)",
          padding: "8px 10px 6px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 6,
            fontSize: 10,
            color: "#9CA3AF",
            marginBottom: 2,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              color: "#F9FAFB",
            }}
          >
            {author}
          </span>
          <span>{new Date(node.createdAt).toLocaleString()}</span>
        </div>

        {hasText && (
          <div
            style={{
              marginTop: 2,
              fontSize: 13,
              color: "#D1D5DB",
              whiteSpace: "pre-wrap",
              lineHeight: 1.5,
            }}
          >
            {node.content}
          </div>
        )}

        {imageUrl && (
          <div
            style={{
              marginTop: hasText ? 8 : 2,
              maxWidth: 260,
            }}
          >
            <div
              style={{
                borderRadius: 18,
                padding: 4,
                background:
                  "linear-gradient(135deg,#22C55E,#0EA5E9,#1D4ED8)",
              }}
            >
              <div
                style={{
                  borderRadius: 14,
                  overflow: "hidden",
                  backgroundColor: "#020817",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Comment media"
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    objectFit: "cover",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: 5,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            fontSize: 10,
          }}
        >
          <ActionPill label="Reply" onClick={() => onReply(node.id)} />
          {isOwner && (
            <>
              <ActionPill
                label="Edit"
                onClick={() => onEdit(node.id, node.content)}
              />
              <ActionPill
                label="Delete"
                danger
                onClick={() => onDelete(node.id)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionPill(props: {
  label: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  const { label, danger, onClick } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "2px 8px",
        borderRadius: 999,
        border: danger
          ? "1px solid rgba(248,113,113,0.9)"
          : "1px solid rgba(148,163,184,0.45)",
        background: "transparent",
        color: danger ? "#FCA5A5" : "#9CA3AF",
        fontSize: 9,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {label}
    </button>
  );
}

export default PostPage;



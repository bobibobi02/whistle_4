import React from "react";
import Link from "next/link";

export interface PostCardProps {
  postId: string;
  title?: string;
  content?: string;
  body?: string;
  mediaUrl?: string;
  userEmail?: string;
  user?: {
    name?: string | null;
    image?: string | null;
  } | null;
  createdAt?: string | Date;
  timestamp?: string | Date;
  score?: number;
  likesCount?: number;
  commentsCount?: number;
  [key: string]: any; // allow extra props from spreads (popular.tsx, sub/[name].tsx, etc.)
}

function copyToClipboard(text: string) {
  if (typeof navigator !== "undefined" && (navigator as any).clipboard?.writeText) {
    return (navigator as any).clipboard.writeText(text);
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return Promise.resolve();
  } catch {
    return Promise.reject();
  }
}

const PostCard: React.FC<PostCardProps> = (props) => {
  const {
    postId,
    title,
    content,
    body,
    mediaUrl,
    user,
    userEmail,
    timestamp,
    createdAt,
    score,
    likesCount,
    commentsCount,
  } = props;

  const displayBody =
    (typeof body === "string" && body) ||
    (typeof content === "string" && content) ||
    "";

  const displayUser =
    user?.name ||
    (userEmail ? userEmail.split("@")[0] : "Anonymous");

  const created =
    (timestamp && new Date(timestamp)) ||
    (createdAt && new Date(createdAt)) ||
    null;

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/post/${postId}`;
    copyToClipboard(url).catch(() => {});
  };

  return (
    <article className="post-card border rounded-lg p-4 mb-4 bg-white/5">
      <header className="flex items-center justify-between gap-2 mb-2">
        <div className="flex flex-col">
          <Link href={`/post/${postId}`} className="font-semibold hover:underline">
            {title || "(untitled post)"}
          </Link>
          <div className="text-xs text-gray-500">
            <span>{displayUser}</span>
            {created && (
              <>
                {"  "}
                <time dateTime={created.toISOString()}>
                  {created.toLocaleString()}
                </time>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopyLink}
          className="text-xs px-2 py-1 border rounded hover:bg-gray-800"
        >
          Copy link
        </button>
      </header>

      {mediaUrl && (
        <div className="mb-2">
          {/* Keeping it simple; rule disabled in flat config */}
          <img
            src={mediaUrl}
            alt={title || "Post media"}
            className="max-h-64 w-full object-cover rounded"
          />
        </div>
      )}

      {displayBody && (
        <p className="text-sm text-gray-100 whitespace-pre-wrap mb-2">
          {displayBody}
        </p>
      )}

      <footer className="flex gap-4 text-xs text-gray-500">
        <span>Score: {typeof score === "number" ? score : likesCount ?? 0}</span>
        <span>Comments: {commentsCount ?? 0}</span>
      </footer>
    </article>
  );
};

export default PostCard;


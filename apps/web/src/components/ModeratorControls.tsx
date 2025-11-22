// components/ModeratorControls.tsx

import { useSession } from "next-auth/react";

interface ModeratorControlsProps {
  postId?: string;
  commentId?: string;
  userId?: string;
}

export default function ModeratorControls({
  postId,
  commentId,
  userId,
}: ModeratorControlsProps) {
  const { data: session } = useSession();
  if (!session?.user) return null;

  const handleAction = async (action: string, id: string) => {
    // Guard `action` first, then replace:
    const actionLabel = ((action ?? "").replace(/([A-Z])/g, " $1")).toLowerCase();
    if (!confirm(`Are you sure you want to ${actionLabel}?`)) return;

    const endpoint = `/api/mod/${action}`;
    const body: any = {};
    if (action === "deletePost") body.postId = id;
    if (action === "deleteComment") body.commentId = id;
    if (action === "banUser") body.userId = id;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      window.location.reload();
    } else {
      alert("Action failed");
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button className="px-2 py-1 rounded hover:bg-gray-200"></button>
      <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded z-10">
        {postId && (
          <button
            onClick={() => handleAction("deletePost", postId)}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Delete Post
          </button>
        )}
        {commentId && (
          <button
            onClick={() => handleAction("deleteComment", commentId)}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Delete Comment
          </button>
        )}
        {userId && (
          <button
            onClick={() => handleAction("banUser", userId)}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Ban User
          </button>
        )}
      </div>
    </div>
  );
}


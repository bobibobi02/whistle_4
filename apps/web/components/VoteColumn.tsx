import React, { useEffect, useState } from "react";

export type VoteValue = -1 | 0 | 1;

export type VoteStats = {
  upvotes: number;
  downvotes: number;
  userVote: VoteValue;
};

interface VoteColumnProps {
  postId: string;
  /**
   * Optional initial data if you ever decide to pass it from /api/posts.
   */
  initialStats?: VoteStats;
}

const VoteColumn: React.FC<VoteColumnProps> = ({ postId, initialStats }) => {
  const [upvotes, setUpvotes] = useState<number>(initialStats?.upvotes ?? 0);
  const [downvotes, setDownvotes] = useState<number>(
    initialStats?.downvotes ?? 0,
  );
  const [userVote, setUserVote] = useState<VoteValue>(
    initialStats?.userVote ?? 0,
  );
  const [loading, setLoading] = useState(false);

  // Load stats from the backend if not provided
  useEffect(() => {
    if (initialStats) return;

    let cancelled = false;

    async function loadStats() {
      try {
        const res = await fetch("/api/vote/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId }),
        });

        if (!res.ok) return;

        const data = (await res.json()) as Partial<VoteStats>;
        if (cancelled) return;

        setUpvotes(data.upvotes ?? 0);
        setDownvotes(data.downvotes ?? 0);
        setUserVote((data.userVote as VoteValue | undefined) ?? 0);
      } catch {
        // silently ignore
      }
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, [postId, initialStats]);

  async function handleVote(next: VoteValue) {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, value: next }),
      });

      if (!res.ok) return;

      const data = (await res.json()) as Partial<VoteStats>;

      setUpvotes(data.upvotes ?? 0);
      setDownvotes(data.downvotes ?? 0);
      setUserVote((data.userVote as VoteValue | undefined) ?? 0);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }

  const isUp = userVote === 1;
  const isDown = userVote === -1;

  return (
    <div className="mr-3 flex flex-col items-center gap-1">
      {/* Upvote square */}
      <button
        type="button"
        disabled={loading}
        onClick={() => handleVote(isUp ? 0 : 1)}
        className={`h-6 w-6 rounded-sm border border-neutral-700 transition ${
          isUp ? "bg-green-500" : "bg-neutral-900"
        }`}
        aria-label="Upvote"
      />
      {/* Counts */}
      <span className="text-xs leading-none text-green-400">{upvotes}</span>
      <span className="text-xs leading-none text-orange-400">
        {downvotes}
      </span>
      {/* Downvote square */}
      <button
        type="button"
        disabled={loading}
        onClick={() => handleVote(isDown ? 0 : -1)}
        className={`h-6 w-6 rounded-sm border border-neutral-700 transition ${
          isDown ? "bg-orange-500" : "bg-neutral-900"
        }`}
        aria-label="Downvote"
      />
    </div>
  );
};

export default VoteColumn;

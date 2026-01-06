// pages/profile.tsx - Whistle profile page (compact cards layout, uses /api/user/profile)

import Head from "next/head";
import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface ProfileUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  createdAt?: string | null;
}

interface ProfileStats {
  totalKarma?: number | null;
  postKarma?: number | null;
  commentKarma?: number | null;
  postsCount?: number | null;
  commentsCount?: number | null;
  achievements?: string[] | null;
}

interface ProfileResponse {
  user?: ProfileUser | null;
  stats?: ProfileStats | null;
}

function formatJoined(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
  });
}

const ProfilePage: NextPage = () => {
  const { data: session, status } = useSession();
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/user/profile", {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to load profile: ${res.status}`);
        }

        const json = (await res.json().catch(() => null)) as ProfileResponse | null;
        if (!cancelled) {
          setData(json ?? {});
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError("Could not load profile.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [session?.user, status]);

  const user: ProfileUser = {
    name: data?.user?.name ?? session?.user?.name ?? "",
    email: data?.user?.email ?? session?.user?.email ?? "",
    image: data?.user?.image ?? session?.user?.image ?? null,
    createdAt: data?.user?.createdAt ?? null,
  };

  const stats: ProfileStats = {
    totalKarma:
      data?.stats?.totalKarma ??
      ((data?.stats?.postKarma ?? 0) + (data?.stats?.commentKarma ?? 0)),
    postKarma: data?.stats?.postKarma ?? 0,
    commentKarma: data?.stats?.commentKarma ?? 0,
    postsCount: data?.stats?.postsCount ?? 0,
    commentsCount: data?.stats?.commentsCount ?? 0,
    achievements: data?.stats?.achievements ?? [],
  };

  const displayName = (user.name || "").trim() || "User";
  const initial = displayName.charAt(0).toUpperCase() || "U";
  const joinedText = formatJoined(user.createdAt);

  if (status === "loading") {
    return (
      <main className="feed-wrap">
        <p style={{ color: "#E5E7EB", fontSize: 14 }}>Loading profile…</p>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="feed-wrap">
        <h1
          style={{
            marginBottom: 8,
            fontWeight: 800,
            fontSize: "1.3rem",
            color: "#F9FAFB",
          }}
        >
          Profile
        </h1>
        <p style={{ color: "#9CA3AF", fontSize: 14 }}>
          You need to be logged in to see your profile.
        </p>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Whistle · Profile</title>
      </Head>
      <main className="feed-wrap">
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "999px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 24,
              background: "#22C55E",
              color: "#020617",
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                marginBottom: 4,
                fontWeight: 800,
                fontSize: "1.3rem",
                color: "#F9FAFB",
              }}
            >
              {displayName}
            </h1>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                fontSize: 13,
                color: "#9CA3AF",
              }}
            >
              {user.email && <span>{user.email}</span>}
              {joinedText && (
                <span>
                  · Joined <span>{joinedText}</span>
                </span>
              )}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                color: "#E5E7EB",
              }}
            >
              Total karma:{" "}
              <span
                style={{
                  fontWeight: 600,
                  color: stats.totalKarma && stats.totalKarma >= 0 ? "#22C55E" : "#F97316",
                }}
              >
                {stats.totalKarma ?? 0}
              </span>
            </div>
          </div>
        </header>

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: "8px 12px",
              borderRadius: 8,
              background: "rgba(239,68,68,0.12)",
              color: "#FCA5A5",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <section
          aria-label="Karma and activity"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.35)",
              background: "rgba(15,23,42,0.95)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: 0.04,
                textTransform: "uppercase",
                color: "#9CA3AF",
                marginBottom: 4,
              }}
            >
              Post karma
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: stats.postKarma && stats.postKarma >= 0 ? "#22C55E" : "#F97316",
              }}
            >
              {stats.postKarma ?? 0}
            </div>
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.35)",
              background: "rgba(15,23,42,0.95)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: 0.04,
                textTransform: "uppercase",
                color: "#9CA3AF",
                marginBottom: 4,
              }}
            >
              Comment karma
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color:
                  stats.commentKarma && stats.commentKarma >= 0 ? "#22C55E" : "#F97316",
              }}
            >
              {stats.commentKarma ?? 0}
            </div>
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.35)",
              background: "rgba(15,23,42,0.95)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: 0.04,
                textTransform: "uppercase",
                color: "#9CA3AF",
                marginBottom: 4,
              }}
            >
              Posts
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#E5E7EB",
              }}
            >
              {stats.postsCount ?? 0}
            </div>
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.35)",
              background: "rgba(15,23,42,0.95)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: 0.04,
                textTransform: "uppercase",
                color: "#9CA3AF",
                marginBottom: 4,
              }}
            >
              Comments
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#E5E7EB",
              }}
            >
              {stats.commentsCount ?? 0}
            </div>
          </div>
        </section>

        <section aria-label="Achievements">
          <h2
            style={{
              margin: 0,
              marginBottom: 8,
              fontSize: 16,
              fontWeight: 700,
              color: "#F9FAFB",
            }}
          >
            Achievements
          </h2>

          {stats.achievements && stats.achievements.length > 0 ? (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {stats.achievements.map((ach, idx) => (
                <li
                  key={`${ach}-${idx}`}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(148,163,184,0.35)",
                    background: "rgba(15,23,42,0.95)",
                    fontSize: 13,
                    color: "#E5E7EB",
                  }}
                >
                  {ach}
                </li>
              ))}
            </ul>
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "#9CA3AF",
              }}
            >
              No achievements yet. Keep posting and commenting to unlock them.
            </p>
          )}
        </section>

        {loading && (
          <p
            style={{
              marginTop: 16,
              fontSize: 12,
              color: "#6B7280",
            }}
          >
            Refreshing stats…
          </p>
        )}
      </main>
    </>
  );
};

export default ProfilePage;

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

export default function CreatePost() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [loopName, setLoopName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "loading") {
    return (
      <div className="create-page">
        <div className="create-shell loading-shell">Loading…</div>
      </div>
    );
  }

  if (!session) {
    if (typeof window !== "undefined") {
      router.push("/login?next=/create");
    }
    return null;
  }

  function getInitials() {
    const name = session.user?.name || session.user?.email || "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() && !text.trim()) {
      setError("Write something or add a title first.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);

        try {
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (uploadRes.ok) {
            const data = await uploadRes.json();
            if (typeof data.url === "string") {
              imageUrl = data.url;
            } else if (Array.isArray(data.urls) && data.urls[0]) {
              imageUrl = data.urls[0];
            }
          }
        } catch {
          console.error("Image upload failed, creating text post only.");
        }
      }

      // Build payload that works with both old and new API/DB shapes
      const bodyText = text.trim();
      const payload: any = {
        title: title.trim(),
        content: bodyText,
        body: bodyText,
        subforumName: loopName.trim() || null,
      };

      if (imageUrl) {
        payload.imageUrl = imageUrl;
        payload.mediaUrl = imageUrl;
        payload.imageUrls = [imageUrl];
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.message || data?.error || "Something went wrong creating your post."
        );
      }

      const created = await res.json().catch(() => null);
      const postId = created?.id;

      if (postId) {
        router.push(`/post/${postId}`);
      } else {
        router.push("/feed");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-page">
      <header className="create-header">
        <button
          type="button"
          className="back-button"
          onClick={() => router.push("/feed")}
        >
          ← Back to Feed
        </button>
        <span className="header-title">Create a new post</span>
      </header>

      <main className="create-shell">
        <form onSubmit={handleSubmit} className="composer">
          <div className="composer-avatar">
            <div className="avatar-circle">{getInitials()}</div>
          </div>

          <div className="composer-main">
            <input
              className="title-input"
              type="text"
              placeholder="Give your whistle a title…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="loop-row">
              <label className="loop-label">Loop</label>
              <input
                className="loop-input"
                type="text"
                placeholder="Choose a loop (optional)…"
                value={loopName}
                onChange={(e) => setLoopName(e.target.value)}
              />
            </div>

            <textarea
              className="text-input"
              placeholder="Add some context, a story, or details…"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            {imagePreview && (
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: "960px",
                  }}
                >
                  {/* Close (X) button in the top-right corner */}
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setImageFile(null);
                    }}
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      zIndex: 2,
                      width: "32px",
                      height: "32px",
                      borderRadius: "999px",
                      border: "none",
                      cursor: "pointer",
                      background: "rgba(15,23,42,0.85)",
                      color: "#e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ✕
                  </button>

                  {/* Image preview – full image, no cropping */}
                  <img
                    src={imagePreview}
                    alt="Post image preview"
                    style={{
                      width: "100%",
                      height: "auto",
                      maxHeight: "480px",
                      objectFit: "contain",
                      borderRadius: "24px",
                      display: "block",
                    }}
                  />
                </div>
              </div>
            )}

            <div className="composer-footer">
              <label className="image-picker">
                <span>📷 Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => { handleImageChange(e); e.target.value = ""; }}
                />
              </label>

              <div className="actions">
                {error && <span className="error-text">{error}</span>}

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => router.push("/feed")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="post-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>

      <style jsx>{`
        .create-page {
          min-height: 100vh;
          color: #e5e7eb;
        }

        .create-header {
          display: flex;
          align-items: center;
          padding: 12px 32px;
          border-bottom: 1px solid rgba(15, 23, 42, 0.85);
          background: transparent;
        }

        .back-button {
          border: none;
          background: #020617;
          color: #e5e7eb;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 0.875rem;
          cursor: pointer;
          box-shadow: 0 0 0 1px rgba(51, 65, 85, 0.9);
          margin-right: 12px;
        }

        .back-button:hover {
          background: #030712;
        }

        .header-title {
          font-weight: 700;
          font-size: 1rem;
          color: #f9fafb;
        }

        .create-shell {
          max-width: 760px;
          margin: 28px auto 40px;
          padding: 0 24px;
        }

        .loading-shell {
          text-align: center;
          padding-top: 64px;
        }

        .composer {
          display: flex;
          gap: 16px;
          padding-top: 18px;
          background: transparent;
          box-shadow: none;
          border-radius: 0;
        }

        .composer-avatar {
          padding-top: 4px;
        }

        .avatar-circle {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1rem;
          color: #022c22;
          box-shadow: 0 0 18px rgba(34, 197, 94, 0.45);
        }

        .composer-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .title-input {
          width: 100%;
          border: none;
          background: transparent;
          color: #f9fafb;
          font-size: 1.05rem;
          font-weight: 600;
          padding: 2px 0;
          outline: none;
        }

        .title-input::placeholder {
          color: rgba(148, 163, 184, 0.85);
        }

        .loop-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 2px;
        }

        .loop-label {
          font-size: 0.85rem;
          color: #9ca3af;
          min-width: 40px;
        }

        .loop-input {
          flex: 1;
          border-radius: 999px;
          border: none;
          padding: 6px 14px;
          font-size: 0.85rem;
          background: transparent;
          color: #e5e7eb;
          outline: none;
          box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.9);
        }

        .loop-input::placeholder {
          color: rgba(148, 163, 184, 0.85);
        }

        .text-input {
          width: 100%;
          border: none;
          resize: vertical;
          min-height: 96px;
          background: transparent;
          color: #e5e7eb;
          padding: 10px 12px;
          border-radius: 14px;
          font-size: 0.95rem;
          outline: none;
          box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.9);
        }

        .text-input::placeholder {
          color: rgba(148, 163, 184, 0.8);
        }

        .image-preview {
          position: relative;
          margin-top: 4px;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(15, 23, 42, 0.9);
          max-height: 320px;
        }

        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .remove-image {
          position: absolute;
          top: 8px;
          right: 8px;
          border: none;
          background: rgba(15, 23, 42, 0.9);
          color: #e5e7eb;
          border-radius: 999px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.8rem;
          box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.5);
        }

        .composer-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 10px;
          gap: 12px;
        }

        .image-picker {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          color: #22c55e;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(21, 128, 61, 0.08);
          box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.45);
        }

        .image-picker input {
          display: none;
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .error-text {
          font-size: 0.8rem;
          color: #f97373;
          margin-right: 4px;
        }

        .cancel-btn {
          border-radius: 999px;
          border: none;
          padding: 8px 14px;
          font-size: 0.85rem;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
        }

        .cancel-btn:hover {
          background: rgba(15, 23, 42, 0.9);
        }

        .post-btn {
          border-radius: 999px;
          border: none;
          padding: 8px 18px;
          font-size: 0.9rem;
          font-weight: 600;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #022c22;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(22, 163, 74, 0.55),
            0 0 0 1px rgba(21, 128, 61, 0.9);
        }

        .post-btn:disabled {
          opacity: 0.6;
          cursor: default;
          box-shadow: none;
        }

        @media (max-width: 768px) {
          .create-header {
            padding: 10px 16px;
          }

          .create-shell {
            margin-top: 20px;
          }

          .composer {
            padding-top: 14px;
          }

          .avatar-circle {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </div>
  );
}

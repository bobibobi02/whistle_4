// apps/web/pages/create-subforum.tsx
import { useState } from "react";
import { useRouter } from "next/router";

async function readJsonSafe(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    // Not JSON  likely an HTML error/redirect
    return { error: `Unexpected response (${res.status} ${res.statusText})`, raw: text.slice(0, 200) };
  }
}

export default function CreatePost() {
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subforum, setSubforum] = useState("");

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const POST_URL = "/api/posts";
  const UPLOAD_URL = "/api/upload";

  function handlePickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError("");

    if (imagePreview) URL.revokeObjectURL(imagePreview);

    if (!file) {
      setImageFile(null);
      setImagePreview("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be  10MB.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview("");
    setError("");
  }

  async function uploadImageIfAny(): Promise<string | undefined> {
    if (!imageFile) return undefined;

    const form = new FormData();
    form.append("file", imageFile);

    const res = await fetch(UPLOAD_URL, { method: "POST", body: form, credentials: "same-origin" });
    const data = await readJsonSafe(res);

    if (!res.ok) throw new Error(data?.error || "Image upload failed.");
    const url: string | undefined = data?.url || data?.secure_url || data?.path || data?.location;
    if (!url) throw new Error("Upload succeeded but no URL was returned.");
    return url;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("Please provide both a title and some content.");
      return;
    }

    try {
      setSubmitting(true);
      const mediaUrl = await uploadImageIfAny();

      const res = await fetch(POST_URL, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, subforum, mediaUrl }),
      });

      const data = await readJsonSafe(res);
      if (!res.ok) {
        throw new Error(data?.error || `Failed to create post (${res.status})`);
      }

      const postId: string | undefined = data?.id || data?.postId || data?._id;
      if (!postId) throw new Error("Post created but no id was returned.");

      // Let Feed/Home refresh
      try {
        window.dispatchEvent(new Event("whistle:posts-mutated"));
        localStorage.setItem("whistle:posts-mutated", String(Date.now()));
      } catch {}

      router.push(`/post/${postId}`);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <main className="create-wrap">
      <h1 className="create-title">Create New Post</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        {error && (
          <div className="form-error" role="alert" style={{ color: "#dc2626", fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div className="form-row">
          <label htmlFor="title" className="label">Title</label>
          <input
            id="title"
            className="input"
            placeholder="Enter post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div className="helper">{Math.max(0, 200 - title.length)} characters left</div>
        </div>

        <div className="form-row">
          <label htmlFor="content" className="label">Content</label>
          <textarea
            id="content"
            className="textarea"
            placeholder="Write your post content"
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <label htmlFor="subforum" className="label">
            Loop <span className="label-optional"> optional</span>
          </label>
          <input
            id="subforum"
            className="input"
            placeholder="e.g. general"
            value={subforum}
            onChange={(e) => setSubforum(e.target.value)}
          />
          <div className="helper">A short loop name like general, tech, etc.</div>
        </div>

        <div className="form-row">
          <label className="label">Image <span className="label-optional"> optional</span></label>
          <div className="file-control">
            <input
              id="post-image"
              name="file"
              type="file"
              accept="image/*"
              className="input-file"
              onChange={(e) => { handlePickImage(e); e.target.value = ""; }}
            />
            <label htmlFor="post-image" className="file-trigger">
              <span>Choose image</span>
            </label>
            {imageFile && <span className="file-name" title={imageFile.name}>{imageFile.name}</span>}
          </div>
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="preview" />
              <button type="button" className="remove-btn" onClick={clearImage}>
                Remove image
              </button>
            </div>
          )}
        </div>

        <div className="actions">
          <button className="btn-solid" type="submit" disabled={submitting}>
            {submitting ? "Posting" : "Post"}
          </button>
        </div>
      </form>
    </main>
  );
}


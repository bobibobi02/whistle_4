// apps/web/pages/500.tsx
import Link from "next/link";

export default function ServerError() {
  return (
    <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: "40px" }}>
      <div
        style={{
          maxWidth: 640,
          width: "100%",
          borderRadius: 16,
          padding: 24,
          background: "linear-gradient(180deg, rgba(21,27,34,0.75), rgba(16,21,27,0.78))",
          outline: "1px solid rgba(120,160,180,0.08)",
          boxShadow: "0 8px 20px rgba(0,0,0,.25)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.2, color: "#E6EEF2" }}>
          Something went wrong
        </h1>
        <p style={{ marginTop: 8, color: "#9FB2BA" }}>
          An unexpected error occurred. Try again, or head back to the feed.
        </p>
        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <Link href="/feed" className="btn-solid">
            Back to feed
          </Link>
          <Link href="/" className="chip">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}

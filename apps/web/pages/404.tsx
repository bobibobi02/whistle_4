// apps/web/pages/404.tsx
import Link from "next/link";

export default function NotFound() {
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
        <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.2, color: "#E6EEF2" }}>Page not found</h1>
        <p style={{ marginTop: 8, color: "#9FB2BA" }}>
          The page youre looking for doesnt exist or was moved.
        </p>
        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <Link href="/" className="btn-solid">
            Go home
          </Link>
          <Link href="/feed" className="chip">
            Browse feed
          </Link>
        </div>
      </div>
    </main>
  );
}


// pages/reset-password.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const t = (router.query.token as string) || "";
    setToken(t);
  }, [router.query.token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!token) {
      setErr("Missing token. Use the link from your email.");
      return;
    }
    if (!password || password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to reset password");
      }

      setMsg("Password updated. Redirecting to login");
      // If API included a redirectTo, use it; else send to /login
      const go = data?.redirectTo || "/login";
      setTimeout(() => router.push(go), 1200);
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0b1116", color: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <form onSubmit={onSubmit} style={{ width: "100%", maxWidth: 420, background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: 24, fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: "#fff" }}>Set a new password</div>
        <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
          Enter your new password below. The link expires shortly, so complete this step now.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", background: "#0b1116", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "10px 12px", outline: "none" }}
              placeholder=""
              minLength={8}
              required
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={{ width: "100%", background: "#0b1116", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "10px 12px", outline: "none" }}
              placeholder=""
              minLength={8}
              required
            />
          </div>
        </div>

        {err && <div style={{ color: "#fca5a5", fontSize: 13, marginTop: 12 }}>{err}</div>}
        {msg && <div style={{ color: "#86efac", fontSize: 13, marginTop: 12 }}>{msg}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 16,
            padding: "10px 14px",
            borderRadius: 10,
            background: "#22c55e",
            color: "#0b1116",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            opacity: loading ? 0.8 : 1,
          }}
        >
          {loading ? "Updating" : "Update password"}
        </button>
      </form>
    </div>
  );
}


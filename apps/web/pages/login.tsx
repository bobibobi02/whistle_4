import { FormEvent, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";

const LoginPage = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session?.user?.email) {
    // Already logged in – go home
    if (typeof window !== "undefined") {
      router.replace("/");
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: true,
      // Always come back to the local app root
      callbackUrl: "/",
      email,
      password,
    });

    // When redirect: true, NextAuth will navigate for us.
    // If it returns an error, show it.
    if (res && res.error) {
      setError(res.error);
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        backgroundColor: "#020817",
        color: "#E5E7EB",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          borderRadius: 18,
          padding: "22px 20px 18px",
          background:
            "linear-gradient(140deg, rgba(15,23,42,0.98), rgba(15,23,42,0.92))",
          boxShadow: "0 24px 80px rgba(0,0,0,0.85)",
          border: "1px solid rgba(31,41,55,0.9)",
        }}
      >
        <h1
          style={{
            margin: 0,
            marginBottom: 4,
            fontSize: 22,
            fontWeight: 700,
            color: "#F9FAFB",
          }}
        >
          Log in to Whistle
        </h1>
        <p
          style={{
            margin: 0,
            marginBottom: 18,
            fontSize: 13,
            color: "#9CA3AF",
          }}
        >
          Enter your email and password to continue.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
          <label style={{ fontSize: 12, color: "#CBD5F5" }}>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                marginTop: 4,
                width: "100%",
                padding: "7px 9px",
                borderRadius: 8,
                border: "1px solid rgba(55,65,81,0.9)",
                background: "transparent",
                color: "#E5E7EB",
                fontSize: 13,
                outline: "none",
              }}
            />
          </label>

          <label style={{ fontSize: 12, color: "#CBD5F5" }}>
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                marginTop: 4,
                width: "100%",
                padding: "7px 9px",
                borderRadius: 8,
                border: "1px solid rgba(55,65,81,0.9)",
                background: "transparent",
                color: "#E5E7EB",
                fontSize: 13,
                outline: "none",
              }}
            />
          </label>

          {error && (
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                color: "#FCA5A5",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: "7px 11px",
              borderRadius: 999,
              border: "none",
              background: loading
                ? "linear-gradient(to right,#16A34A,#166534)"
                : "linear-gradient(to right,#22C55E,#16A34A)",
              color: "#020817",
              fontWeight: 600,
              fontSize: 13,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default LoginPage;

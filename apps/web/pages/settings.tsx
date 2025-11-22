// pages/settings.tsx
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getSession, signOut } from "next-auth/react";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    (async () => {
      const session: any = await getSession();

      if (!session?.user?.email) {
        router.push("/api/auth/signin?callbackUrl=/settings");
        return;
      }

      const userEmail: string = session.user.email;
      const displayName: string =
        session.user.name ||
        (typeof userEmail === "string" ? userEmail.split("@")[0] : "");

      setEmail(userEmail || "");
      setUsername(displayName || "");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      // Best-effort update endpoint. If you have a real API route, keep it;
      // otherwise this won't block TypeScript or your build.
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: username }),
      });

      if (res.ok) {
        setMessage("Settings saved.");
      } else {
        setMessage("Could not save settings (server returned an error).");
      }
    } catch {
      setMessage("Could not save settings (network error).");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Head>
        <title>Settings  Whistle</title>
      </Head>

      <main className="container max-w-lg mx-auto py-8">
        <h1 className="text-2xl font-semibold mb-6">Account Settings</h1>

        <form onSubmit={onSave} className="space-y-4 bg-white border rounded p-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-700"
              value={email}
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">
              Your email is linked to your account and cannot be changed here.
            </p>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">
              Display name
            </label>
            <input
              id="username"
              className="w-full border rounded px-3 py-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your display name"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
            >
              {saving ? "Saving" : "Save changes"}
            </button>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-4 py-2 rounded border"
            >
              Sign out
            </button>
          </div>

          {message ? <p className="text-sm text-gray-700">{message}</p> : null}
        </form>
      </main>
    </>
  );
}


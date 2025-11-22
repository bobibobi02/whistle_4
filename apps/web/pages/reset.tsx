'use client';

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const token = typeof router.query.token === 'string' ? router.query.token : '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (router.isReady && !token) router.replace('/forgot');
  }, [router, token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirm) return setError('Passwords do not match');

    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.error || 'Reset failed');
      setDone(true);
      setTimeout(() => router.replace('/login'), 1200);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <form
        onSubmit={onSubmit}
        style={{
          width: '100%',
          maxWidth: 420,
          padding: 20,
          borderRadius: 16,
          background: 'linear-gradient(180deg, rgba(21,27,34,0.75), rgba(16,21,27,0.78))',
          outline: '1px solid rgba(120,160,180,0.08)',
          boxShadow: '0 10px 28px rgba(0,0,0,.35)',
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Choose a new password</h1>

        {done ? (
          <div style={{ color: '#c6f6d5', background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.35)', borderRadius: 12, padding: '8px 10px' }}>
            Password updated  redirecting to sign in
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>New password</span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="input"
                placeholder="At least 6 characters"
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Confirm password</span>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="input"
                placeholder="Re-type password"
              />
            </label>

            {error && (
              <div style={{ color: '#fecaca', background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.35)', borderRadius: 12, padding: '8px 10px' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-solid" disabled={busy || !password || !confirm} style={{ opacity: busy || !password || !confirm ? 0.7 : 1 }}>
              {busy ? 'Saving' : 'Save new password'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}


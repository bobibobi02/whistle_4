'use client';

import { useRouter } from 'next/router';
import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.error || 'Registration failed');

      // After successful sign up, go to login
      router.replace('/login');
    } catch (e: any) {
      setError(e?.message || 'Registration failed');
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
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Create your account</h1>
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Name</span>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input"
              placeholder="Your name"
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Email</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="input"
              placeholder="you@example.com"
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Password</span>
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

          {error && (
            <div style={{ color: '#fecaca', background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.35)', borderRadius: 12, padding: '8px 10px' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-solid" disabled={busy} style={{ opacity: busy ? .7 : 1 }}>
            {busy ? 'Creating' : 'Create account'}
          </button>
        </div>

        <div style={{ marginTop: 12, fontSize: 14, color: '#98a6ad' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#9FE6B2', fontWeight: 700 }}>
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}



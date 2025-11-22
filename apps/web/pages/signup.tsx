// apps/web/pages/signup.tsx
'use client';

import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { signIn } from 'next-auth/react';

type State = { loading: boolean; error: string; success: string };

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function pwOk(v: string) {
  return v.length >= 6;
}

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [state, setState] = useState<State>({ loading: false, error: '', success: '' });
  const [agree, setAgree] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ loading: true, error: '', success: '' });

    // client validation
    if (!name.trim()) return setState({ loading: false, error: 'Please enter a display name.', success: '' });
    if (!isEmail(email)) return setState({ loading: false, error: 'Please enter a valid email.', success: '' });
    if (!pwOk(pw)) return setState({ loading: false, error: 'Password must be at least 6 characters.', success: '' });
    if (pw !== pw2) return setState({ loading: false, error: 'Passwords do not match.', success: '' });
    if (!agree) return setState({ loading: false, error: 'You must accept the Terms to continue.', success: '' });

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password: pw }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.ok === false) throw new Error(j?.error || `Sign up failed (${res.status})`);

      // auto-login after signup
      const r = await signIn('credentials', {
        redirect: true,
        email: email.trim().toLowerCase(),
        password: pw,
        callbackUrl: '/feed',
      });
      if (!r) setState({ loading: false, error: 'Unexpected sign-in result.', success: '' });
    } catch (err: any) {
      setState({ loading: false, error: err?.message || 'Could not create account.', success: '' });
    }
  }

  return (
    <>
      <Head><title>Whistle  Sign up</title></Head>
      <main className="feed-wrap" style={{ maxWidth: 520 }}>
        <h1 style={{ fontWeight: 900, margin: '16px 0 10px' }}>Create your account</h1>
        <p style={{ color: '#64748b', marginTop: 0 }}>
          Join Whistle to post, comment, and save content. Already have an account?{' '}
          <Link href="/api/auth/signin" className="link">Log in</Link>.
        </p>

        <form onSubmit={onSubmit} className="form-card" style={{ padding: 16, marginTop: 12 }}>
          {state.error ? (
            <div className="comment-empty" style={{ color: '#ef4444', marginBottom: 12 }}>{state.error}</div>
          ) : null}

          <label className="label">Display name</label>
          <input
            className="input"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label className="label" style={{ marginTop: 10 }}>Email</label>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="label" style={{ marginTop: 10 }}>Password</label>
          <input
            className="input"
            type="password"
            placeholder="At least 6 characters"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
          />

          <label className="label" style={{ marginTop: 10 }}>Confirm password</label>
          <input
            className="input"
            type="password"
            placeholder="Re-enter password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            required
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span style={{ fontSize: 14 }}>
              I agree to the <Link className="link" href="/terms">Terms</Link> and <Link className="link" href="/privacy">Privacy</Link>.
            </span>
          </label>

          <button
            type="submit"
            className="btn-solid"
            disabled={state.loading}
            style={{ width: '100%', marginTop: 14 }}
            title="Create account"
          >
            {state.loading ? 'Creating' : 'Sign up'}
          </button>

          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 10 }}>
            By continuing, you agree to our User Agreement and acknowledge the Privacy Policy.
          </p>
        </form>
      </main>
    </>
  );
}



// apps/web/pages/auth.tsx
'use client';

import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';

type SignUpState = { loading: boolean; error: string };
type LoginState = { loading: boolean; error: string };

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function AuthPage() {
  const router = useRouter();

  // Default tab from hash; keep in sync both ways
  const [tab, setTab] = useState<'login' | 'signup'>('login');

  // Read NextAuth error param (e.g. CredentialsSignin) if we were redirected here
  const [providerError, setProviderError] = useState<string>('');
  useEffect(() => {
    const err = (router.query.error as string | undefined) || '';
    if (!err) return setProviderError('');
    // map a couple of common codes to user-friendly messages
    if (err === 'CredentialsSignin') setProviderError('Invalid email or password.');
    else if (err === 'OAuthAccountNotLinked') setProviderError('Please sign in using your original method.');
    else setProviderError('Sign in failed. Please try again.');
  }, [router.query.error]);

  // Sync tab from URL hash on mount + on hash changes
  useEffect(() => {
    const apply = () => {
      const h = (typeof window !== 'undefined' && window.location.hash.replace('#', '')) || '';
      if (h === 'signup') setTab('signup');
      else if (h === 'login') setTab('login');
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  // login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginState, setLoginState] = useState<LoginState>({ loading: false, error: '' });

  // signup state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [agree, setAgree] = useState(false);
  const [upState, setUpState] = useState<SignUpState>({ loading: false, error: '' });

  function goLogin() {
    setTab('login');
    if (location.hash !== '#login') history.replaceState(null, '', '#login');
  }
  function goSignup() {
    setTab('signup');
    if (location.hash !== '#signup') history.replaceState(null, '', '#signup');
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginState({ loading: true, error: '' });
    setProviderError('');
    try {
      if (!isEmail(loginEmail)) throw new Error('Please enter a valid email.');
      if (!loginPw) throw new Error('Please enter your password.');

      // Use redirect: false so we can read the result and navigate ourselves
      const res = await signIn('credentials', {
        redirect: false,
        email: loginEmail.trim().toLowerCase(),
        password: loginPw,
        callbackUrl: '/feed',
      });

      if (res?.ok) {
        window.location.assign(res.url || '/feed');
        return;
      }

      // NextAuth returns { ok: false, status: 401, error: 'CredentialsSignin' }
      const msg =
        res?.error === 'CredentialsSignin'
          ? 'Invalid email or password.'
          : res?.error || 'Could not sign in.';
      setLoginState({ loading: false, error: msg });
    } catch (err: any) {
      setLoginState({ loading: false, error: err?.message || 'Could not sign in.' });
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setUpState({ loading: true, error: '' });
    setProviderError('');
    try {
      if (!name.trim()) throw new Error('Please enter a display name.');
      if (!isEmail(email)) throw new Error('Please enter a valid email.');
      if (pw.length < 6) throw new Error('Password must be at least 6 characters.');
      if (pw !== pw2) throw new Error('Passwords do not match.');
      if (!agree) throw new Error('You must accept the Terms to continue.');

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password: pw }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.ok === false) throw new Error(j?.error || `Sign up failed (${res.status})`);

      // Auto-login with redirect: false, then navigate
      const r = await signIn('credentials', {
        redirect: false,
        email: email.trim().toLowerCase(),
        password: pw,
        callbackUrl: '/feed',
      });

      if (r?.ok) {
        window.location.assign(r.url || '/feed');
        return;
      }

      const msg = r?.error || 'Account created, but auto sign-in failed  please sign in.';
      setUpState({ loading: false, error: msg });
      setTab('login');
      history.replaceState(null, '', '#login');
    } catch (err: any) {
      setUpState({ loading: false, error: err?.message || 'Could not create account.' });
    }
  }

  return (
    <>
      <Head><title>Whistle  Login / Sign up</title></Head>

      <main className="feed-wrap" style={{ maxWidth: 560 }}>
        <h1 style={{ fontWeight: 900, margin: '16px 0 6px' }}>Welcome to Whistle</h1>
        <p style={{ color: '#64748b', marginTop: 0 }}>
          Lightweight posts. Clean vibes. Choose how you want to get started.
        </p>

        {/* Tabs */}
        <div className="form-card" style={{ padding: 0, overflow: 'hidden', marginTop: 16 }}>
          <div
            role="tablist"
            aria-label="Auth tabs"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 0,
              borderBottom: '1px solid var(--border)',
              background: 'color-mix(in oklab, var(--surface) 92%, transparent)',
            }}
          >
            <button
              role="tab"
              aria-selected={tab === 'login'}
              className="chip"
              onClick={goLogin}
              style={{
                border: 0,
                borderRadius: 0,
                padding: '12px 0',
                fontWeight: 800,
                background: tab === 'login' ? 'var(--whistle-green)' : 'transparent',
                color: tab === 'login' ? '#062d1a' : 'inherit',
              }}
            >
              Log in
            </button>
            <button
              role="tab"
              aria-selected={tab === 'signup'}
              className="chip"
              onClick={goSignup}
              style={{
                border: 0,
                borderRadius: 0,
                padding: '12px 0',
                fontWeight: 800,
                background: tab === 'signup' ? 'var(--whistle-green)' : 'transparent',
                color: tab === 'signup' ? '#062d1a' : 'inherit',
              }}
            >
              Sign up
            </button>
          </div>

          {/* Global provider error (from NextAuth redirects) */}
          {providerError && (
            <div className="comment-empty" style={{ color: '#ef4444', padding: '10px 18px' }}>
              {providerError}
            </div>
          )}

          {/* Panels */}
          <div style={{ padding: 18 }}>
            {tab === 'login' ? (
              <form onSubmit={handleLogin} style={{ display: 'grid', rowGap: 12 }}>
                {loginState.error && (
                  <div className="comment-empty" style={{ color: '#ef4444' }}>{loginState.error}</div>
                )}

                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  autoFocus
                />

                <label className="label">Password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Your password"
                  value={loginPw}
                  onChange={(e) => setLoginPw(e.target.value)}
                  required
                />

                <button
                  type="submit"
                  className="btn-solid"
                  disabled={loginState.loading}
                  style={{ width: '100%', marginTop: 6 }}
                >
                  {loginState.loading ? 'Signing in' : 'Sign in'}
                </button>

                <p className="small-muted" style={{ textAlign: 'center', marginTop: 8 }}>
                  New here?{' '}
                  <a
                    className="link"
                    href="#signup"
                    onClick={(e) => { e.preventDefault(); goSignup(); }}
                  >
                    Create an account
                  </a>
                </p>
              </form>
            ) : (
              <form onSubmit={handleSignup} style={{ display: 'grid', rowGap: 12 }}>
                {upState.error && (
                  <div className="comment-empty" style={{ color: '#ef4444' }}>{upState.error}</div>
                )}

                <label className="label">Display name</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />

                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <label className="label">Password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="At least 6 characters"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  required
                />

                <label className="label">Confirm password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Re-enter password"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  required
                />

                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                  <span style={{ fontSize: 14 }}>
                    I agree to the <Link className="link" href="/terms">Terms</Link> and{' '}
                    <Link className="link" href="/privacy">Privacy</Link>.
                  </span>
                </label>

                <button
                  type="submit"
                  className="btn-solid"
                  disabled={upState.loading}
                  style={{ width: '100%', marginTop: 6 }}
                >
                  {upState.loading ? 'Creating' : 'Sign up'}
                </button>

                <p className="small-muted" style={{ textAlign: 'center', marginTop: 8 }}>
                  Already have an account?{' '}
                  <a
                    className="link"
                    href="#login"
                    onClick={(e) => { e.preventDefault(); goLogin(); }}
                  >
                    Log in
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      </main>
    </>
  );
}


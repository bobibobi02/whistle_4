// apps/web/src/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import React from 'react';
import { useRouter } from 'next/router';

async function hardSignOut(callbackUrl = '/') {
  try {
    const csrfRes = await fetch('/api/auth/csrf', { credentials: 'same-origin' });
    const { csrfToken } = await csrfRes.json();

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/auth/signout';

    const csrf = document.createElement('input');
    csrf.type = 'hidden';
    csrf.name = 'csrfToken';
    csrf.value = csrfToken;

    const cb = document.createElement('input');
    cb.type = 'hidden';
    cb.name = 'callbackUrl';
    cb.value = callbackUrl;

    form.appendChild(csrf);
    form.appendChild(cb);
    document.body.appendChild(form);
    form.submit();
  } catch {
    await signOut({ callbackUrl });
  }
}

export function Navbar() {
  const { status } = useSession(); // 'loading' | 'authenticated' | 'unauthenticated'
  const router = useRouter();

  // Theme toggle (store under a consistent key)
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('whistle-theme') as 'light' | 'dark' | null;
      const initial =
        saved ??
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light');
      setTheme(initial);
      document.documentElement.setAttribute('data-theme', initial);
    } catch {}
  }, []);
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('whistle-theme', next);
    } catch {}
  };

  // Login/Signup menu
  const [authOpen, setAuthOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  // Close on outside click / Esc
  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current) return;
      if (e.target instanceof Node && !menuRef.current.contains(e.target)) {
        setAuthOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setAuthOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Close on route change (properly register & unregister handler)
  React.useEffect(() => {
    const handler = () => setAuthOpen(false);
    router.events.on('routeChangeStart', handler);
    return () => {
      router.events.off('routeChangeStart', handler);
    };
  }, [router.events]);

  return (
    <nav className="navbar">
      <div className="inner">
        <Link href="/" className="logo">Whistle</Link>

        <div className="nav-links">
          <Link href="/feed" className="link">Feed</Link>
          <Link href="/create" className="link">Create Post</Link>

          <button
            type="button"
            className="theme-toggle"
            aria-label="Toggle dark mode"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? ' Dark' : ' Light'}
          </button>

          {status === 'loading' ? (
            <span className="link" aria-hidden style={{ opacity: 0.5 }}></span>
          ) : status === 'authenticated' ? (
            <>
              <Link href="/profile" className="link">Profile</Link>
              <button
                type="button"
                onClick={() => hardSignOut('/')}
                className="link"
                title="Sign out"
              >
                Log out
              </button>
            </>
          ) : (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="link"
                aria-haspopup="menu"
                aria-expanded={authOpen}
                aria-controls="auth-menu"
                onClick={() => setAuthOpen(v => !v)}
                title="Open authentication menu"
              >
                Login / Sign up 
              </button>

              {authOpen && (
                <div
                  id="auth-menu"
                  role="menu"
                  aria-label="Authentication options"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    minWidth: 200,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    boxShadow: 'var(--shadow-2)',
                    padding: 8,
                    display: 'grid',
                    gap: 6,
                    zIndex: 1000,
                  }}
                >
                  <Link
                    role="menuitem"
                    href="/auth#login"
                    className="link"
                    onClick={() => setAuthOpen(false)}
                    style={{
                      display: 'block',
                      padding: '10px 12px',
                      borderRadius: 10,
                      textDecoration: 'none',
                    }}
                  >
                    Log in
                  </Link>
                  <Link
                    role="menuitem"
                    href="/auth#signup"
                    className="link"
                    onClick={() => setAuthOpen(false)}
                    style={{
                      display: 'block',
                      padding: '10px 12px',
                      borderRadius: 10,
                      textDecoration: 'none',
                      fontWeight: 800,
                    }}
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}


// apps/web/pages/_app.tsx
import type { AppProps } from 'next/app';
import { SessionProvider, useSession, signOut } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import '../styles/globals.css';
import ToastProvider from '@/components/toast';
import { DialogProvider } from '@/components/ui/DialogProvider';

/**
 * GLOBAL SAFETY PATCHES
 * 1) Response.prototype.json(): return {} on empty/non-JSON bodies.
 * 2) Response.prototype.text(): for same-origin /api/*, return '{}' when empty.
 * 3) fetch wrapper: for same-origin /api/*, if body is empty, replace with '{}'.
 *    This prevents any "Unexpected end of JSON input" from legacy code paths.
 */
(function installNetworkGuardsOnce() {
  if (typeof window === 'undefined') return;
  const w: any = window; // <-- removed @ts-expect-error; use any instead.
  if (w.__networkGuardsInstalled) return;
  w.__networkGuardsInstalled = true;

  // ----- Safe json/text on Response prototype -----
  const origJson = Response.prototype.json;
  const origText = Response.prototype.text;

  Response.prototype.json = async function patchedJson() {
    try {
      const t = await this.clone().text().catch(() => '');
      if (!t) return {} as any;
      try {
        return JSON.parse(t);
      } catch {
        return {} as any;
      }
    } catch {
      return origJson.apply(this, arguments as any);
    }
  };

  Response.prototype.text = async function patchedText() {
    try {
      const txt = await (origText.apply(this, arguments as any) as Promise<string>).catch(
        () => ''
      );
      if (txt) return txt;
      const url = (this as Response).url || '';
      const sameOrigin = !/^https?:\/\//i.test(url) || url.startsWith(location.origin);
      if (sameOrigin && /\/api\//.test(url)) return '{}';
      return '';
    } catch {
      return '{}';
    }
  };

  // ----- Fetch wrapper (guarantee non-empty bodies for /api/*) -----
  const origFetch = w.fetch.bind(window) as typeof fetch;

  w.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const res = await origFetch(input, init);

    try {
      const urlStr = typeof input === 'string' ? input : (input as any)?.url ?? (res as any).url ?? '';
      const sameOrigin = !/^https?:\/\//i.test(urlStr) || urlStr.startsWith(location.origin);

      // Only normalize our own API responses
      if (!sameOrigin || !/\/api\//.test(urlStr)) return res;

      // Peek at the body; if it's empty, replace with '{}' so ANY parser is safe
      const txt = await res.clone().text().catch(() => '');
      if (txt && txt.length > 0) return res;

      const headers = new Headers(res.headers);
      if (!headers.get('content-type')) headers.set('content-type', 'application/json');

      const safe = new Response('{}', {
        status: res.status,
        statusText: res.statusText,
        headers,
      });
      Object.defineProperty(safe, 'url', { value: (res as any).url, writable: false });
      return safe;
    } catch {
      return res;
    }
  }) as typeof fetch;
})();

/** Hard sign-out helper */
async function hardSignOut(callbackUrl = '/') {
  try {
    const csrfRes = await fetch('/api/auth/csrf', { credentials: 'same-origin' });
    const { csrfToken } = (await csrfRes.json()) as any;

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

function Navbar() {
  const { status } = useSession();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const saved =
      (typeof window !== 'undefined' &&
        (localStorage.getItem('whistle-theme') as 'light' | 'dark' | null)) || 'dark';
    setTheme(saved);
    if (typeof document !== 'undefined') document.documentElement.dataset.theme = saved;
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try {
      localStorage.setItem('whistle-theme', next);
    } catch {}
    if (typeof document !== 'undefined') document.documentElement.dataset.theme = next;
  };

  return (
    <header className="navbar">
      <div className="inner">
        <Link href="/" className="logo">
          Whistle
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 'auto' }}>
          <nav className="nav-links">
            <Link href="/feed" className="link">
              Feed
            </Link>
            <Link href="/create" className="link">
              Create Post
            </Link>
            {status === 'loading' ? (
              <span className="link" aria-hidden style={{ opacity: 0.5 }}>
                
              </span>
            ) : status === 'authenticated' ? (
              <>
                <Link href="/profile" className="link">
                  Profile
                </Link>
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
              <Link href="/api/auth/signin" className="link">
                Login
              </Link>
            )}
          </nav>
          <button type="button" className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? <span> Dark</span> : <span> Light</span>}
          </button>
        </div>
      </div>
    </header>
  );
}

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  // Reset all file inputs after change so choosing the same file twice still fires onChange
  useEffect(() => {
    const handler = (event: any) => {
      const target = event.target as HTMLInputElement | null;
      if (target && target.tagName === "INPUT" && target.type === "file") {
        // Let React's onChange run first, then clear the value
        setTimeout(() => {
          try {
            target.value = "";
          } catch {
            // ignore
          }
        }, 0);
      }
    };

    document.addEventListener("change", handler, true);
    return () => {
      document.removeEventListener("change", handler, true);
    };
  }, []);
  return (
    <SessionProvider session={session}>
      <DialogProvider>
        <ToastProvider>
          <Head>
            <title>Whistle</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
          </Head>

          {/* (UI styles kept as-is) */}
          <Navbar />
          <Component {...pageProps} />
        </ToastProvider>
      </DialogProvider>
    </SessionProvider>
  );
}


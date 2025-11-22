'use client';

import { useState } from 'react';
import Link from 'next/link';

type SmtpDebug = { sent?: boolean; reason?: string | null; hasTransport?: boolean } | undefined;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [smtp, setSmtp] = useState<SmtpDebug>(undefined);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setDevResetUrl(null);
    setCopied(false);
    setSmtp(undefined);
    try {
      const res = await fetch('/api/auth/reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.error || 'Request failed');
      setDone(true);
      if (data.resetUrl) setDevResetUrl(data.resetUrl); // Dev helper (shows when allowed by server)
      if (data.smtp) setSmtp(data.smtp as SmtpDebug);   //   show small debug line if server allowed it
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!devResetUrl) return;
    try {
      await navigator.clipboard.writeText(devResetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 560,
    padding: 20,
    borderRadius: 16,
    background: 'linear-gradient(180deg, rgba(21,27,34,0.75), rgba(16,21,27,0.78))',
    outline: '1px solid rgba(120,160,180,0.08)',
    boxShadow: '0 10px 28px rgba(0,0,0,.35)',
  };

  const pillStyle: React.CSSProperties = {
    color: '#c6f6d5',
    background: 'rgba(16,185,129,.15)',
    border: '1px solid rgba(16,185,129,.35)',
    borderRadius: 12,
    padding: '10px 12px',
  };

  const DebugLine = ({ smtp }: { smtp?: SmtpDebug }) => {
    if (!smtp) return null;
    const color = smtp.sent ? '#9FE6B2' : '#FCA5A5';
    const text = smtp.sent
      ? 'SMTP: sent  (check your Mailtrap inbox)'
      : `SMTP: not sent  ${smtp.reason || 'unknown'}`;
    return (
      <div style={{ fontSize: 12, color, opacity: 0.9 }}>
        {text}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <form onSubmit={onSubmit} style={cardStyle}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Reset your password</h1>

        {done ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={pillStyle}>
              If an account with that email exists, weve sent a reset link.
            </div>

            {/* Tiny debug line (only shown if API returned it, e.g., when SHOW_SMTP_DEBUG=true) */}
            <DebugLine smtp={smtp} />

            {/* Dev helper block  wraps long URL nicely */}
            {devResetUrl && (
              <div style={{ fontSize: 14, color: '#98a6ad', display: 'grid', gap: 8 }}>
                <div style={{ opacity: 0.9 }}>Dev helper link:</div>

                <div
                  style={{
                    display: 'grid',
                    gap: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(120,160,180,0.12)',
                    borderRadius: 12,
                    padding: 10,
                  }}
                >
                  <a
                    href={devResetUrl}
                    style={{
                      color: '#9FE6B2',
                      fontWeight: 700,
                      wordBreak: 'break-all',
                      overflowWrap: 'anywhere',
                      lineBreak: 'anywhere' as any,
                      textDecoration: 'underline',
                    }}
                  >
                    {devResetUrl}
                  </a>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-solid"
                      onClick={copyLink}
                      style={{ padding: '6px 10px' }}
                    >
                      {copied ? 'Copied!' : 'Copy link'}
                    </button>
                    <Link
                      href="/login"
                      className="btn-ghost"
                      style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(120,160,180,0.15)' }}
                    >
                      Back to Login
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
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

            {error && (
              <div
                role="alert"
                style={{
                  color: '#fecaca',
                  background: 'rgba(239,68,68,.15)',
                  border: '1px solid rgba(239,68,68,.35)',
                  borderRadius: 12,
                  padding: '8px 10px',
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="submit"
                className="btn-solid"
                disabled={busy || !email}
                style={{ opacity: busy || !email ? 0.7 : 1 }}
              >
                {busy ? 'Sending' : 'Send reset link'}
              </button>
              <Link
                href="/login"
                className="btn-ghost"
                style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(120,160,180,0.15)' }}
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}


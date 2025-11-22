'use client';

import { useState } from 'react';

type Resp =
  | { ok: true; message: string; info?: { host?: string; port?: number; secure?: boolean } }
  | { ok: false; error: string; detail?: string };

export default function SmtpTestPage() {
  const [out, setOut] = useState<Resp | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setOut(null);
    try {
      const r = await fetch('/api/debug/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: '' }),
      });
      const j = (await r.json()) as Resp;
      setOut(j);
    } catch (e: any) {
      setOut({ ok: false, error: 'Fetch failed', detail: String(e?.message || e) } as Resp);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          padding: 20,
          borderRadius: 16,
          background: 'linear-gradient(180deg, rgba(21,27,34,0.75), rgba(16,21,27,0.78))',
          outline: '1px solid rgba(120,160,180,0.08)',
          boxShadow: '0 10px 28px rgba(0,0,0,.35)',
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>SMTP Self-Test</h1>
        <p style={{ opacity: 0.9, marginBottom: 12 }}>
          This sends a one-line email using your <code>EMAIL_SERVER</code> / <code>EMAIL_FROM</code>.  
          With Mailtrap, open your Inbox UI to see the message.
        </p>

        <button className="btn-solid" onClick={run} disabled={busy} style={{ marginBottom: 16 }}>
          {busy ? 'Testing' : 'Send test email'}
        </button>

        {out && (
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(120,160,180,0.12)',
              borderRadius: 12,
              padding: 12,
            }}
          >
            {JSON.stringify(out, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}


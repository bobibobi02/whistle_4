import React, { useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  dangerLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  subtitle,
  dangerLabel,
  cancelLabel = 'Cancel',
  busy = false,
  error = null,
  onConfirm,
  onClose,
}: Props) {
  const primaryRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => primaryRef.current?.focus(), 10);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="cd-wrap"
      onClick={() => !busy && onClose()}
    >
      <div className="cd-card" onClick={(e) => e.stopPropagation()}>
        <div id="confirm-title" className="cd-title">{title}</div>
        {subtitle && <div className="cd-sub">{subtitle}</div>}
        {error && <div className="cd-error" role="alert">{error}</div>}

        <div className="cd-actions">
          <button
            className="cd-cancel"
            onClick={onClose}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            ref={primaryRef}
            className="cd-danger"
            onClick={onConfirm}
            disabled={busy}
          >
            {dangerLabel}
          </button>
        </div>
      </div>

      <style jsx>{`
        :root {
          --brand-green: #22C55E;
          --brand-blue: #2563EB;
          --brand-red:  #B91C1C;
          --bg-card:    #0B0F14;
          --text-main:  #E6F0F2;
          --text-sub:   #A7B5C2;
        }
        .cd-wrap {
          position: fixed; inset: 0; z-index: 9999;
          display: grid; place-items: center;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(2px);
        }
        .cd-card {
          width: min(520px, 92vw);
          background: var(--bg-card);
          color: var(--text-main);
          border: 1px solid rgba(34,197,94,0.25);
          border-radius: 16px;
          box-shadow: 0 10px 24px rgba(0,0,0,.55);
          padding: 18px 20px 16px;
          animation: cd-pop .12s ease-out;
        }
        @keyframes cd-pop { from { transform: scale(.98); opacity:.9 } to { transform: scale(1); opacity:1 } }
        .cd-title { font-weight: 800; font-size: 22px; letter-spacing: .2px; }
        .cd-sub   { margin-top: 6px; color: var(--text-sub); font-size: 14px; }
        .cd-error {
          margin: 10px 0 12px; padding: 8px 10px;
          border: 1px solid rgba(185,28,28,.55); background: rgba(185,28,28,.12);
          color: #FFD1D1; border-radius: 10px; font-size: 14px;
        }
        .cd-actions { margin-top: 14px; display: flex; gap: 10px; justify-content: flex-end; }
        .cd-danger, .cd-cancel {
          height: 40px; min-width: 112px; padding: 0 16px;
          border-radius: 999px; font-weight: 800; letter-spacing: .2px; cursor: pointer;
        }
        .cd-danger { background: var(--brand-red); color: #FFECEC; border: 1px solid #7F1D1D; }
        .cd-danger:hover { background: #991B1B; }
        .cd-danger:disabled, .cd-cancel:disabled { opacity: .75; cursor: default; }
        .cd-danger:focus, .cd-cancel:focus { outline: 2px solid var(--brand-green); outline-offset: 2px; }
        .cd-cancel { color: #D6E4FF; background: transparent; border: 1px solid rgba(37,99,235,.5); }
        .cd-cancel:hover { background: rgba(37,99,235,.12); }
      `}</style>
    </div>
  );
}

'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

type Tone = 'default' | 'danger';
type DialogState =
  | {
      kind: 'confirm';
      message: string;
      tone: Tone;
      confirmLabel?: string;
      cancelLabel?: string;
      resolve: (ok: boolean) => void;
    }
  | {
      kind: 'notify';
      message: string;
      tone: Tone;
      confirmLabel?: string;
      resolve: () => void;
    };

type DialogCtx = {
  confirm: (
    message: string,
    tone?: Tone,
    confirmLabel?: string,
    cancelLabel?: string
  ) => Promise<boolean>;
  notify: (message: string, tone?: Tone, confirmLabel?: string) => Promise<void>;
};

const Ctx = createContext<DialogCtx | null>(null);

export function useDialog() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDialog must be used inside <DialogProvider>');
  return v;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const confirm = useCallback(
    (message: string, tone: Tone = 'default', confirmLabel?: string, cancelLabel?: string) =>
      new Promise<boolean>((resolve) =>
        setDialog({ kind: 'confirm', message, tone, confirmLabel, cancelLabel, resolve })
      ),
    []
  );

  const notify = useCallback(
    (message: string, tone: Tone = 'default', confirmLabel?: string) =>
      new Promise<void>((resolve) =>
        setDialog({ kind: 'notify', message, tone, confirmLabel, resolve })
      ),
    []
  );

  const close = () => setDialog(null);

  return (
    <Ctx.Provider value={{ confirm, notify }}>
      {children}
      <DialogHost dialog={dialog} close={close} />
    </Ctx.Provider>
  );
}

function DialogHost({ dialog, close }: { dialog: DialogState | null; close: () => void }) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    confirmBtnRef.current?.focus();
  }, [dialog]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!dialog) return;
      if (e.key === 'Escape') {
        if (dialog.kind === 'confirm') dialog.resolve(false);
        else dialog.resolve();
        close();
      }
      if (e.key === 'Enter') {
        if (dialog.kind === 'confirm') dialog.resolve(true);
        else dialog.resolve();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, close]);

  if (!dialog) return null;

  const isConfirm = dialog.kind === 'confirm';
  const tone = dialog.tone ?? 'default';
  const confirmLabel =
    dialog.confirmLabel ?? (isConfirm ? (tone === 'danger' ? 'Delete' : 'OK') : 'OK');
  const cancelLabel = (dialog as any).cancelLabel ?? 'Cancel';

  const onOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      if (isConfirm) dialog.resolve(false);
      else dialog.resolve();
      close();
    }
  };

  const onConfirm = () => {
    if (isConfirm) dialog.resolve(true);
    else dialog.resolve();
    close();
  };

  const onCancel = () => {
    if (isConfirm) dialog.resolve(false);
    else dialog.resolve();
    close();
  };

  return (
    <div
      ref={overlayRef}
      className={`dlg2-overlay ${tone}`}
      role="dialog"
      aria-modal="true"
      onMouseDown={onOverlayClick}
    >
      <div className={`dlg2-card ${tone}`}>
        <div className="dlg2-header">
          <div className="dlg2-kicker">
            <span aria-hidden className="dlg2-icon">{tone === 'danger' ? 'Р  Р’ Р ™Р’ Р  Р’ Р Р†Р љР’ Р  Р’ Р  Р №Р  Р  Р Р†Р љРЎєР РЋРЎєР  Р’ Р Р†Р љРІћСћР  РІв„ўР ™Р’ Р  Р’ Р ™Р’ Р  Р Р‹Р Р†Р љРІСњР  Р’ Р  Р №Р  Р  Р  РІС™Р ™Р’ВР  Р’ Р ™Р’ Р  Р’ Р  Р РЏ' : 'Р  Р’ Р ™Р’ Р  Р’ Р Р†Р љР’ Р  Р’ Р  РІ Р  Р’ Р Р†Р љРЎв„ўР  Р Р‹Р Р†Р љРЎќР  Р’ Р  РІ Р  Р  Р  РІС™Р РЋРІС”Р  Р  Р  РІС™Р Р†Р љРЎС™Р  Р’ Р ™Р’ Р  Р Р‹Р Р†Р љРІСњР  Р’ Р  Р №Р  Р  Р  РІС™Р ™Р’ВР  Р’ Р ™Р’ Р  Р’ Р  Р РЏ'}</span>
            <span className="dlg2-title">{isConfirm ? 'Confirm' : 'Notice'}</span>
          </div>
        </div>
        <div className="dlg2-body">{dialog.message}</div>
        <div className="dlg2-actions">
          {isConfirm ? (
            <>
              <button
                ref={confirmBtnRef}
                className={`chip ${tone === 'danger' ? 'fill-rose' : 'fill-emerald'}`}
                onClick={onConfirm}
              >
                <span aria-hidden>{tone === 'danger' ? 'Р  Р’ Р  Р №Р  Р’ Р Р†Р љРЎв„ўР  Р’ Р  Р №Р  Р Р‹Р РЋРЎСџР  Р’ Р  РІ Р  Р’ Р Р†Р љРЎв„ўР  Р  Р  РІС™Р РЋРЎС™Р  Р’ Р  РІ Р  Р’ Р Р†Р љРЎв„ўР  РІв„ўР ™Р’ВР  Р’ Р ™Р’ Р  Р Р‹Р Р†Р љРІСњР  Р’ Р  Р №Р  Р  Р  РІС™Р ™Р’ВР  Р’ Р ™Р’ Р  Р’ Р  Р РЏ' : 'Р  Р’ Р ™Р’ Р  Р’ Р Р†Р љР’ Р  Р’ Р  Р №Р  Р Р‹Р Р†РІС›РЎС›Р  Р’ Р  РІ Р  Р’ Р Р†Р љРЎв„ўР  РІв„ўР ™Р’В¦'}</span>
                <span>{confirmLabel}</span>
              </button>
              <button className="chip outline" onClick={onCancel}>
                <span aria-hidden>Р  Р’ Р ™Р’ Р  Р’ Р Р†Р љР’ Р  Р’ Р  Р №Р  Р Р‹Р Р†РІС›РЎС›Р  Р’ Р  РІ Р  Р’ Р Р†Р љРЎв„ўР  Р  Р  РІС™Р РЋРЎв„ўР  Р’ Р ™Р’ Р  Р Р‹Р Р†Р љРІСњР  Р’ Р  Р №Р  Р  Р  РІС™Р ™Р’ВР  Р’ Р ™Р’ Р  Р’ Р  Р РЏ</span>
                <span>{cancelLabel}</span>
              </button>
            </>
          ) : (
            <button ref={confirmBtnRef} className="chip fill-emerald" onClick={onConfirm}>
              <span aria-hidden>Р  Р’ Р  Р №Р  Р’ Р Р†Р љРЎв„ўР  Р’ Р  Р №Р  Р Р‹Р РЋРЎСџР  Р’ Р  РІ Р  Р’ Р Р†Р љРЎв„ўР  РІв„ўР ™Р’ВР  Р’ Р ™Р’ Р  Р’ Р  РІВ°</span>
              <span>{confirmLabel}</span>
            </button>
          )}
        </div>
      </div>

      <style jsx global>{`
        .dlg2-overlay {
          position: fixed;
          inset: 0;
          display: grid;
          place-items: center;
          backdrop-filter: blur(2px);
          z-index: 60;
          animation: fadeIn 0.12s ease-out;
        }
        .dlg2-overlay.default {
          background: linear-gradient(0deg, rgba(3, 7, 18, 0.78), rgba(3, 7, 18, 0.78)),
            radial-gradient(60% 40% at 50% 10%, rgba(16, 185, 129, 0.12), transparent 70%);
        }
        .dlg2-overlay.danger {
          background: linear-gradient(0deg, rgba(3, 7, 18, 0.78), rgba(3, 7, 18, 0.78)),
            radial-gradient(60% 40% at 50% 10%, rgba(244, 63, 94, 0.1), transparent 70%);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @media (prefers-reduced-transparency: reduce) {
          .dlg2-overlay.default,
          .dlg2-overlay.danger {
            background: rgba(3, 7, 18, 0.86);
            backdrop-filter: none;
          }
        }
        .dlg2-card {
          width: min(560px, calc(100% - 32px));
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(18, 24, 35, 0.95), rgba(12, 17, 27, 0.95));
          border: 1px solid #0b1220;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.42);
          color: #e5e7eb;
          transform: scale(0.98);
          animation: popIn 0.14s ease-out forwards;
        }
        @keyframes popIn {
          to {
            transform: scale(1);
          }
        }
        .dlg2-header {
          padding: 14px 16px 8px;
          background: linear-gradient(180deg, rgba(34, 197, 94, 0.1), transparent);
          border-top-left-radius: 18px;
          border-top-right-radius: 18px;
        }
        .dlg2-card.danger .dlg2-header {
          background: linear-gradient(180deg, rgba(244, 63, 94, 0.12), transparent);
        }
        .dlg2-kicker {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dlg2-icon {
          font-size: 18px;
        }
        .dlg2-title {
          font-weight: 800;
          letter-spacing: 0.01em;
          color: #f3f4f6;
        }
        .dlg2-body {
          padding: 10px 16px 6px;
          color: #cbd5e1;
          line-height: 1.6;
        }
        .dlg2-actions {
          padding: 12px 16px 16px;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          flex-wrap: wrap;
        }
        .chip.fill-emerald {
          background: #22c55e;
          color: #0b1220;
          border-radius: 999px;
          padding: 8px 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .chip.fill-rose {
          background: #f43f5e;
          color: #0b1220;
          border-radius: 999px;
          padding: 8px 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .chip.outline {
          border-radius: 999px;
          padding: 8px 12px;
          border: 1px solid rgba(148, 163, 184, 0.35);
          color: #e5e7eb;
          background: transparent;
        }
        .chip.outline:hover {
          background: rgba(255, 255, 255, 0.04);
        }
      `}</style>
    </div>
  );
}

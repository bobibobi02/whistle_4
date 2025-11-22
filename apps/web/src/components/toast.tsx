// apps/web/src/components/toast.tsx
// Keep this LOWERCASE filename on Windows to avoid casing collisions.
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

/* =========================================================
   Global Toasts
   - Wrap your app with <ToastProvider> (e.g. in _app.tsx)
   - Use EITHER:
       const push = useToast(); push('Saved!', { variant: 'success' });
     OR (works anywhere, no hook):
       toast('Saved!', { variant: 'success' });
   - Variants: 'info' (default), 'success', 'error'
   ========================================================= */

type ToastVariant = "info" | "success" | "error";
type ToastItem = {
  id: number;
  message: string | React.ReactNode;
  duration: number;
  variant: ToastVariant;
};

type ToastCtx = {
  toasts: ToastItem[];
  push: (
    message: string | React.ReactNode,
    opts?: { duration?: number; variant?: ToastVariant }
  ) => void;
  remove: (id: number) => void;
};

const EVT = "whistle:toast";

const ToastContext = createContext<ToastCtx>({
  toasts: [],
  push: () => {},
  remove: () => {},
});

/** Hook-based API */
export function useToast() {
  return useContext(ToastContext).push;
}

/** Global function API (no hooks) */
export function toast(
  message: string | React.ReactNode,
  opts?: { duration?: number; variant?: ToastVariant }
) {
  if (typeof window === "undefined") return;
  const detail = {
    message,
    duration: Math.max(1000, opts?.duration ?? 3000),
    variant: (opts?.variant ?? "info") as ToastVariant,
  };
  window.dispatchEvent(new CustomEvent(EVT, { detail }));
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (
      message: string | React.ReactNode,
      opts?: { duration?: number; variant?: ToastVariant }
    ) => {
      const id = Date.now() + Math.random();
      const duration = Math.max(1000, opts?.duration ?? 3000);
      const variant: ToastVariant = opts?.variant ?? "info";
      setToasts((list) => [...list, { id, message, duration, variant }]);
      window.setTimeout(() => remove(id), duration);
    },
    [remove]
  );

  // Bridge global `toast()` calls (CustomEvent) into context `push`
  useEffect(() => {
    function onGlobalToast(e: Event) {
      const ce = e as CustomEvent<{
        message: string | React.ReactNode;
        duration: number;
        variant: ToastVariant;
      }>;
      const { message, duration, variant } = ce.detail || {};
      if (!message) return;
      push(message, { duration, variant });
    }
    window.addEventListener(EVT, onGlobalToast as EventListener);
    return () => window.removeEventListener(EVT, onGlobalToast as EventListener);
  }, [push]);

  const value = useMemo(() => ({ toasts, push, remove }), [toasts, push, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Bottom-right stack */}
      <div
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <ToastBubble key={t.id} item={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastBubble({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  // styles per variant  dark base with blue/green/red accents
  let border = "rgba(37,99,235,.45)"; // blue (info)
  let bg = "rgba(12,16,24,.96)";
  let role: "status" | "alert" = "status";
  let icon = "";

  if (item.variant === "success") {
    border = "rgba(34,197,94,.45)"; // green
    bg = "rgba(16,24,16,.96)";
    icon = "";
  } else if (item.variant === "error") {
    border = "rgba(185,28,28,.55)"; // red
    bg = "rgba(31,16,16,.96)";
    role = "alert";
    icon = " ";
  }

  return (
    <div
      role={role}
      className="pointer-events-auto rounded-xl border px-3 py-2 shadow"
      style={{
        borderColor: border,
        background: bg,
        color: "#E6F0F2",
        minWidth: 200,
        maxWidth: 360,
        boxShadow: "0 8px 20px rgba(0,0,0,.4)",
        cursor: "pointer",
      }}
      onClick={onClose}
      title="Dismiss"
    >
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <span aria-hidden style={{ lineHeight: 1 }}>
          {icon}
        </span>
        <div style={{ wordBreak: "break-word" }}>{item.message}</div>
      </div>
    </div>
  );
}

/* =========================================================
   Back-compat inline one-off component:
   <Toast message="Saved!" duration={3000} />
   ========================================================= */
export function Toast({ message, duration = 3000 }: { message: string; duration?: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), Math.max(1000, duration));
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 right-4 rounded-xl border px-4 py-2 shadow-lg"
      style={{
        background: "rgba(12,16,24,.96)",
        borderColor: "rgba(37,99,235,.45)", // blue outline to match theme
        color: "#FFFFFF",
      }}
    >
      {message}
    </div>
  );
}


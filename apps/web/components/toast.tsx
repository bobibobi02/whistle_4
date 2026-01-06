import { useCallback } from "react";
import type { ReactNode } from "react";

export type ToastVariant = "default" | "success" | "error" | "destructive";

export type ToastOptions = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
};

export function useToast() {
  const toast = useCallback((opts: ToastOptions) => {
    if (typeof window !== "undefined") {
      try {
        const parts = [opts.title, opts.description].filter(Boolean);
        if (parts.length) {
          // eslint-disable-next-line no-console
          console.debug("[toast]", parts.join(" — "));
        }
      } catch {
        // ignore
      }
    }
  }, []);

  return { toast };
}

// Stub Toaster component so imports like <Toaster /> don't break
export function Toaster(_props?: { children?: ReactNode }) {
  return null;
}

export type ToastProviderProps = {
  children?: ReactNode;
};

// Default ToastProvider used in _app.tsx
// For now it just renders children; toasts are logged via useToast (console debug in dev).
export default function ToastProvider({ children }: ToastProviderProps) {
  return <>{children}</>;
}
// components/UiIcons.tsx
import * as React from "react";

export function Heart({ filled = false, size = 18, className = "" }) {
  return filled ? (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <path d="M12 21s-6.7-4.06-9.16-7.23C.4 10.93 2.02 7.5 5.34 7.5c1.68 0 3.02.95 3.83 2.12.82-1.17 2.16-2.12 3.83-2.12 3.32 0 4.94 3.43 2.5 6.27C18.7 16.94 12 21 12 21z" fill="currentColor"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <path d="M19.5 7.5c-1.8-1.8-4.7-1.8-6.5 0l-1 1-1-1c-1.8-1.8-4.7-1.8-6.5 0-1.8 1.8-1.8 4.7 0 6.5C6.1 16.2 12 20 12 20s5.9-3.8 7.5-6c1.8-1.8 1.8-4.7 0-6.5Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function Comment({ size = 18, className = "" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-5a8 8 0 1 1 18-6Z"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

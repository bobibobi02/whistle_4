// src/lib/analytics/index.ts

/**
 * Client-side analytics tracker helper.
 *
 * Use `trackEvent(action, params)` to record events.
 * If `gtag` is available on `window`, it will fire a real GA event;
 * otherwise it logs to the console for debugging.
 */
export function trackEvent(
  action: string,
  params: Record<string, any> = {}
): void {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, params);
  } else {
    console.log(`Analytics event: ${action}`, params);
  }
}

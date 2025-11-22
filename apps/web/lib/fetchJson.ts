// apps/web/lib/fetchJson.ts

/**
 * Safe JSON helpers for our API calls.
 * - postJSON: returns {} on empty/non-JSON; throws with a clean message when !res.ok
 * - getJSON:  returns {} on empty/non-JSON; never throws on JSON parse
 */

function sanitizeError(status: number, ct: string, raw: string): string {
  if (ct.includes('application/json') && raw) {
    try {
      const j = JSON.parse(raw);
      if (j?.error && typeof j.error === 'string') return j.error;
    } catch {}
  }
  if (status === 401) return 'Please log in.';
  if (status === 429) return 'Too many requests. Please slow down.';
  if (status >= 500) return 'Server is busy. Try again.';
  return `HTTP ${status}`;
}

export async function postJSON<T = any>(
  url: string,
  body: any,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    body: JSON.stringify(body ?? {}),
    credentials: 'same-origin',
    ...init,
  });

  const ct = res.headers.get('content-type') || '';
  let raw = '';
  try {
    raw = await res.text();
  } catch {
    raw = '';
  }

  if (!res.ok) {
    throw new Error(sanitizeError(res.status, ct, raw));
  }

  if (!raw) return {} as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return {} as T;
  }
}

export async function getJSON<T = any>(
  url: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'same-origin',
    ...init,
  });

  let raw = '';
  try {
    raw = await res.text();
  } catch {
    raw = '';
  }

  if (!raw) return {} as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return {} as T;
  }
}

export default postJSON;

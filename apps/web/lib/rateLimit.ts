// lib/rateLimit.ts
// Lightweight, dev-friendly rate limiter with two layers:
// 1) Low-level token-bucket helpers: allow()/allowFromIP()  (kept for backward-compat)
// 2) High-level API helper: limitOrThrow(req, res, { key, limit, windowMs })
//
// - In-memory only (perfect for a single Next.js instance and local dev).
// - Adds standard rate-limit headers and a 429 JSON body on hit.
// - Can key by authenticated user (email) via attachSessionEmail().
//
// Usage in an API route:
//   const session = await getServerSession(req, res, authOptions as any);
//   attachSessionEmail(req, session?.user?.email);
//   if (await limitOrThrow(req, res, { key: 'comments:create', limit: 20, windowMs: 60_000 })) return;
//   ... continue your handler ...

import type { NextApiRequest, NextApiResponse } from 'next';

/* ------------------------------------------------------------------ */
/* Persistent store across hot-reloads                                 */
/* ------------------------------------------------------------------ */
type Bucket = { tokens: number; last: number; reset?: number };
type FixedBucket = { count: number; reset: number };

type Store = Map<string, Bucket>;
type FixedWindowStore = Map<string, FixedBucket>;

const g = global as any;
const tokenStore: Store = g.__rateLimitTokenStore || new Map<string, Bucket>();
const fixedStore: FixedWindowStore = g.__rateLimitFixedStore || new Map<string, FixedBucket>();
if (process.env.NODE_ENV !== 'production') {
  g.__rateLimitTokenStore = tokenStore;
  g.__rateLimitFixedStore = fixedStore;
}

/* ------------------------------------------------------------------ */
/* Token-bucket (backward compatible with your previous API)           */
/* ------------------------------------------------------------------ */
type TokenOpts = { max?: number; intervalMs?: number };

/**
 * Token-bucket allowing up to `max` actions per `intervalMs`.
 * Returns true if allowed, false if limited.
 */
export function allow(key: string, opts: TokenOpts = {}): boolean {
  const max = Math.max(1, opts.max ?? 10);
  const interval = Math.max(500, opts.intervalMs ?? 60_000);

  const now = Date.now();
  const b = tokenStore.get(key) ?? { tokens: max, last: now };
  const elapsed = Math.max(0, now - b.last);

  // Refill: linear refill toward max over the interval
  const refill = (elapsed / interval) * max;
  b.tokens = Math.min(max, b.tokens + refill);
  b.last = now;

  if (b.tokens < 1) {
    tokenStore.set(key, b);
    return false;
  }
  b.tokens -= 1;
  tokenStore.set(key, b);
  return true;
}

/** Convenience wrapper to use an IP as the key. */
export function allowFromIP(ip: string, opts?: TokenOpts): boolean {
  const key = `ip:${(ip || 'unknown').trim()}`;
  return allow(key, opts);
}

/* ------------------------------------------------------------------ */
/* High-level helpers for Next.js API routes                           */
/* ------------------------------------------------------------------ */
export type RateRule = {
  key: string;       // logical key for this endpoint/group, e.g., 'comments:create'
  limit: number;     // max hits per window
  windowMs: number;  // window duration in ms
};

/** Attach the authenticated email so we can key by user instead of IP. */
export function attachSessionEmail(req: NextApiRequest, email?: string | null) {
  (req as any).__sessionEmail = (email || '').trim() || undefined;
}

/** Identify the caller (prefer user, fallback to IP). */
function getClientIdentity(req: NextApiRequest): string {
  try {
    const email = (req as any).__sessionEmail as string | undefined;
    if (email) return `user:${email}`;

    const xf = (req.headers['x-forwarded-for'] as string) || '';
    const ip = xf.split(',')[0].trim() || (req.socket?.remoteAddress ?? 'unknown');
    return `ip:${ip}`;
  } catch {
    return 'ip:unknown';
  }
}

/** Fixed-window hit: returns { ok, remaining, reset } and stores counters. */
function hitFixedWindow(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = fixedStore.get(key);

  if (!bucket || bucket.reset <= now) {
    const next: FixedBucket = { count: 1, reset: now + windowMs };
    fixedStore.set(key, next);
    return { ok: true, remaining: limit - 1, reset: next.reset };
    }
  if (bucket.count < limit) {
    bucket.count++;
    return { ok: true, remaining: limit - bucket.count, reset: bucket.reset };
  }
  return { ok: false, remaining: 0, reset: bucket.reset };
}

/**
 * Call at the top of an API route AFTER attachSessionEmail().
 * Returns true if it already responded with 429 (so you should `return`).
 * Otherwise returns false and you may continue handling the request.
 */
export async function limitOrThrow(
  req: NextApiRequest,
  res: NextApiResponse,
  rule: RateRule
): Promise<boolean> {
  const id = getClientIdentity(req);
  const key = `${rule.key}:${id}`;
  const { ok, remaining, reset } = hitFixedWindow(key, rule.limit, rule.windowMs);

  // Set standard-ish headers
  res.setHeader('X-RateLimit-Limit', String(rule.limit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, remaining)));
  res.setHeader('X-RateLimit-Reset', String(Math.floor(reset / 1000))); // epoch seconds
  if (!ok) {
    const retryAfterSec = Math.max(1, Math.floor((reset - Date.now()) / 1000));
    res.setHeader('Retry-After', String(retryAfterSec));
    res.status(429).json({
      ok: false,
      error: 'Too Many Requests',
      retryAfterSeconds: retryAfterSec,
    });
    return true; // already handled
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* (Optional) tiny helpers if you prefer explicit keys per request     */
/* ------------------------------------------------------------------ */

/** Build a composite key if you prefer more granularity (e.g., per-post). */
export function makeKey(ruleKey: string, req: NextApiRequest, extra?: string) {
  const id = getClientIdentity(req);
  return extra ? `${ruleKey}:${id}:${extra}` : `${ruleKey}:${id}`;
}

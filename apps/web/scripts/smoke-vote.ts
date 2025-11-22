// apps/web/scripts/smoke-vote.ts
//
// End-to-end vote flow against your running Next dev server.
// Requires you to be logged in; provide your browser cookie via COOKIE env var.
//
// PowerShell example:
//   $env:BASE_URL="http://localhost:3000"
//   $env:TEST_POST_ID="<<REAL-POST-ID>>"
//   $env:COOKIE="next-auth.session-token=<<REAL_TOKEN>>"
//   npx tsx scripts/smoke-vote.ts
//
// cmd.exe example:
//   set BASE_URL=http://localhost:3000 && set TEST_POST_ID=<<REAL-POST-ID>> && set COOKIE=next-auth.session-token=<<REAL_TOKEN>> && npx tsx scripts/smoke-vote.ts
//
// How to get the token: in your app (while logged in), open DevTools Р Р†РІ РІв„ў Application/Storage Р Р†РІ РІв„ў Cookies,
// copy the *entire* value for `next-auth.session-token`. If you also have `next-auth.csrf-token`, you can
// include it too, but the session token is the key.
//
// If you see "Invalid Compact JWE" in your server logs, the cookie is invalid (placeholder or expired).

import { postJSON, getJSON } from '../lib/fetchJson';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const COOKIE = process.env.COOKIE || '';
const POST_ID = process.env.TEST_POST_ID || '';

if (!POST_ID || POST_ID === 'PUT-YOUR-POST-ID-HERE' || POST_ID.length < 8) {
  console.error('Р Р†РЎСљР Р‰ TEST_POST_ID must be set to a REAL post id from your app (copy it from the post URL).');
  process.exit(1);
}
if (!COOKIE || /PASTE_TOKEN_HERE/i.test(COOKIE)) {
  console.error('Р Р†РЎСљР Р‰ COOKIE must contain a REAL next-auth session cookie, e.g.:');
  console.error('   COOKIE="next-auth.session-token=eyJhbGciOi..."');
  console.error('   (Copy from DevTools Р Р†РІ РІв„ў Application Р Р†РІ РІв„ў Cookies while logged in.)');
  process.exit(1);
}

async function assert(name: string, fn: () => Promise<any>) {
  try {
    await fn();
    console.log(`Р Р†РЎС™РІВ¦ ${name}`);
  } catch (e: any) {
    console.error(`Р Р†РЎСљР Р‰ ${name}`);
    console.error(e?.stack || e?.message || e);
    process.exitCode = 1;
  }
}

function withCookie(init?: RequestInit): RequestInit {
  return { ...(init || {}), headers: { ...(init?.headers || {}), Cookie: COOKIE } };
}

async function vote(postId: string, value: -1 | 0 | 1) {
  return await postJSON<{ ok?: boolean; up?: number; down?: number }>(
    `${BASE}/api/vote`,
    { postId, value },
    withCookie()
  );
}

async function stats(postId: string) {
  // Try the POST JSON shape first (most implementations)
  try {
    return await postJSON<Record<string, { up: number; down: number }>>(
      `${BASE}/api/vote/stats`,
      { ids: [postId] },
      withCookie()
    );
  } catch (e: any) {
    // If the server requires query-string ids instead of body, fall back to GET
    const msg = String(e?.message || '');
    if (/ids required/i.test(msg) || /400/.test(msg)) {
      const qs = `${BASE}/api/vote/stats?ids=${encodeURIComponent(postId)}`;
      const data = await getJSON<Record<string, { up: number; down: number }>>(qs, withCookie());
      if (!data || typeof data !== 'object') throw new Error('stats GET returned non-object');
      return data;
    }
    throw e;
  }
}

async function main() {
  await assert('stats returns JSON', async () => {
    const s = await stats(POST_ID);
    if (!s || typeof s !== 'object') throw new Error('stats not object');
  });

  await assert('upvote returns numeric counts', async () => {
    const r = await vote(POST_ID, 1);
    if (typeof r?.up !== 'number' || typeof r?.down !== 'number') throw new Error('counts not numeric');
  });

  await assert('toggle off (neutral) returns numeric counts', async () => {
    const r = await vote(POST_ID, 0);
    if (typeof r?.up !== 'number' || typeof r?.down !== 'number') throw new Error('counts not numeric');
  });

  await assert('downvote returns numeric counts', async () => {
    const r = await vote(POST_ID, -1);
    if (typeof r?.up !== 'number' || typeof r?.down !== 'number') throw new Error('counts not numeric');
  });

  await assert('toggle off (neutral) again returns numeric counts', async () => {
    const r = await vote(POST_ID, 0);
    if (typeof r?.up !== 'number' || typeof r?.down !== 'number') throw new Error('counts not numeric');
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

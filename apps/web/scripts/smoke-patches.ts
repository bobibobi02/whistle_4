// apps/web/scripts/smoke-patches.ts
//
// Purpose: prove that our client JSON helpers don't blow up on empty API bodies.
// Run:  npx tsx scripts/smoke-patches.ts

import { postJSON } from '../lib/fetchJson';

async function assert(name: string, fn: () => Promise<any>) {
  try {
    await fn();
    console.log(`РІСљ¦ ${name}`);
  } catch (e: any) {
    console.error(`РІСњРЉ ${name}`);
    console.error(e?.stack || e?.message || e);
    process.exitCode = 1;
  }
}

async function main() {
  const orig = globalThis.fetch!;

  // Intercept /api/* and respond with an EMPTY body to simulate the old failure mode
  // @ts-ignore
  globalThis.fetch = async (input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const isApi = /^\/api\//.test(url) || /^https?:\/\/[^/]+\/api\//i.test(url);
    if (isApi) {
      return new Response('', { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return orig(input, init);
  };

  await assert('postJSON survives empty /api body (returns {})', async () => {
    const r = await postJSON('/api/anything', { hello: 'world' });
    if (!r || typeof r !== 'object') throw new Error('not object');
  });

  // Restore
  // @ts-ignore
  globalThis.fetch = orig;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

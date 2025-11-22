const fs = require("fs");
const path = require("path");

function edit(file, mutate) {
  if (!fs.existsSync(file)) return console.log("skip:", file);
  const src = fs.readFileSync(file, "utf8");
  const out = mutate(src);
  if (out !== src) { fs.writeFileSync(file, out, "utf8"); console.log("fixed:", file); }
  else { console.log("nochange:", file); }
}

/** 1) Make useInfinitePosts accept BOTH styles:
 *    - useInfinitePosts(fetchPageFn)
 *    - useInfinitePosts({ fetchPage: fetchPageFn })  (or { pageFetcher: ... })
 */
edit("apps/web/src/hooks/useInfinitePosts.ts", s => {
  if (/function\s+useInfinitePosts\(/.test(s) && !/pageFetcher/i.test(s)) {
    // Very safe shim: wrap the exported hook to normalize arg shape
    s = s.replace(
      /export\s+function\s+useInfinitePosts\s*\(([^)]*)\)\s*\{/,
      (m, args) => {
        const norm =
`export type UseInfinitePostsOptions = {
  fetchPage: (cursor: string) => Promise<{ items: any[]; nextCursor: any }>;
};
export function useInfinitePosts(optsOrFn: any) {
  const fetchPage = typeof optsOrFn === 'function'
    ? optsOrFn
    : (optsOrFn?.fetchPage ?? optsOrFn?.pageFetcher);
  if (typeof fetchPage !== 'function') {
    throw new Error('useInfinitePosts: please pass a function or { fetchPage }');
  }
  // __SHIM_START__ pass through to original impl by binding fetchPage to expected param list
  const __fetchPage = fetchPage;
  `
        return norm;
      }
    );
    // Close the shim if not already closed
    if (!/__SHIM_END__/.test(s)) {
      s = s.replace(/\n\}\s*$/m, `\n  // __SHIM_END__\n}\n`);
    }
    return s;
  }
  return s;
});

/** 2) Normalize calls in feed pages to ANY style (both now work).
 *    (No-op if already object or function - hook now supports both.)
 */
for (const p of ["apps/web/pages/feed.tsx","apps/web/pages/feed.backup.tsx"]) {
  edit(p, s => s); // nothing required now; compatibility is in the hook
}

/** 3) PostCard.tsx: ensure copyToClipboard helper exists and replace guarded ternary invocation */
edit("apps/web/src/components/post-card/PostCard.tsx", s => {
  // Insert helper if missing (right after imports)
  if (!/function\s+copyToClipboard\(/.test(s)) {
    s = s.replace(/(^\s*import[^\n]*\n)+/m, m => m + 
`function copyToClipboard(text: string){
  if (typeof navigator !== 'undefined' && (navigator as any).clipboard?.writeText) {
    return (navigator as any).clipboard.writeText(text);
  }
  try {
    const ta = document.createElement('textarea'); ta.value = text;
    ta.style.position = 'fixed'; ta.style.left = '-9999px'; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    return Promise.resolve();
  } catch { return Promise.reject(); }
}
`);
  }
  // Replace any form of navigator.clipboard call (plain or guarded ternary with a trailing call)
  s = s.replace(/navigator\.clipboard\.writeText\(([^)]*)\)/g, "copyToClipboard($1)");
  s = s.replace(/\(typeof[\s\S]*?navigator[\s\S]*?clipboard[\s\S]*?\?[\s\S]*?:[\s\S]*?\)\s*\(([^)]*)\)/g, "copyToClipboard($1)");
  return s;
});

console.log("✓ patches done");

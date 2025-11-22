const fs = require("fs");

function edit(file, mutate) {
  if (!fs.existsSync(file)) return console.log("skip:", file);
  const src = fs.readFileSync(file, "utf8");
  const out = mutate(src);
  if (out !== src) { fs.writeFileSync(file, out, "utf8"); console.log("fixed:", file); }
  else { console.log("nochange:", file); }
}

/* 1) useInfinitePosts signature: revert to positional function */
for (const p of ["apps/web/pages/feed.tsx","apps/web/pages/feed.backup.tsx"]) {
  edit(p, s =>
    s.replace(/useInfinitePosts\(\s*\{\s*fetchPage\s*:\s*fetchFeedPage\s*\}\s*\)/g,
              "useInfinitePosts(fetchFeedPage)")
  );
}

/* 2) PostCard.tsx: replace any leftover navigator.clipboard call with helper */
edit("apps/web/src/components/post-card/PostCard.tsx", s => {
  // ensure helper exists (we injected earlier, but harmless to re-insert once)
  if (!/function\s+copyToClipboard\(/.test(s)) {
    s = s.replace(/(^\s*import[^\n]*\n)+/m, m => m +
`function copyToClipboard(text: string){
  if (typeof navigator !== 'undefined' && (navigator as any).clipboard?.writeText) {
    return (navigator as any).clipboard.writeText(text);
  }
  try {
    const ta = document.createElement('textarea'); ta.value = text;
    ta.style.position='fixed'; ta.style.left='-9999px'; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    return Promise.resolve();
  } catch { return Promise.reject(); }
}
`);
  }
  // replace any navigator.clipboard.writeText(...) occurrences
  s = s.replace(/navigator\.clipboard\.writeText\(([^)]*)\)/g, "copyToClipboard($1)");
  // also replace the long guarded form if it slipped back in
  s = s.replace(/\(typeof\s+navigator[^)]*?\)\(([^)]*)\)/g, "copyToClipboard($1)");
  return s;
});

console.log("✓ quick fixes applied");

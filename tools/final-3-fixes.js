const fs = require("fs");

function edit(file, mutate) {
  if (!fs.existsSync(file)) return console.log("skip:", file);
  const src = fs.readFileSync(file, "utf8");
  const out = mutate(src);
  if (out !== src) { fs.writeFileSync(file, out, "utf8"); console.log("fixed:", file); }
  else { console.log("nochange:", file); }
}

/* 1) useInfinitePosts: the hook expects an options object, not a function */
for (const p of ["apps/web/pages/feed.tsx","apps/web/pages/feed.backup.tsx"]) {
  edit(p, s => s.replace(
    /useInfinitePosts\(\s*fetchFeedPage\s*\)/g,
    "useInfinitePosts({ fetchPage: fetchFeedPage })"
  ));
}

/* 2) PostCard: replace any guarded navigator.clipboard call with copyToClipboard(...) */
edit("apps/web/src/components/post-card/PostCard.tsx", s => {
  // ensure helper exists
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
  // replace plain navigator.clipboard calls
  s = s.replace(/navigator\.clipboard\.writeText\(([^)]*)\)/g, "copyToClipboard($1)");
  // replace the long guarded ternary form
  s = s.replace(/\(typeof\s+navigator[^)]*clipboard[^)]*\)\(([^)]*)\)/g, "copyToClipboard($1)");
  return s;
});

console.log("✓ final 3 fixes applied");

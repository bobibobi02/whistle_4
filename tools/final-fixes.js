const fs = require("fs");
const path = require("path");

function edit(file, mutate) {
  if (!fs.existsSync(file)) return console.log("skip:", file);
  const src = fs.readFileSync(file, "utf8");
  const out = mutate(src);
  if (out !== src) { fs.writeFileSync(file, out, "utf8"); console.log("fixed:", file); }
  else { console.log("nochange:", file); }
}

/* A) pages/api/comments/[id].ts: drop include.votes everywhere */
edit("apps/web/pages/api/comments/[id].ts", s => s.replace(/\bvotes\s*:\s*true\s*,?\s*/g, "") );

/* B) Feed pages: remove RawPost, and call useInfinitePosts with options { fetchPage } */
for (const p of ["apps/web/pages/feed.tsx", "apps/web/pages/feed.backup.tsx"]) {
  edit(p, s => {
    let t = s;
    // Kill RawPost mentions
    t = t.replace(/\s*,\s*type\s+Post\s+as\s+RawPost\s*/g, "");
    t = t.replace(/as\s+unknown\s+as\s+RawPost\[\]/g, "as unknown as any[]");

    // Ensure useInfinitePosts({ fetchPage: fetchFeedPage })
    t = t.replace(
      /useInfinitePosts\(\s*fetchFeedPage\s*\)/g,
      "useInfinitePosts({ fetchPage: fetchFeedPage })"
    ).replace(
      /useInfinitePosts\(\s*{[^}]*fetchPage[^}]*}\s*\)/g,
      "useInfinitePosts({ fetchPage: fetchFeedPage })"
    );

    return t;
  });
}

/* C) popular.tsx & sub/[name].tsx: inject adaptToPostCardProps helper and use it */
for (const p of ["apps/web/pages/popular.tsx","apps/web/pages/sub/[name].tsx"]) {
  edit(p, s => {
    let t = s;
    if (!/function\s+adaptToPostCardProps\(/.test(t)) {
      // insert helper right after first import block
      t = t.replace(/(^\s*import[^\n]*\n)+(?!\s*function\s+adapt)/m, m => m +
`function adaptToPostCardProps(p:any){
  return {
    postId: p.id,
    user: p.user ?? { name: (p.userEmail||"user").split("@")[0] },
    timestamp: p.createdAt ?? new Date().toISOString(),
    ...p,
  };
}
`);
    }
    t = t.replace(/<PostCard\s+key=\{p\.id\}\s+\{\.\.\.p\}\s*\/>/g, `<PostCard key={p.id} {...adaptToPostCardProps(p)} />`);
    return t;
  });
}

/* D) r/[subforum].tsx: content -> body */
edit("apps/web/pages/r/[subforum].tsx", s => s.replace(/\bcontent:\s*p\.content\b/g, "content: (p.body ?? '')"));

/* E) CommentSection.tsx: remove dependency on a missing 'content' variable.
      Replace 'body: content' and JSON payloads with a DOM read fallback. */
edit("apps/web/src/components/CommentSection.tsx", s => {
  let t = s;
  const expr = `(typeof window!=='undefined'?((document.getElementById('comment-input') as HTMLTextAreaElement|null)?.value ?? ''):'')`;
  t = t.replace(/body:\s*content/g, `body: ${expr}`);
  t = t.replace(/JSON\.stringify\(\{\s*id\s*,\s*body:\s*content\s*\}\)/g, `JSON.stringify({ id, body: ${expr} })`);
  return t;
});

/* F) PostCard clipboard: add safe helper and replace usage */
edit("apps/web/src/components/post-card/PostCard.tsx", s => {
  let t = s;
  if (!/function\s+copyToClipboard\(/.test(t)) {
    // insert helper after imports
    t = t.replace(/(^\s*import[^\n]*\n)+/m, m => m +
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
  t = t.replace(/navigator\.clipboard\.writeText\([^)]*\)/g, m => m.replace(/navigator\.clipboard\.writeText\(([^)]*)\)/, "copyToClipboard($1)"));
  return t;
});

console.log("✔ patches applied");

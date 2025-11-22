const fs = require("fs");

function edit(file, mutate) {
  if (!fs.existsSync(file)) return console.log("skip:", file);
  const src = fs.readFileSync(file, "utf8");
  const out = mutate(src);
  if (out !== src) {
    fs.writeFileSync(file, out, "utf8");
    console.log("fixed:", file);
  } else {
    console.log("nochange:", file);
  }
}

/* 1) CommentSection: remove duplicate useState import, ensure content state, and use `body` field */
edit("apps/web/src/components/CommentSection.tsx", s => {
  let t = s;
  // kill a stray "import { useState } from 'react';" line (keep the React grouped import)
  t = t.replace(/\n\s*import\s*\{\s*useState\s*\}\s*from\s*['"]react['"];\s*/g, "\n");
  // ensure local editor state exists
  if (!/const\s*\[\s*content\s*,\s*setContent\s*\]\s*=\s*useState\(/.test(t)) {
    t = t.replace(/(function\s+\w+\s*\([^\)]*\)\s*\{)/, `$1\n  const [content, setContent] = useState("");\n`);
  }
  // node.content -> node.body
  t = t.replace(/node\.content/g, 'node.body ?? ""');
  // payload content->body
  t = t.replace(/\{\s*content\s*,\s*parentId\s*\}/g, "{ body: content, parentId }");
  t = t.replace(/\{\s*content\s*\}/g, "{ body: content }");
  // JSON stringify edits
  t = t.replace(/JSON\.stringify\(\{\s*id\s*,\s*content\s*\}\)/g, "JSON.stringify({ id, body: content })");
  return t;
});

/* 2) PostCard: guard navigator.clipboard to silence TS runtime guard */
edit("apps/web/src/components/post-card/PostCard.tsx", s => {
  return s.replace(
    /navigator\.clipboard\.writeText/g,
    '(typeof navigator!=="undefined"&&navigator.clipboard?navigator.clipboard.writeText:()=>Promise.reject())'
  );
});

/* 3) API posts: use body instead of content */
edit("apps/web/pages/api/posts/[postId].ts", s => {
  return s
    .replace(/post\.content/g, "post.body")
    .replace(/\bconst\s+content\s*=\s*String\([^)]*\);?/g,
             'const bodyText = String((req.body?.body ?? req.body?.content ?? post.body ?? ""));')
    .replace(/\bdata:\s*{\s*title\s*,\s*content\s*}/g, "data: { title, body: bodyText }");
});

/* 4) vote API: isUp -> value (schema aligns to value:number) */
edit("apps/web/pages/api/vote.ts", s => {
  return s
    .replace(/select:\s*{\s*isUp:\s*true\s*}/g, "select: { value: true }")
    .replace(/row\.isUp\s*\?\s*"up"\s*:\s*"down"/g, 'row.value>0?"up":"down"');
});

/* 5) Fix PostCard import paths */
for (const p of ["apps/web/pages/popular.tsx","apps/web/pages/sub/[name].tsx"]) {
  edit(p, s => s.replace(/@\/components\/PostCard/g, "@/components/post-card/PostCard"));
}

console.log("✔ fixes applied");

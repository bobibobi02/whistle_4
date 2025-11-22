const fs = require("fs");
const path = require("path");

function edit(file, mutate) {
  if (!fs.existsSync(file)) return console.log("skip (missing):", file);
  const orig = fs.readFileSync(file, "utf8");
  const next = mutate(orig);
  if (next !== orig) {
    fs.writeFileSync(file, next, "utf8");
    console.log("fixed:", file);
  } else {
    console.log("nochange:", file);
  }
}

/* ==== API fixes ==== */
edit("apps/web/pages/api/posts/[postId].ts", s => {
  return s
    .replace(/post\.content/g, "post.body")
    .replace(/\bconst\s+content\s*=\s*String\([^)]*\);?/g, 'const bodyText = String((req.body?.body ?? req.body?.content ?? post.body ?? ""));')
    .replace(/\bdata:\s*{\s*title\s*,\s*content\s*}/g, "data: { title, body: bodyText }");
});

edit("apps/web/pages/api/vote.ts", s => {
  return s
    .replace(/select:\s*{\s*isUp:\s*true\s*}/g, "select: { value: true }")
    .replace(/row\.isUp\s*\?\s*"up"\s*:\s*"down"/g, 'row.value > 0 ? "up" : "down"');
});

edit("apps/web/pages/api/comments/[id].ts", s => {
  return s.replace(/include:\s*{([\s\S]*?)}/m, (m, inner) => {
    const cleaned = inner
      .replace(/^\s*votes:\s*true,\s*$/m, "")
      .replace(/^\s*votes:\s*true\s*$/m, "");
    return `include: {${cleaned}}`;
  });
});

/* ==== UI import/path fixes ==== */
edit("apps/web/pages/popular.tsx", s => s.replace(/'@\/components\/PostCard'/g, "'@/components/post-card/PostCard'"));
edit("apps/web/pages/sub/[name].tsx", s => s.replace(/'@\/components\/PostCard'/g, "'@/components/post-card/PostCard'"));

/* ==== CommentSection: content -> body, and fix edit/display ==== */
edit("apps/web/src/components/CommentSection.tsx", s => {
  let t = s;

  // display/edit fields from node.content -> node.body
  t = t.replace(/node\.content/g, "node.body ?? \"\"");

  // API payload keys content->body
  t = t.replace(/\{\s*content\s*,\s*parentId\s*\}/g, "{ body: content, parentId }");
  t = t.replace(/\{\s*content\s*\}/g, "{ body: content }");

  // fetch bodies: JSON.stringify({ id, content }) -> body
  t = t.replace(/JSON\.stringify\(\{\s*id\s*,\s*content\s*\}\)/g, "JSON.stringify({ id, body: content })");

  // If there is no local 'content' variable defined, create a simple one from a textarea/ref pattern.
  if (!/const\s+content\s*=/.test(t)) {
    // insert after first react imports
    t = t.replace(
      /(^\s*import[^\n]*\n)+/m,
      (m) => m + `\n// Fallback editor state for body text\nimport { useState } from "react";\n`
    );
    // add a minimal local state only if no obvious editor state is present
    if (!/useState\([^)]*\)/.test(t)) {
      t = t.replace(/function\s+\w+\s*\(/, m => `${m}\n  const [content, setContent] = useState("");\n`);
    }
  }

  return t;
});

/* ==== Post page: remove unstable key= on media wrappers to stop flash ==== */
edit("apps/web/pages/post/[postId].tsx", s => {
  return s
    .replace(/(<(div|figure|section)\b[^>]*)(\s+key=\{[^}]+\})/g, "$1") // drop key={}
    .replace(/className=\{?`?post-media[^`'"]*`?\}?/g, 'className="post-media"'); // stabilize class
});

/* ==== Feed hook call shape (quiet some TS errors) ==== */
for (const p of ["apps/web/pages/feed.tsx", "apps/web/pages/feed.backup.tsx"]) {
  edit(p, s => {
    return s
      .replace(
        /const\s*\{\s*posts\s*,\s*hasMore\s*,\s*loading\s*,\s*cursor\s*,\s*loadMore\s*,\s*reset\s*,\s*setPosts\s*\}\s*=\s*useInfinitePosts\([^)]*\);/m,
        "const { items, loading, ended, cursor, loadMore, reset, setSentinel } = useInfinitePosts({ fetchPage: fetchFeedPage });"
      )
      .replace(/\(posts as unknown as [^)]+\)\.map\(/g, "items.map(")
      .replace(/loadMore\(\s*true\s*\)/g, "loadMore()");
  });
}

console.log("All done.");

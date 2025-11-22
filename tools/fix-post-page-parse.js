const fs = require("fs");
const path = "apps/web/pages/post/[postId].tsx";
if (!fs.existsSync(path)) { console.log("skip (missing):", path); process.exit(0); }
let s = fs.readFileSync(path, "utf8");
const orig = s;

/* 1) Normalize the composer textarea (id="comment-input") */
s = s.replace(
  /<textarea[^>]*id=["']comment-input["'][^>]*\/>.*$/m,
  `<textarea
          id="comment-input"
          className="whp whp-editor"
          value={composer}
          onChange={(e) => setComposer(e.target.value)}
          placeholder="Write a comment..."
          rows={3}
        />`
);

/* 2) Normalize the editValue textarea (value={editValue}) */
s = s.replace(
  /<textarea[^>]*value=\{editValue\}[^>]*\/>.*$/m,
  `<textarea
                className="whp whp-editor"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={3}
              />`
);

/* 3) Remove any leftover tail text after a self-closing textarea before next tag/newline */
s = s.replace(/(<textarea[\s\S]*?\/>)[^\n<]+(?=\n|<)/g, "$1");

/* 4) Ensure onConfirm is properly closed */
const fnStart = s.indexOf("const onConfirm = () => {");
if (fnStart !== -1) {
  // Find if a proper close `};` exists after start
  const after = s.slice(fnStart);
  const hasClose = /}\s*;/.test(after);
  if (!hasClose) {
    // Heuristic: insert before the next obvious section boundary
    // Look for 'return (' of the component or the next hook/const/function or a big section comment
    const boundaryRe = /(?:\n\s*return\s*\(|\n\s*const\s+|\n\s*function\s+|\n\s*useEffect\s*\(|\n\s*\/\*\s*={2,}|\n\s*export\s+default)/g;
    boundaryRe.lastIndex = fnStart + 1;
    const m = boundaryRe.exec(s);
    const insertAt = m ? m.index : s.length;
    s = s.slice(0, insertAt) + "\n};\n" + s.slice(insertAt);
  }
}

/* 5) Final tiny cleanup: collapse accidental "rows={3} /> rows={3} />" */
s = s.replace(/rows=\{3\}\s*\/>\s*rows=\{3\}\s*\/>/g, "rows={3} />");

if (s !== orig) {
  fs.writeFileSync(path, s, "utf8");
  console.log("post page patched:", path);
} else {
  console.log("nochange:", path);
}

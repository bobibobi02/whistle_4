const fs = require("fs");
const file = "apps/web/pages/post/[postId].tsx";
if (!fs.existsSync(file)) {
  console.log("skip (missing):", file);
  process.exit(0);
}
let s = fs.readFileSync(file, "utf8");

// Collapse duplicated self-closing textareas like
//   <textarea ... /> setComposer(e.target.value)} placeholder="..." rows={3} /> setComposer(...) ...
const fixDup = (src, stateName) => {
  // Remove any " /> setState(...)" fragments that follow a self-closing textarea
  const re = new RegExp(String.raw`(\<textarea[^>]*\/\>)[^<]*${stateName}\s*\([^)]*\)[^<]*`, "g");
  return src.replace(re, "$1");
};

s = fixDup(s, "setComposer");
s = fixDup(s, "setEditValue");

// As a safety, remove any repeated "rows={3} /> rows={3} />" echoes
s = s.replace(/rows=\{3\}\s*\/>\s*rows=\{3\}\s*\/>/g, "rows={3} />");

// Extra guard: if a stray line duplicated the whole tail after a textarea, trim it
s = s.replace(/(\<textarea[^>]*\/\>)[^\n<]+(?=\n|\r)/g, "$1");

// Optional: normalize accidental unicode ellipsis/quotes that might have been duplicated
s = s.replace(/[…]/g, "...");

fs.writeFileSync(file, s, "utf8");
console.log("fixed duplicates in", file);

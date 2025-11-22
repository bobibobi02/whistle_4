const fs = require("fs");
const file = "apps/web/pages/post/[postId].tsx";
if (!fs.existsSync(file)) { console.log("skip (missing):", file); process.exit(0); }
let s = fs.readFileSync(file, "utf8");

// Normalize per line: if a line has <textarea .../> and also setComposer( or setEditValue(,
// replace the line with only the first <textarea .../>
const lines = s.split(/\r?\n/).map(line => {
  if (line.includes("<textarea") && (line.includes("setComposer(") || line.includes("setEditValue("))) {
    const idx = line.indexOf("/>");
    if (idx !== -1) return line.slice(0, idx + 2);  // keep just the textarea
  }
  return line;
});
s = lines.join("\n");

// Extra safety: if any leftover tail after a self-closing textarea before next tag/newline, drop it
s = s.replace(/(<textarea[\s\S]*?\/>)[^\n<]+(?=\n|<)/g, "$1");

fs.writeFileSync(file, s, "utf8");
console.log("normalized textareas in", file);

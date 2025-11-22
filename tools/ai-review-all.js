/**
 * AI Review All
 *
 * Scans the repo for TS/TSX files and runs the per-file AI review loop.
 *
 * Usage:
 *   npm run ai:review:all
 *
 * Notes:
 * - Uses tools/ai-review-loop.js for each file.
 * - Never modifies files. Only prints patches / messages.
 * - Skips heavy/irrelevant dirs (node_modules, .next, dist, build, coverage, .turbo, etc).
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = process.cwd();
const REVIEW_SCRIPT = path.join(ROOT, "tools", "ai-review-loop.js");

// Directories you actually care about. Adjust if needed.
const INCLUDE_DIRS = [
  "apps/web",
  "packages",
  "src",
  "lib"
];

// Always skip these.
const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "coverage",
  ".turbo",
  ".cache",
  ".storybook"
]);

function isTsLike(file) {
  return (
    file.endsWith(".ts") ||
    file.endsWith(".tsx")
  );
}

function collectFiles(startDir) {
  const absStart = path.join(ROOT, startDir);
  const results = [];

  if (!fs.existsSync(absStart)) return results;

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIR_NAMES.has(entry.name)) {
          walk(full);
        }
      } else if (entry.isFile()) {
        if (isTsLike(entry.name)) {
          results.push(full);
        }
      }
    }
  }

  walk(absStart);
  return results;
}

function runReviewOnFile(absPath) {
  const rel = path.relative(ROOT, absPath);
  console.log(`\n============================================================`);
  console.log(`[AI REVIEW] ${rel}`);
  console.log(`============================================================\n`);

  const result = spawnSync(
    process.execPath, // "node"
    [REVIEW_SCRIPT, rel],
    {
      stdio: "inherit",
      env: process.env,
    }
  );

  // If the loop returns non-zero, log and continue; don't kill the whole run.
  if (result.status !== 0) {
    console.warn(
      `[ai-review-all] Warning: review script exited with code ${result.status} for ${rel}`
    );
  }
}

function main() {
  if (!fs.existsSync(REVIEW_SCRIPT)) {
    console.error("[ai-review-all] Missing tools/ai-review-loop.js");
    process.exit(1);
  }

  let allFiles = [];
  for (const dir of INCLUDE_DIRS) {
    allFiles = allFiles.concat(collectFiles(dir));
  }

  if (allFiles.length === 0) {
    console.error("[ai-review-all] No TS/TSX files found in configured dirs.");
    process.exit(1);
  }

  console.log(`[ai-review-all] Found ${allFiles.length} files to review.\n`);

  for (const file of allFiles) {
    runReviewOnFile(file);
  }

  console.log("\n[ai-review-all] Done. Review output is above for each file.");
}

main();

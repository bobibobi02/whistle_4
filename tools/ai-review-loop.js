#!/usr/bin/env node
/**
 * AI Review Loop (OpenAI + DeepSeek, with graceful fallback)
 *
 * Usage:
 *   npm run ai:review -- apps/web/src/components/CommentSection.tsx
 *
 * Behavior:
 *   - Try OpenAI for initial patch.
 *   - If OpenAI missing/over-quota, fall back to DeepSeek.
 *   - Use DeepSeek to review.
 *   - Reconcile into final patch (OpenAI if available, else DeepSeek).
 *
 * Never writes files. Only prints patches to stdout.
 */

const fs = require("fs");
const path = require("path");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_API_URL =
  process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1/chat/completions";

if (!DEEPSEEK_API_KEY && !OPENAI_API_KEY) {
  console.error("[ai-review-loop] Need at least one of OPENAI_API_KEY or DEEPSEEK_API_KEY.");
  process.exit(1);
}

async function safeFetch(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  return { ok: res.ok, status: res.status, bodyText: text, json };
}

async function callOpenAI(messages, model = "gpt-4.1-mini") {
  if (!OPENAI_API_KEY) throw new Error("NO_OPENAI_KEY");

  const { ok, status, bodyText, json } = await safeFetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, temperature: 0.15 }),
    }
  );

  if (!ok) {
    const code = json?.error?.code || "";
    if (status === 401 || status === 429 || code === "insufficient_quota") {
      throw new Error("OPENAI_UNAVAILABLE");
    }
    throw new Error(`OpenAI error ${status}: ${bodyText}`);
  }

  return (json.choices?.[0]?.message?.content || "").trim();
}

async function callDeepSeek(messages, model = "deepseek-chat") {
  if (!DEEPSEEK_API_KEY) throw new Error("NO_DEEPSEEK_KEY");

  const { ok, status, bodyText, json } = await safeFetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, temperature: 0.15 }),
  });

  if (!ok) {
    throw new Error(`DeepSeek error ${status}: ${bodyText}`);
  }

  return (json.choices?.[0]?.message?.content || "").trim();
}

async function main() {
  const targetPath = process.argv[2];
  if (!targetPath) {
    console.error("Usage: npm run ai:review -- <relative-file-path>");
    process.exit(1);
  }

  const abs = path.resolve(targetPath);
  if (!fs.existsSync(abs)) {
    console.error("[ai-review-loop] File not found:", abs);
    process.exit(1);
  }

  const source = fs.readFileSync(abs, "utf8");

  // 1) Initial patch
  console.log(`\n[1/3] Initial model: Reviewing ${targetPath}...\n`);

  let openAiPatch = null;
  let initialProvider = "deepseek";

  try {
    openAiPatch = await callOpenAI(
      [
        {
          role: "system",
          content:
            "You are a senior TypeScript/Next.js engineer in the 'whistle' repo. " +
            "Given the file, return either:\n" +
            "1) A unified git diff, or\n" +
            "2) A full corrected file.\n" +
            "Only fix correctness, typing, imports, and obvious runtime bugs.",
        },
        {
          role: "user",
          content: `File path: ${targetPath}\n\nCurrent content:\n\n${source}`,
        },
      ]
    );
    initialProvider = "openai";
  } catch (err) {
    if (String(err.message).includes("OPENAI_UNAVAILABLE")) {
      console.warn("[ai-review-loop] OpenAI unavailable (auth/quota). Falling back to DeepSeek.");
    } else if (String(err.message).includes("NO_OPENAI_KEY")) {
      console.warn("[ai-review-loop] No OPENAI_API_KEY. Using DeepSeek only.");
    } else {
      console.warn("[ai-review-loop] OpenAI error:", err.message || err);
      console.warn("[ai-review-loop] Falling back to DeepSeek.");
    }

    openAiPatch = await callDeepSeek([
      {
        role: "system",
        content:
          "You are a senior TypeScript/Next.js engineer in the 'whistle' repo. " +
          "Return either a unified git diff or a full corrected file. " +
          "Only fix correctness, typing, imports, and obvious runtime bugs.",
      },
      {
        role: "user",
        content: `File path: ${targetPath}\n\nCurrent content:\n\n${source}`,
      },
    ]);
    initialProvider = "deepseek";
  }

  console.log("----- Initial suggested patch -----");
  console.log(openAiPatch);
  console.log("----- end initial patch -----\n");

  // 2) DeepSeek review (always DeepSeek)
  console.log("[2/3] DeepSeek: Cross-checking patch...\n");

  const deepseekReview = await callDeepSeek([
    {
      role: "system",
      content:
        "You are reviewing another AI's TypeScript/Next.js patch.\n" +
        "Check ONLY: type errors, runtime issues, missing imports, SSR/DOM safety, obvious logic bugs.\n" +
        "Respond with 'OK' if sound, otherwise a SHORT bullet list of concrete corrections.",
    },
    {
      role: "user",
      content:
        `Original file:\n${source}\n\n` +
        `Proposed patch (from ${initialProvider}):\n${openAiPatch}`,
    },
  ]);

  console.log("----- DeepSeek review -----");
  console.log(deepseekReview);
  console.log("----- end DeepSeek review -----\n");

  // 3) Reconcile
  console.log("[3/3] Reconciling into final patch...\n");

  let finalPatch;
  try {
    finalPatch = await callOpenAI([
      {
        role: "system",
        content:
          "You are reconciling your patch with another model's review.\n" +
          "If review is 'OK', output the original patch.\n" +
          "If there are valid issues, fix ONLY those.\n" +
          "Output ONLY:\n" +
          "- unified diff (git apply-compatible), OR\n" +
          "- full replacement file.\n" +
          "No commentary.",
      },
      {
        role: "user",
        content:
          `Original file:\n${source}\n\n` +
          `Your previous patch:\n${openAiPatch}\n\n` +
          `DeepSeek feedback:\n${deepseekReview}`,
      },
    ]);
  } catch {
    // If OpenAI unavailable, let DeepSeek do reconciliation.
    finalPatch = await callDeepSeek([
      {
        role: "system",
        content:
          "You are reconciling an initial patch with a review.\n" +
          "If review is 'OK', output the original patch.\n" +
          "If there are valid issues, fix ONLY those.\n" +
          "Output ONLY unified diff or full file. No commentary.",
      },
      {
        role: "user",
        content:
          `Original file:\n${source}\n\n` +
          `Initial patch:\n${openAiPatch}\n\n` +
          `DeepSeek feedback:\n${deepseekReview}`,
      },
    ]);
  }

  console.log("===== FINAL PATCH (apply manually or via git apply) =====");
  console.log(finalPatch);
  console.log("===== END FINAL PATCH =====\n");
}

main().catch((err) => {
  console.error("[ai-review-loop] Failed:", err.message || err);
  process.exit(1);
});

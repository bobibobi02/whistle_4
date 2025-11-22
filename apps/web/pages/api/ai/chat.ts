import type { NextApiRequest, NextApiResponse } from "next";
import { deepseekChat, type DSMessage } from "../../../lib/deepseek";
import openai from "../../../lib/openai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { messages, prompt, temperature, max_tokens } = req.body || {};
    let finalMessages: DSMessage[] | null = null;

    if (Array.isArray(messages) && messages.length > 0) {
      finalMessages = messages as DSMessage[];
    } else if (typeof prompt === "string" && prompt.trim().length > 0) {
      finalMessages = [{ role: "user", content: prompt.trim() }];
    }

    if (!finalMessages) {
      return res.status(400).json({ error: "Missing 'messages' or 'prompt'." });
    }

    // Try DeepSeek first
    try {
      const out = await deepseekChat(finalMessages, { temperature, max_tokens });
      return res.status(200).json({ provider: "deepseek", text: out.text });
    } catch (err: any) {
      console.warn("[/api/ai/chat] DeepSeek failed:", err?.message || err);
    }

    // Fallback to OpenAI
    try {
      const out = await openai.chat(finalMessages, "gpt-4o-mini");
      return res.status(200).json({ provider: "openai", text: out.text });
    } catch (err: any) {
      console.error("[/api/ai/chat] OpenAI failed:", err?.message || err);
      return res.status(500).json({ error: "Both providers failed", message: err?.message || "Unknown error" });
    }

  } catch (err: any) {
    console.error("[/api/ai/chat] error:", err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message || "Unknown error" });
  }
}

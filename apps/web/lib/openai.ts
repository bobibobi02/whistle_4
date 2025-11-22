/**
 * OpenAI client for Whistle.
 * IMPORTANT: Never hardcode API keys in this repo.
 */

const OPENAI_API_URL =
  process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";

export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function openaiChat(
  messages: OpenAIMessage[],
  model = "gpt-4o-mini"
) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) throw new Error("[openai] OPENAI_API_KEY not set.");

  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `[openai] HTTP ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`
    );
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("[openai] Invalid response.");
  return { text: content.trim(), raw: data };
}

export default { chat: openaiChat };
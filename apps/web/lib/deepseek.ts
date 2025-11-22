/**
 * DeepSeek client for the Whistle web app.
 */
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_API_URL =
  process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1/chat/completions";

export type DeepSeekRole = "system" | "user" | "assistant";
export interface DeepSeekMessage { role: DeepSeekRole; content: string; }
export type DSMessage = DeepSeekMessage;
export interface DeepSeekOptions { model?: string; temperature?: number; max_tokens?: number; maxTokens?: number; }
export interface DeepSeekChatResult { text: string; raw: any; }

export async function deepseekChat(messages: DeepSeekMessage[], options: DeepSeekOptions = {}): Promise<DeepSeekChatResult> {
  if (!DEEPSEEK_API_KEY) throw new Error("[deepseek] DEEPSEEK_API_KEY is not set.");
  if (!Array.isArray(messages) || messages.length === 0) throw new Error("[deepseek] 'messages' must be a non-empty array.");

  const model = options.model || "deepseek-chat";
  const temperature = typeof options.temperature === "number" ? options.temperature : 0.7;
  const maxTokens =
    typeof options.max_tokens === "number"
      ? options.max_tokens
      : typeof options.maxTokens === "number"
      ? options.maxTokens
      : undefined;

  const body: any = { model, messages, temperature };
  if (typeof maxTokens === "number") body.max_tokens = maxTokens;

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`[deepseek] HTTP ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("[deepseek] Invalid response: missing message content.");

  return { text: content.trim(), raw: data };
}

const deepseek = { chat: deepseekChat };
export default deepseek;

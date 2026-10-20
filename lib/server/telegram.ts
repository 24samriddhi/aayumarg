import "server-only";
import { requireEnv } from "./env";

/** Telegram chat ids look like 123456789 or -1001234567890 (groups). */
export const isChatId = (v: string) => /^-?\d{5,20}$/.test(v);

/** Send a plain-text Telegram message through the Bot API (no SDK needed). */
export async function sendTelegram(chatId: string, text: string): Promise<string> {
  if (!isChatId(chatId)) throw new Error("Telegram chat id must be a number like 123456789");
  const token = requireEnv("TELEGRAM_BOT_TOKEN");

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(10_000),
  });

  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean; description?: string; result?: { message_id?: number };
  };
  if (!res.ok || !data.ok) throw new Error(`Telegram ${res.status}: ${data.description ?? "send failed"}`);
  return String(data.result?.message_id ?? "");
}

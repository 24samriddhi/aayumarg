"use client";
import { useCallback, useRef, useState } from "react";
import { sendChat } from "@/lib/ai/ai.service";
import type { AiMessage } from "@/lib/types";

export type AiStatus = "idle" | "loading" | "success" | "error";

/** Ready for a future assistant UI. States: idle | loading | success | error (+ retry). */
export function useAiChat() {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [status, setStatus] = useState<AiStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const lastRef = useRef<AiMessage[]>([]);

  const run = useCallback(async (history: AiMessage[]) => {
    lastRef.current = history;
    setStatus("loading"); setError(null);
    try {
      const { reply } = await sendChat(history);
      setMessages([...history, { role: "assistant", content: reply }]);
      setStatus("success");
    } catch (e) {
      setError((e as Error).message); setStatus("error");
    }
  }, []);

  const send = useCallback((text: string) => {
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    return run(next);
  }, [messages, run]);

  const retry = useCallback(() => run(lastRef.current), [run]);
  return { messages, status, error, send, retry };
}

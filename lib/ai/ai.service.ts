import { ENV } from "@/lib/config/env";
import { apiRequest } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { mockAiReply, mockAiSummary } from "@/mocks/ai.mock";
import type { AiChatResponse, AiHealthSummary, AiMessage } from "@/lib/types";

/**
 * AI access point. The browser NEVER calls an AI provider directly:
 *   UI -> useAiChat -> ai.service -> backend /ai/* -> AI agent / model
 * All provider keys and agent logic stay server-side.
 * Not medical diagnosis – assistant output is informational only.
 */
const AI_TIMEOUT_MS = 30000;

export async function sendChat(messages: AiMessage[]): Promise<AiChatResponse> {
  if (ENV.USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 600));
    return mockAiReply();
  }
  return apiRequest<AiChatResponse>(API_ENDPOINTS.ai.chat, {
    method: "POST", body: { messages }, timeoutMs: AI_TIMEOUT_MS,
  });
}

export async function getHealthSummary(): Promise<AiHealthSummary> {
  if (ENV.USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 600));
    return mockAiSummary();
  }
  return apiRequest<AiHealthSummary>(API_ENDPOINTS.ai.healthSummary, { timeoutMs: AI_TIMEOUT_MS });
}

import type { AiChatResponse, AiHealthSummary } from "@/lib/types";
/** MOCK AI replies. Replace by the real backend AI endpoint (see API_CONTRACT.md). */
export const mockAiReply = (): AiChatResponse => ({
  reply:
    "This is a demo response. The AayuMarg assistant will be connected to the backend soon. " +
    "For medical concerns, please consult a qualified doctor.",
});
export const mockAiSummary = (): AiHealthSummary => ({
  summary: "Demo summary: connect the backend AI service to generate a real health summary.",
  generatedAt: new Date().toISOString(),
});

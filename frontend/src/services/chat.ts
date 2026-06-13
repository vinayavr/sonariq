import { apiRequest } from "@/lib/api";
import type { ChatRequest, ChatResponse } from "@/types/api";

export function sendChatMessage(payload: ChatRequest) {
  return apiRequest<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

import { apiRequest } from "@/lib/api";
import type { CommunicationEvent } from "@/types/api";

export function getLatestCommunicationEvents() {
  return apiRequest<CommunicationEvent[]>("/communications/events/latest");
}

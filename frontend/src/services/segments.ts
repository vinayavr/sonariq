import { apiRequest } from "@/lib/api";
import type { ChatResponse, SegmentPreviewRequest, SegmentPreviewResponse } from "@/types/api";

export async function previewSegment(payload: SegmentPreviewRequest) {
  const response = await apiRequest<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify({ message: toChatSegmentPreviewMessage(payload) }),
  });

  return toSegmentPreviewResponse(response);
}

function toChatSegmentPreviewMessage(payload: SegmentPreviewRequest) {
  const filters: string[] = [];

  if (payload.city) {
    filters.push(`from ${toTitleCase(payload.city)}`);
  }
  if (payload.recent_signup_days !== undefined) {
    filters.push(`signed up within last ${payload.recent_signup_days} days`);
  }
  if (payload.lifetime_spend_greater_than !== undefined) {
    filters.push(`spent more than ${payload.lifetime_spend_greater_than}`);
  }
  if (payload.dormant_days !== undefined) {
    filters.push(`with no orders in the last ${payload.dormant_days} days`);
  }
  if (payload.minimum_order_count !== undefined) {
    filters.push(`with at least ${payload.minimum_order_count} orders`);
  }
  if (payload.recent_product_purchase) {
    filters.push(`who purchased ${payload.recent_product_purchase}`);
  }

  return filters.length
    ? `Show me customers ${filters.join(" ")}`
    : "Show me customers";
}

function toSegmentPreviewResponse(response: ChatResponse): SegmentPreviewResponse {
  return {
    audience_count: toNumber(response.result.audience_count),
    customer_ids: toStringArray(response.result.customer_ids),
    explanation: toStringArray(response.result.explanation),
  };
}

function toNumber(value: unknown) {
  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function toTitleCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

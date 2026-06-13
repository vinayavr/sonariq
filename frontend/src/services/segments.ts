import { apiRequest } from "@/lib/api";
import type { SegmentPreviewRequest, SegmentPreviewResponse } from "@/types/api";

export function previewSegment(payload: SegmentPreviewRequest) {
  return apiRequest<SegmentPreviewResponse>("/segments/preview", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

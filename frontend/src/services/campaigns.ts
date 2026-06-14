import { apiRequest } from "@/lib/api";
import type {
  CampaignCreateRequest,
  CampaignLaunchRequest,
  CampaignLaunchResponse,
  CampaignPreviewRequest,
  CampaignPreviewResponse,
  CampaignResponse,
} from "@/types/api";

export function createCampaign(payload: CampaignCreateRequest) {
  return apiRequest<CampaignResponse>("/campaigns", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getRecentCampaigns() {
  return apiRequest<CampaignResponse[]>("/campaigns");
}

export function previewCampaign(payload: CampaignPreviewRequest) {
  return apiRequest<CampaignPreviewResponse>("/campaigns/preview", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function launchCampaign(campaignId: string, payload: CampaignLaunchRequest) {
  return apiRequest<CampaignLaunchResponse>(`/campaigns/${campaignId}/launch`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

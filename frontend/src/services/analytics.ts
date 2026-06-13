import { apiRequest } from "@/lib/api";
import type { AnalyticsOverview, CampaignAnalytics } from "@/types/api";

export function getAnalyticsOverview() {
  return apiRequest<AnalyticsOverview>("/analytics/overview");
}

export function getCampaignAnalytics(campaignId: string) {
  return apiRequest<CampaignAnalytics>(`/campaigns/${campaignId}/analytics`);
}

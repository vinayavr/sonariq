export type AnalyticsOverview = {
  total_customers: number;
  total_orders: number;
  total_campaigns: number;
  total_communications: number;
  total_attributed_orders: number;
  total_revenue: number;
  attributed_revenue: number;
};

export type SegmentPreviewRequest = {
  city?: string;
  recent_signup_days?: number;
  lifetime_spend_greater_than?: number;
  dormant_days?: number;
  minimum_order_count?: number;
  recent_product_purchase?: string;
};

export type SegmentPreviewResponse = {
  audience_count: number;
  customer_ids: string[];
  explanation: string[];
};

export type CampaignCreateRequest = {
  name: string;
  goal: string;
  channel: string;
  message_template: string;
};

export type CampaignResponse = CampaignCreateRequest & {
  id: string;
  created_at: string;
};

export type CampaignPreviewRequest = {
  campaign_id: string;
  segment_filters: SegmentPreviewRequest;
};

export type CampaignPreviewResponse = {
  campaign_name: string;
  audience_count: number;
  estimated_messages: number;
};

export type CampaignLaunchRequest = {
  segment_filters: SegmentPreviewRequest;
};

export type CampaignLaunchResponse = {
  campaign_id: string;
  communications_created: number;
};

export type CampaignAnalytics = {
  campaign_id: string;
  communications_sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  attributed_orders: number;
  attributed_revenue: number;
  conversion_rate: number;
};

export type ChatRequest = {
  message: string;
};

export type ChatResponse = {
  intent: string;
  parameters: Record<string, unknown>;
  result: Record<string, unknown>;
};

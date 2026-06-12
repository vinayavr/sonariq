from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel


class AnalyticsOverviewResponse(BaseModel):
    total_customers: int
    total_orders: int
    total_campaigns: int
    total_communications: int
    total_attributed_orders: int
    total_revenue: float
    attributed_revenue: float


class CampaignAnalyticsResponse(BaseModel):
    campaign_id: UUID
    communications_sent: int
    delivered: int
    opened: int
    clicked: int
    failed: int
    attributed_orders: int
    attributed_revenue: float
    conversion_rate: float

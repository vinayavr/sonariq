from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel


class AttributionProcessResponse(BaseModel):
    orders_processed: int
    orders_attributed: int


class CampaignAttributionResponse(BaseModel):
    campaign_id: UUID
    attributed_orders: int
    attributed_revenue: float

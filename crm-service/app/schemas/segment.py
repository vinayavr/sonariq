from __future__ import annotations

from typing import List
from uuid import UUID

from pydantic import BaseModel, Field


class SegmentPreviewRequest(BaseModel):
    city: str | None = None
    recent_signup_days: int | None = Field(None, ge=0)
    lifetime_spend_greater_than: float | None = Field(None, ge=0.0)
    dormant_days: int | None = Field(None, ge=0)
    minimum_order_count: int | None = Field(None, ge=0)
    recent_product_purchase: str | None = None


class SegmentPreviewResponse(BaseModel):
    audience_count: int
    customer_ids: List[UUID]
    explanation: List[str]

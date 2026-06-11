from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.schemas.segment import SegmentPreviewRequest


class CampaignCreateRequest(BaseModel):
    name: str
    goal: str
    channel: str
    message_template: str


class CampaignResponse(BaseModel):
    id: UUID
    name: str
    goal: str
    channel: str
    message_template: str
    created_at: datetime


class CampaignPreviewRequest(BaseModel):
    campaign_id: UUID
    segment_filters: SegmentPreviewRequest


class CampaignPreviewResponse(BaseModel):
    campaign_name: str
    audience_count: int
    estimated_messages: int


class CampaignLaunchRequest(BaseModel):
    segment_filters: SegmentPreviewRequest


class CampaignLaunchResponse(BaseModel):
    campaign_id: UUID
    communications_created: int

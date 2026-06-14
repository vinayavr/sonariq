from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ProcessCommunicationsResponse(BaseModel):
    processed: int
    delivered: int
    opened: int
    read: int
    clicked: int
    failed: int


class CommunicationEventResponse(BaseModel):
    event_type: str
    timestamp: datetime


class LatestCommunicationEventResponse(BaseModel):
    event_type: str
    communication_id: UUID
    campaign_id: UUID
    timestamp: datetime

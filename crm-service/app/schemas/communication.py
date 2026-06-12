from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel


class ProcessCommunicationsResponse(BaseModel):
    processed: int
    delivered: int
    opened: int
    clicked: int
    failed: int


class CommunicationEventResponse(BaseModel):
    event_type: str
    timestamp: datetime

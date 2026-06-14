from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.schemas.communication import (
    CommunicationEventResponse,
    LatestCommunicationEventResponse,
    ProcessCommunicationsResponse,
)
from app.services.communication_service import (
    get_communication_events,
    get_latest_communication_events,
    process_pending_communications,
)

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/process", response_model=ProcessCommunicationsResponse)
def process_communications_endpoint(
    db: Session = Depends(get_db),
) -> ProcessCommunicationsResponse:
    return process_pending_communications(db)


@router.get("/events/latest", response_model=list[LatestCommunicationEventResponse])
def get_latest_communication_events_endpoint(
    db: Session = Depends(get_db),
) -> list[LatestCommunicationEventResponse]:
    return get_latest_communication_events(db)


@router.get("/{communication_id}/events", response_model=list[CommunicationEventResponse])
def get_communication_events_endpoint(
    communication_id: UUID,
    db: Session = Depends(get_db),
) -> list[CommunicationEventResponse]:
    return get_communication_events(communication_id, db)

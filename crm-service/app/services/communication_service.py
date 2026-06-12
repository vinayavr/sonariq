from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.communication import Communication
from app.models.event import CommunicationEvent, CommunicationEventType
from app.schemas.communication import (
    CommunicationEventResponse,
    ProcessCommunicationsResponse,
)

SENT_STATUS = "SENT"
DELIVERED_STATUS = "DELIVERED"
FAILED_STATUS = "FAILED"
OPENED_STATUS = "OPENED"
CLICKED_STATUS = "CLICKED"

DELIVERY_PROBABILITY = 0.90
OPEN_PROBABILITY = 0.70
CLICK_PROBABILITY = 0.30


def process_pending_communications(db: Session) -> ProcessCommunicationsResponse:
    communications = db.execute(
        select(Communication).where(Communication.status == SENT_STATUS)
    ).scalars().all()

    delivered = 0
    opened = 0
    clicked = 0
    failed = 0

    for communication in communications:
        event_time = communication.sent_at or datetime.now(timezone.utc)
        events = []

        if random.random() <= DELIVERY_PROBABILITY:
            delivered += 1
            latest_status = DELIVERED_STATUS
            events.append(
                CommunicationEvent(
                    communication_id=communication.id,
                    event_type=CommunicationEventType.DELIVERED,
                    timestamp=event_time,
                )
            )

            if random.random() <= OPEN_PROBABILITY:
                opened += 1
                latest_status = OPENED_STATUS
                event_time = event_time + timedelta(seconds=1)
                events.append(
                    CommunicationEvent(
                        communication_id=communication.id,
                        event_type=CommunicationEventType.OPENED,
                        timestamp=event_time,
                    )
                )

                if random.random() <= CLICK_PROBABILITY:
                    clicked += 1
                    latest_status = CLICKED_STATUS
                    event_time = event_time + timedelta(seconds=1)
                    events.append(
                        CommunicationEvent(
                            communication_id=communication.id,
                            event_type=CommunicationEventType.CLICKED,
                            timestamp=event_time,
                        )
                    )
        else:
            failed += 1
            latest_status = FAILED_STATUS
            event_time = event_time + timedelta(seconds=1)
            events.append(
                CommunicationEvent(
                    communication_id=communication.id,
                    event_type=CommunicationEventType.FAILED,
                    timestamp=event_time,
                )
            )

        communication.status = latest_status
        db.add_all(events)

    db.commit()

    return ProcessCommunicationsResponse(
        processed=len(communications),
        delivered=delivered,
        opened=opened,
        clicked=clicked,
        failed=failed,
    )


def get_communication_events(
    communication_id: UUID,
    db: Session,
) -> list[CommunicationEventResponse]:
    events = db.execute(
        select(CommunicationEvent)
        .where(CommunicationEvent.communication_id == communication_id)
        .order_by(CommunicationEvent.timestamp.asc())
    ).scalars().all()

    return [
        CommunicationEventResponse(
            event_type=event_type_label(event.event_type),
            timestamp=event.timestamp,
        )
        for event in events
    ]


def event_type_label(event_type: CommunicationEventType | str) -> str:
    if isinstance(event_type, CommunicationEventType):
        return event_type.name
    return str(event_type).upper()

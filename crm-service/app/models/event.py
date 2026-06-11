import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CommunicationEventType(StrEnum):
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    OPENED = "opened"
    READ = "read"
    CLICKED = "clicked"


class CommunicationEvent(Base):
    """Represents lifecycle events generated after a communication is sent, such as delivered, opened, read, clicked, or failed."""
    __tablename__ = "communication_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    communication_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("communications.id"), nullable=False, index=True)
    event_type: Mapped[CommunicationEventType] = mapped_column(
        Enum(CommunicationEventType, name="communication_event_type"),
        nullable=False,
    )
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    communication: Mapped["Communication"] = relationship(back_populates="events")


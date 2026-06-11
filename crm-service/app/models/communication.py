import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Communication(Base):
    """Represents a single campaign send to a specific customer. One campaign sent to 100 customers creates 100 communication records."""
    __tablename__ = "communications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campaigns.id"), nullable=False, index=True)
    customer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("customers.id"), nullable=False, index=True)
    personalized_message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    campaign: Mapped["Campaign"] = relationship(back_populates="communications")
    customer: Mapped["Customer"] = relationship(back_populates="communications")
    # Events are child records for a single communication's delivery timeline.
    events: Mapped[list["CommunicationEvent"]] = relationship(back_populates="communication", cascade="all, delete-orphan")
    attributed_orders: Mapped[list["AttributedOrder"]] = relationship(back_populates="communication")


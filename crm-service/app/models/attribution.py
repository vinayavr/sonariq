import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AttributedOrder(Base):
    """Represents a purchase attributed to a campaign communication and is used for ROI and conversion tracking."""
    __tablename__ = "attributed_orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campaigns.id"), nullable=False, index=True)
    communication_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("communications.id"), nullable=False, index=True)
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"), nullable=False, index=True)
    attributed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    campaign: Mapped["Campaign"] = relationship(back_populates="attributed_orders")
    communication: Mapped["Communication"] = relationship(back_populates="attributed_orders")
    # A single attribution row points at the order credited to the campaign touch.
    order: Mapped["Order"] = relationship()


import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Customer(Base):
    """Represents a shopper that can be segmented, targeted, and engaged through campaigns."""
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    signup_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Customer owns the lifecycle records used for segmentation and outreach history.
    orders: Mapped[list["Order"]] = relationship(back_populates="customer", cascade="all, delete-orphan")
    communications: Mapped[list["Communication"]] = relationship(back_populates="customer", cascade="all, delete-orphan")


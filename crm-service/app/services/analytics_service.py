from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.attribution import AttributedOrder
from app.models.campaign import Campaign
from app.models.communication import Communication
from app.models.customer import Customer
from app.models.event import CommunicationEvent, CommunicationEventType
from app.models.order import Order
from app.schemas.analytics import AnalyticsOverviewResponse, CampaignAnalyticsResponse


def get_analytics_overview(db: Session) -> AnalyticsOverviewResponse:
    total_revenue = db.scalar(select(func.coalesce(func.sum(Order.total_amount), 0)))
    attributed_revenue = db.scalar(
        select(func.coalesce(func.sum(Order.total_amount), 0))
        .join(AttributedOrder, AttributedOrder.order_id == Order.id)
    )

    return AnalyticsOverviewResponse(
        total_customers=count_rows(db, Customer.id),
        total_orders=count_rows(db, Order.id),
        total_campaigns=count_rows(db, Campaign.id),
        total_communications=count_rows(db, Communication.id),
        total_attributed_orders=count_rows(db, AttributedOrder.id),
        total_revenue=to_float(total_revenue),
        attributed_revenue=to_float(attributed_revenue),
    )


def get_campaign_analytics(
    campaign_id: UUID,
    db: Session,
) -> CampaignAnalyticsResponse:
    communications_sent = db.scalar(
        select(func.count(Communication.id)).where(
            Communication.campaign_id == campaign_id
        )
    ) or 0
    event_counts = campaign_event_counts(campaign_id, db)
    attributed_orders, attributed_revenue = db.execute(
        select(
            func.count(AttributedOrder.id),
            func.coalesce(func.sum(Order.total_amount), 0),
        )
        .join(Order, Order.id == AttributedOrder.order_id)
        .where(AttributedOrder.campaign_id == campaign_id)
    ).one()
    conversion_rate = (
        (attributed_orders / communications_sent) * 100
        if communications_sent
        else 0.0
    )

    return CampaignAnalyticsResponse(
        campaign_id=campaign_id,
        communications_sent=communications_sent,
        delivered=event_counts[CommunicationEventType.DELIVERED],
        opened=event_counts[CommunicationEventType.OPENED],
        clicked=event_counts[CommunicationEventType.CLICKED],
        failed=event_counts[CommunicationEventType.FAILED],
        attributed_orders=attributed_orders,
        attributed_revenue=to_float(attributed_revenue),
        conversion_rate=float(conversion_rate),
    )


def campaign_event_counts(
    campaign_id: UUID,
    db: Session,
) -> dict[CommunicationEventType, int]:
    rows = db.execute(
        select(CommunicationEvent.event_type, func.count(CommunicationEvent.id))
        .join(Communication, Communication.id == CommunicationEvent.communication_id)
        .where(Communication.campaign_id == campaign_id)
        .where(
            CommunicationEvent.event_type.in_(
                [
                    CommunicationEventType.DELIVERED,
                    CommunicationEventType.OPENED,
                    CommunicationEventType.CLICKED,
                    CommunicationEventType.FAILED,
                ]
            )
        )
        .group_by(CommunicationEvent.event_type)
    ).all()

    counts = {
        CommunicationEventType.DELIVERED: 0,
        CommunicationEventType.OPENED: 0,
        CommunicationEventType.CLICKED: 0,
        CommunicationEventType.FAILED: 0,
    }
    counts.update({event_type: count for event_type, count in rows})
    return counts


def count_rows(db: Session, column) -> int:
    return db.scalar(select(func.count(column))) or 0


def to_float(value: Decimal | int | None) -> float:
    return float(value or Decimal("0"))

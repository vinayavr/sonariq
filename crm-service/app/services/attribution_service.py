from __future__ import annotations

from datetime import timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.models.attribution import AttributedOrder
from app.models.communication import Communication
from app.models.order import Order
from app.schemas.attribution import (
    AttributionProcessResponse,
    CampaignAttributionResponse,
)

ATTRIBUTION_WINDOW = timedelta(days=7)


def process_attributions(db: Session) -> AttributionProcessResponse:
    orders_processed = db.scalar(select(func.count(Order.id))) or 0
    ranked_candidates = (
        select(
            Order.id.label("order_id"),
            Order.order_date.label("attributed_at"),
            Communication.id.label("communication_id"),
            Communication.campaign_id.label("campaign_id"),
            func.row_number()
            .over(
                partition_by=Order.id,
                order_by=Communication.sent_at.desc(),
            )
            .label("candidate_rank"),
        )
        .select_from(Order)
        .join(
            Communication,
            and_(
                Communication.customer_id == Order.customer_id,
                Communication.sent_at.is_not(None),
                Communication.sent_at >= Order.order_date - ATTRIBUTION_WINDOW,
                Communication.sent_at <= Order.order_date + ATTRIBUTION_WINDOW,
            ),
        )
        .outerjoin(AttributedOrder, AttributedOrder.order_id == Order.id)
        .where(AttributedOrder.id.is_(None))
        .subquery()
    )

    attribution_rows = db.execute(
        select(
            ranked_candidates.c.campaign_id,
            ranked_candidates.c.communication_id,
            ranked_candidates.c.order_id,
            ranked_candidates.c.attributed_at,
        ).where(ranked_candidates.c.candidate_rank == 1)
    ).all()

    db.add_all(
        [
            AttributedOrder(
                campaign_id=row.campaign_id,
                communication_id=row.communication_id,
                order_id=row.order_id,
                attributed_at=row.attributed_at,
            )
            for row in attribution_rows
        ]
    )

    db.commit()

    return AttributionProcessResponse(
        orders_processed=orders_processed,
        orders_attributed=len(attribution_rows),
    )


def get_campaign_attribution(
    campaign_id: UUID,
    db: Session,
) -> CampaignAttributionResponse:
    result = db.execute(
        select(
            func.count(AttributedOrder.id),
            func.coalesce(func.sum(Order.total_amount), 0),
        )
        .join(Order, Order.id == AttributedOrder.order_id)
        .where(AttributedOrder.campaign_id == campaign_id)
    ).one()

    attributed_orders, attributed_revenue = result

    return CampaignAttributionResponse(
        campaign_id=campaign_id,
        attributed_orders=attributed_orders,
        attributed_revenue=float(attributed_revenue or Decimal("0")),
    )

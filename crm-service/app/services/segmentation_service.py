from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import List

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.order import Order
from app.schemas.segment import SegmentPreviewRequest, SegmentPreviewResponse


def build_segment_preview(
    request: SegmentPreviewRequest,
    db: Session,
) -> SegmentPreviewResponse:
    """
    Build a segment preview by applying filters to the customer base.

    All filters are combined using AND logic.
    """
    filters = []
    explanation: List[str] = []

    # Filter 1: City
    if request.city:
        filters.append(Customer.city == request.city)
        explanation.append(f"city equals {request.city}")

    # Filter 2: Recent signup (in days)
    if request.recent_signup_days is not None:
        signup_cutoff = date.today() - timedelta(days=request.recent_signup_days)
        filters.append(Customer.signup_date >= signup_cutoff)
        explanation.append(f"signup within last {request.recent_signup_days} days")

    # Build order aggregation subquery for spend and order count filters
    order_agg = select(
        Order.customer_id.label("customer_id"),
        func.count(Order.id).label("order_count"),
        func.coalesce(func.sum(Order.total_amount), 0).label("lifetime_spend"),
    ).group_by(Order.customer_id).subquery()

    query = select(Customer.id).select_from(Customer)

    # Filter 3 & 4: Lifetime spend and minimum order count (both need order_agg join)
    if request.lifetime_spend_greater_than is not None or request.minimum_order_count is not None:
        query = query.join(order_agg, order_agg.c.customer_id == Customer.id)

    if request.lifetime_spend_greater_than is not None:
        filters.append(order_agg.c.lifetime_spend > request.lifetime_spend_greater_than)
        explanation.append(
            f"lifetime spend greater than {request.lifetime_spend_greater_than}"
        )

    if request.minimum_order_count is not None:
        filters.append(order_agg.c.order_count >= request.minimum_order_count)
        explanation.append(f"minimum {request.minimum_order_count} orders")

    # Filter 5: Dormant customers (no orders in last N days)
    if request.dormant_days is not None:
        dormant_cutoff = datetime.now(timezone.utc) - timedelta(days=request.dormant_days)
        recent_order_exists = select(Order.id).where(
            Order.customer_id == Customer.id,
            Order.order_date >= dormant_cutoff,
        ).exists()
        filters.append(~recent_order_exists)
        explanation.append(f"no orders in the last {request.dormant_days} days")

    # Filter 6: Recent product purchase (within 30 days)
    if request.recent_product_purchase:
        recent_purchase_cutoff = datetime.now(timezone.utc) - timedelta(days=30)
        recent_product_exists = select(Order.id).where(
            Order.customer_id == Customer.id,
            Order.order_date >= recent_purchase_cutoff,
            Order.items_json.contains(
                {"items": [{"name": request.recent_product_purchase}]}
            ),
        ).exists()
        filters.append(recent_product_exists)
        explanation.append(
            f"purchased {request.recent_product_purchase} in the last 30 days"
        )

    query = query.where(and_(*filters)) if filters else query
    query = query.distinct()

    customer_ids = [customer_id for customer_id, in db.execute(query).all()]

    return SegmentPreviewResponse(
        audience_count=len(customer_ids),
        customer_ids=customer_ids,
        explanation=explanation,
    )

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.attribution import AttributedOrder
from app.models.campaign import Campaign
from app.models.communication import Communication
from app.models.customer import Customer
from app.models.event import CommunicationEvent, CommunicationEventType
from app.models.order import Order
from app.schemas.campaign import (
    CampaignCreateRequest,
    CampaignLaunchRequest,
    CampaignLaunchResponse,
    CampaignPreviewRequest,
    CampaignPreviewResponse,
    CampaignResponse,
)
from app.services.segmentation_service import build_segment_preview


SENT_STATUS = "SENT"
DELIVERED_STATUS = "DELIVERED"
OPENED_STATUS = "OPENED"
READ_STATUS = "READ"
CLICKED_STATUS = "CLICKED"
FAILED_STATUS = "FAILED"

DEMO_DELIVERY_RATE = 0.92
DEMO_OPEN_RATE = 0.64
DEMO_READ_RATE = 0.82
DEMO_CLICK_RATE = 0.34
DEMO_CONVERSION_RATE = 0.42


def create_campaign(db: Session, request: CampaignCreateRequest) -> CampaignResponse:
    campaign = Campaign(
        name=request.name,
        goal=request.goal,
        channel=request.channel,
        message_template=request.message_template,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return to_campaign_response(campaign)


def get_campaign(db: Session, campaign_id: UUID) -> Campaign | None:
    return db.get(Campaign, campaign_id)


def get_recent_campaigns(db: Session, limit: int = 3) -> list[CampaignResponse]:
    campaigns = db.execute(
        select(Campaign)
        .order_by(Campaign.created_at.desc())
        .limit(limit)
    ).scalars().all()

    return [to_campaign_response(campaign) for campaign in campaigns]


def preview_campaign(
    db: Session,
    request: CampaignPreviewRequest,
    campaign: Campaign,
) -> CampaignPreviewResponse:
    segment_preview = build_segment_preview(request.segment_filters, db)
    return CampaignPreviewResponse(
        campaign_name=campaign.name,
        audience_count=segment_preview.audience_count,
        estimated_messages=segment_preview.audience_count,
    )


def launch_campaign(
    db: Session,
    campaign: Campaign,
    request: CampaignLaunchRequest,
) -> CampaignLaunchResponse:
    segment_preview = build_segment_preview(request.segment_filters, db)

    if not segment_preview.customer_ids:
        return CampaignLaunchResponse(
            campaign_id=campaign.id,
            communications_created=0,
        )

    customers = db.execute(
        select(Customer).where(Customer.id.in_(segment_preview.customer_ids))
    ).scalars().all()

    sent_at = datetime.now(timezone.utc)
    communications = [
        Communication(
            campaign_id=campaign.id,
            customer_id=customer.id,
            personalized_message=personalize_message(
                campaign.message_template,
                first_name=customer.first_name,
            ),
            status=SENT_STATUS,
            sent_at=sent_at,
        )
        for customer in customers
    ]

    db.add_all(communications)
    db.flush()
    seed_demo_engagement(db, communications)
    db.commit()

    return CampaignLaunchResponse(
        campaign_id=campaign.id,
        communications_created=len(communications),
    )


def personalize_message(template: str, *, first_name: str) -> str:
    return template.replace("{first_name}", first_name)


def seed_demo_engagement(
    db: Session,
    communications: list[Communication],
) -> None:
    if not communications:
        return

    delivered_limit = demo_count(len(communications), DEMO_DELIVERY_RATE)
    opened_limit = demo_count(delivered_limit, DEMO_OPEN_RATE)
    read_limit = demo_count(opened_limit, DEMO_READ_RATE)
    clicked_limit = demo_count(opened_limit, DEMO_CLICK_RATE)
    converted_limit = demo_count(clicked_limit, DEMO_CONVERSION_RATE)

    events: list[CommunicationEvent] = []
    attributions: list[AttributedOrder] = []

    for index, communication in enumerate(communications):
        event_time = communication.sent_at or datetime.now(timezone.utc)

        if index >= delivered_limit:
            communication.status = FAILED_STATUS
            events.append(
                CommunicationEvent(
                    communication_id=communication.id,
                    event_type=CommunicationEventType.FAILED,
                    timestamp=event_time + timedelta(minutes=2 + index),
                )
            )
            continue

        communication.status = DELIVERED_STATUS
        events.append(
            CommunicationEvent(
                communication_id=communication.id,
                event_type=CommunicationEventType.DELIVERED,
                timestamp=event_time + timedelta(minutes=1 + index),
            )
        )

        if index >= opened_limit:
            continue

        communication.status = OPENED_STATUS
        events.append(
            CommunicationEvent(
                communication_id=communication.id,
                event_type=CommunicationEventType.OPENED,
                timestamp=event_time + timedelta(minutes=8 + index),
            )
        )

        if index < read_limit:
            communication.status = READ_STATUS
            events.append(
                CommunicationEvent(
                    communication_id=communication.id,
                    event_type=CommunicationEventType.READ,
                    timestamp=event_time + timedelta(minutes=12 + index),
                )
            )

        if index >= clicked_limit:
            continue

        communication.status = CLICKED_STATUS
        clicked_at = event_time + timedelta(minutes=16 + index)
        events.append(
            CommunicationEvent(
                communication_id=communication.id,
                event_type=CommunicationEventType.CLICKED,
                timestamp=clicked_at,
            )
        )

        if index >= converted_limit:
            continue

        order = Order(
            customer_id=communication.customer_id,
            order_date=clicked_at + timedelta(hours=2),
            total_amount=demo_order_amount(index),
            items_json=demo_order_items(index),
        )
        db.add(order)
        db.flush()
        attributions.append(
            AttributedOrder(
                campaign_id=communication.campaign_id,
                communication_id=communication.id,
                order_id=order.id,
                attributed_at=order.order_date,
            )
        )

    db.add_all(events)
    db.add_all(attributions)


def demo_order_amount(index: int) -> Decimal:
    amount = 899 + ((index * 137) % 4300)
    return Decimal(amount).quantize(Decimal("0.01"))


def demo_count(total: int, rate: float) -> int:
    if total <= 0:
        return 0
    return max(1, min(total, round(total * rate)))


def demo_order_items(index: int) -> dict[str, object]:
    products = [
        ("Coffee", "Cold Brew Starter Kit"),
        ("Fashion", "Premium Sneakers"),
        ("Beauty", "Glow Serum"),
        ("Coffee", "Arabica Coffee Beans"),
        ("Fashion", "Weekend Hoodie"),
        ("Beauty", "Daily Sunscreen"),
    ]
    category, name = products[index % len(products)]
    return {
        "category": category,
        "items": [
            {
                "sku": f"DEMO-{index + 1:04d}",
                "category": category,
                "name": name,
                "quantity": 1,
                "unit_price": float(demo_order_amount(index)),
            }
        ],
    }


def to_campaign_response(campaign: Campaign) -> CampaignResponse:
    return CampaignResponse(
        id=campaign.id,
        name=campaign.name,
        goal=campaign.goal,
        channel=campaign.channel,
        message_template=campaign.message_template,
        created_at=campaign.created_at,
    )

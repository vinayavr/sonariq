from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.campaign import Campaign
from app.models.communication import Communication
from app.models.customer import Customer
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
    db.commit()

    return CampaignLaunchResponse(
        campaign_id=campaign.id,
        communications_created=len(communications),
    )


def personalize_message(template: str, *, first_name: str) -> str:
    return template.replace("{first_name}", first_name)


def to_campaign_response(campaign: Campaign) -> CampaignResponse:
    return CampaignResponse(
        id=campaign.id,
        name=campaign.name,
        goal=campaign.goal,
        channel=campaign.channel,
        message_template=campaign.message_template,
        created_at=campaign.created_at,
    )

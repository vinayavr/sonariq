from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.schemas.campaign import (
    CampaignCreateRequest,
    CampaignLaunchRequest,
    CampaignLaunchResponse,
    CampaignPreviewRequest,
    CampaignPreviewResponse,
    CampaignResponse,
)
from app.services.campaign_service import (
    create_campaign,
    get_campaign,
    launch_campaign,
    preview_campaign,
    to_campaign_response,
)

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("", response_model=CampaignResponse)
def create_campaign_endpoint(
    request: CampaignCreateRequest,
    db: Session = Depends(get_db),
) -> CampaignResponse:
    return create_campaign(db, request)


@router.post("/preview", response_model=CampaignPreviewResponse)
def preview_campaign_endpoint(
    request: CampaignPreviewRequest,
    db: Session = Depends(get_db),
) -> CampaignPreviewResponse:
    campaign = get_campaign(db, request.campaign_id)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return preview_campaign(db, request, campaign)


@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign_endpoint(
    campaign_id: UUID,
    db: Session = Depends(get_db),
) -> CampaignResponse:
    campaign = get_campaign(db, campaign_id)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return to_campaign_response(campaign)


@router.post("/{campaign_id}/launch", response_model=CampaignLaunchResponse)
def launch_campaign_endpoint(
    campaign_id: UUID,
    request: CampaignLaunchRequest,
    db: Session = Depends(get_db),
) -> CampaignLaunchResponse:
    campaign = get_campaign(db, campaign_id)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return launch_campaign(db, campaign, request)

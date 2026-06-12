from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.schemas.attribution import (
    AttributionProcessResponse,
    CampaignAttributionResponse,
)
from app.services.attribution_service import (
    get_campaign_attribution,
    process_attributions,
)

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/attribution/process", response_model=AttributionProcessResponse)
def process_attribution_endpoint(
    db: Session = Depends(get_db),
) -> AttributionProcessResponse:
    return process_attributions(db)


@router.get(
    "/campaigns/{campaign_id}/attribution",
    response_model=CampaignAttributionResponse,
)
def get_campaign_attribution_endpoint(
    campaign_id: UUID,
    db: Session = Depends(get_db),
) -> CampaignAttributionResponse:
    return get_campaign_attribution(campaign_id, db)

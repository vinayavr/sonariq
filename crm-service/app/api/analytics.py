from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.schemas.analytics import AnalyticsOverviewResponse, CampaignAnalyticsResponse
from app.services.analytics_service import (
    get_analytics_overview,
    get_campaign_analytics,
)

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/analytics/overview", response_model=AnalyticsOverviewResponse)
def get_analytics_overview_endpoint(
    db: Session = Depends(get_db),
) -> AnalyticsOverviewResponse:
    return get_analytics_overview(db)


@router.get(
    "/campaigns/{campaign_id}/analytics",
    response_model=CampaignAnalyticsResponse,
)
def get_campaign_analytics_endpoint(
    campaign_id: UUID,
    db: Session = Depends(get_db),
) -> CampaignAnalyticsResponse:
    return get_campaign_analytics(campaign_id, db)

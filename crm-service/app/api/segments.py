from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.schemas.segment import SegmentPreviewRequest, SegmentPreviewResponse
from app.services.segmentation_service import build_segment_preview

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/preview", response_model=SegmentPreviewResponse)
def preview_segment(
    request: SegmentPreviewRequest,
    db: Session = Depends(get_db),
):
    """
    Preview a customer segment based on filter criteria.

    All filters are combined using AND logic.
    At least one filter is required.
    """
    if not any(
        [
            request.city,
            request.recent_signup_days is not None,
            request.lifetime_spend_greater_than is not None,
            request.dormant_days is not None,
            request.minimum_order_count is not None,
            request.recent_product_purchase,
        ]
    ):
        raise HTTPException(
            status_code=400,
            detail="At least one segmentation filter is required.",
        )
    return build_segment_preview(request, db)

from __future__ import annotations

import re
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.schemas.campaign import CampaignPreviewRequest
from app.schemas.chat import ChatResponse
from app.schemas.segment import SegmentPreviewRequest
from app.services.analytics_service import (
    get_analytics_overview,
    get_campaign_analytics,
)
from app.services.campaign_service import get_campaign, preview_campaign
from app.services.segmentation_service import build_segment_preview

UUID_PATTERN = re.compile(
    r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b",
    re.IGNORECASE,
)


def handle_chat_message(message: str, db: Session) -> ChatResponse:
    intent = detect_intent(message)
    parameters = extract_parameters(message)

    if intent == "analytics_overview":
        result = to_dict(get_analytics_overview(db))
    elif intent == "campaign_analytics":
        result = run_campaign_analytics(parameters, db)
    elif intent == "campaign_preview":
        result = run_campaign_preview(parameters, db)
    else:
        intent = "segment_preview"
        segment_request = build_segment_request(parameters)
        parameters = segment_request_to_parameters(segment_request)
        result = to_dict(build_segment_preview(segment_request, db))

    return ChatResponse(
        intent=intent,
        parameters=parameters,
        result=result,
    )


def detect_intent(message: str) -> str:
    normalized = message.lower()

    if "campaign" in normalized and any(
        keyword in normalized for keyword in ["analytics", "performance", "stats"]
    ):
        return "campaign_analytics"
    if any(keyword in normalized for keyword in ["overview", "dashboard", "summary"]):
        return "analytics_overview"
    if "campaign" in normalized and any(
        keyword in normalized for keyword in ["preview", "estimate", "audience"]
    ):
        return "campaign_preview"
    return "segment_preview"


def extract_parameters(message: str) -> dict[str, Any]:
    parameters: dict[str, Any] = {}
    campaign_id = extract_uuid(message)
    if campaign_id is not None:
        parameters["campaign_id"] = str(campaign_id)

    city = extract_city(message)
    if city:
        parameters["city"] = city

    spend = extract_number_after(
        message,
        [
            r"spent\s+(?:more than|greater than|over|above)\s+(\d+(?:\.\d+)?)",
            r"spend\s+(?:more than|greater than|over|above)\s+(\d+(?:\.\d+)?)",
            r"lifetime spend\s+(?:more than|greater than|over|above)\s+(\d+(?:\.\d+)?)",
        ],
    )
    if spend is not None:
        parameters["lifetime_spend_greater_than"] = spend

    recent_signup_days = extract_number_after(
        message,
        [
            r"signed up (?:in|within) (?:the )?last\s+(\d+)\s+days",
            r"recent signup(?:s)?(?: within)?\s+(\d+)\s+days",
        ],
    )
    if recent_signup_days is not None:
        parameters["recent_signup_days"] = int(recent_signup_days)

    dormant_days = extract_number_after(
        message,
        [
            r"dormant\s+(?:for|since|over)?\s*(\d+)\s+days",
            r"no orders? (?:in|for) (?:the )?last\s+(\d+)\s+days",
        ],
    )
    if dormant_days is not None:
        parameters["dormant_days"] = int(dormant_days)

    minimum_order_count = extract_number_after(
        message,
        [
            r"(?:at least|minimum of|minimum)\s+(\d+)\s+orders",
            r"ordered\s+(?:at least|more than)\s+(\d+)\s+times",
        ],
    )
    if minimum_order_count is not None:
        parameters["minimum_order_count"] = int(minimum_order_count)

    product = extract_product(message)
    if product:
        parameters["recent_product_purchase"] = product

    return parameters


def build_segment_request(parameters: dict[str, Any]) -> SegmentPreviewRequest:
    return SegmentPreviewRequest(
        city=parameters.get("city"),
        lifetime_spend_greater_than=parameters.get("lifetime_spend_greater_than"),
        recent_signup_days=parameters.get("recent_signup_days"),
        dormant_days=parameters.get("dormant_days"),
        minimum_order_count=parameters.get("minimum_order_count"),
        recent_product_purchase=parameters.get("recent_product_purchase"),
    )


def run_campaign_preview(parameters: dict[str, Any], db: Session) -> dict[str, Any]:
    campaign_id = parse_campaign_id(parameters)
    if campaign_id is None:
        return {"error": "campaign_id is required for campaign_preview"}

    campaign = get_campaign(db, campaign_id)
    if campaign is None:
        return {"error": "Campaign not found"}

    request = CampaignPreviewRequest(
        campaign_id=campaign_id,
        segment_filters=build_segment_request(parameters),
    )
    return to_dict(preview_campaign(db, request, campaign))


def run_campaign_analytics(parameters: dict[str, Any], db: Session) -> dict[str, Any]:
    campaign_id = parse_campaign_id(parameters)
    if campaign_id is None:
        return {"error": "campaign_id is required for campaign_analytics"}
    return to_dict(get_campaign_analytics(campaign_id, db))


def extract_uuid(message: str) -> UUID | None:
    match = UUID_PATTERN.search(message)
    return UUID(match.group(0)) if match else None


def parse_campaign_id(parameters: dict[str, Any]) -> UUID | None:
    campaign_id = parameters.get("campaign_id")
    return UUID(campaign_id) if campaign_id else None


def extract_city(message: str) -> str | None:
    match = re.search(
        r"\b(?:from|in|city)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)\b",
        message,
    )
    return match.group(1) if match else None


def extract_number_after(message: str, patterns: list[str]) -> float | None:
    for pattern in patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            return float(match.group(1))
    return None


def extract_product(message: str) -> str | None:
    match = re.search(
        r"\b(?:bought|purchased)\s+([A-Za-z0-9][A-Za-z0-9 ]{1,40})",
        message,
        re.IGNORECASE,
    )
    return match.group(1).strip() if match else None


def segment_request_to_parameters(request: SegmentPreviewRequest) -> dict[str, Any]:
    return {
        key: value
        for key, value in to_dict(request).items()
        if value is not None
    }


def to_dict(model) -> dict[str, Any]:
    if hasattr(model, "model_dump"):
        return model.model_dump(mode="json")
    return model.dict()

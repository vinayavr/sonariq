from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    intent: str
    parameters: dict[str, Any]
    result: dict[str, Any]

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ChatSessionResponse(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatSessionUpdateRequest(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=200,
    )


class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    question: str
    generated_sql: str
    sql_explanation: str
    summary: str
    columns: list[str]
    rows: list[dict[str, Any]]
    row_count: int
    execution_time_ms: float
    truncated: bool
    created_at: datetime


class ChatSessionDetailResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[ChatMessageResponse]

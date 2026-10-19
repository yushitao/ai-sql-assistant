from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SQLAuditHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    question: str | None
    sql_text: str
    validation_passed: bool
    execution_success: bool
    row_count: int | None
    execution_time_ms: float | None
    error_message: str | None
    created_at: datetime

class SQLAuditResponse(BaseModel):
    id: int
    user_id: int
    username: str
    question: str | None
    sql_text: str
    validation_passed: bool
    execution_success: bool
    row_count: int
    execution_time_ms: float | None
    error_message: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SQLAuditPageResponse(BaseModel):
    items: list[SQLAuditResponse]
    total: int
    limit: int
    offset: int


class SQLAuditStatsResponse(BaseModel):
    total: int
    success_count: int
    failure_count: int
    success_rate: float
    failure_rate: float
    avg_execution_time_ms: float
    like_count: int
    dislike_count: int
    satisfaction_rate: float


class SQLAuditTrendItem(BaseModel):
    date: str
    count: int

class SatisfactionTrendItem(BaseModel):
    date: str
    satisfaction_rate: float

class AuditQualityTrendItem(BaseModel):
    date: str
    query_count: int
    like_count: int
    dislike_count: int
    satisfaction_rate: float | None

class TopQuestionItem(BaseModel):
    question: str
    count: int


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
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None
    repair_count: int = 0
    selected_tables: str | None = None
    selected_table_count: int | None = None
    chema_fallback_used: bool | None = None
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

class RepairCountDistribution(BaseModel):
    no_repair: int = 0
    repaired_once: int = 0
    repaired_twice: int = 0

class AIQualityMetricsResponse(BaseModel):
    total_queries: int

    first_try_success_count: int
    first_try_success_rate: float

    repair_triggered_count: int
    repair_trigger_rate: float

    repair_success_count: int
    repair_success_rate: float

    final_success_count: int
    final_success_rate: float

    average_repair_count: float

    repair_count_distribution: RepairCountDistribution

class AIQualityDailyTrendItem(BaseModel):
    date: str
    total_queries: int

    first_try_success_rate: float
    repair_trigger_rate: float
    final_success_rate: float

    average_total_tokens: float
    token_sample_count: int

class AISchemaQualityAnalysis(BaseModel):
    fallback_count: int
    fallback_rate: float

    smart_selection_count: int

    smart_selection_success_rate: float
    fallback_success_rate: float

    average_selected_table_count: float

class AITokenQualityAnalysis(BaseModel):
    first_try_average_tokens: float
    repaired_once_average_tokens: float
    repaired_twice_average_tokens: float

class AIQualityAnalysisResponse(BaseModel):
    days: int

    daily_trend: list[AIQualityDailyTrendItem]

    schema_analysis: (AISchemaQualityAnalysis)

    token_analysis: (AITokenQualityAnalysis)



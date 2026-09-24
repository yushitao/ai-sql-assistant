from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SQLAuditResponse(BaseModel):
    id: int
    user_id: int
    sql_text: str
    validation_passed: bool
    execution_success: bool
    row_count: int
    execution_time_ms: float | None
    error_message: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

from typing import Any

from pydantic import BaseModel, Field


class SQLValidateRequest(BaseModel):
    sql: str = Field(
        min_length=1,
        max_length=5000,
        examples=[
            ("SELECT status, COUNT(*) AS count FROM test_results GROUP BY status")
        ],
    )


class SQLExecuteRequest(BaseModel):
    sql: str = Field(
        min_length=1,
        max_length=5000,
        examples=[
            ("SELECT product, COUNT(*) AS count FROM test_results GROUP BY product")
        ],
    )


class SQLValidationResponse(BaseModel):
    valid: bool
    message: str
    statement_type: str | None = None
    referenced_tables: list[str] = Field(default_factory=list)


class SQLExecuteResponse(BaseModel):
    success: bool
    columns: list[str]
    rows: list[dict[str, Any]]
    row_count: int
    execution_time_ms: float
    truncated: bool

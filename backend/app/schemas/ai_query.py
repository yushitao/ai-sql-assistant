from typing import Any

from pydantic import BaseModel, Field


class AIQueryRequest(BaseModel):
    question: str = Field(
        min_length=2,
        max_length=1000,
        examples=[
            "统计不同测试状态的数量",
        ],
    )


class GeneratedSQL(BaseModel):
    sql: str = Field(
        min_length=1,
        max_length=5000,
    )

    explanation: str = Field(
        min_length=1,
        max_length=1000,
    )


class AIQueryResponse(BaseModel):
    question: str
    generated_sql: str
    sql_explanation: str
    summary: str

    columns: list[str]
    rows: list[dict[str, Any]]
    row_count: int
    execution_time_ms: float
    truncated: bool

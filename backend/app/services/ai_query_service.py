from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from app.db.session import engine
from app.services.result_summarizer import (
    summarize_query_result,
)
from app.services.schema_service import (
    format_schema_for_llm,
    get_allowed_database_schema,
)
from app.services.sql_executor import execute_readonly_sql
from app.services.sql_generator import generate_sql
from app.services.sql_validator import validate_readonly_sql


class UnsafeGeneratedSQLError(Exception):
    def __init__(
        self,
        message: str,
        generated_sql: str,
    ) -> None:
        super().__init__(message)
        self.generated_sql = generated_sql


@dataclass
class AIQueryResult:
    generated_sql: str
    sql_explanation: str
    summary: str
    columns: list[str]
    rows: list[dict[str, Any]]
    row_count: int
    execution_time_ms: float
    truncated: bool


def process_ai_query(
    db: Session,
    question: str,
) -> AIQueryResult:
    schema_data = get_allowed_database_schema(engine)

    schema_text = format_schema_for_llm(schema_data)

    generated = generate_sql(
        question=question,
        schema_text=schema_text,
    )

    validation = validate_readonly_sql(generated.sql)

    if not validation.valid:
        raise UnsafeGeneratedSQLError(
            message=validation.message,
            generated_sql=generated.sql,
        )

    execution = execute_readonly_sql(
        db=db,
        sql=generated.sql,
    )

    summary = summarize_query_result(
        question=question,
        sql=generated.sql,
        columns=execution.columns,
        rows=execution.rows,
        row_count=execution.row_count,
        truncated=execution.truncated,
    )

    return AIQueryResult(
        generated_sql=generated.sql,
        sql_explanation=generated.explanation,
        summary=summary,
        columns=execution.columns,
        rows=execution.rows,
        row_count=execution.row_count,
        execution_time_ms=execution.execution_time_ms,
        truncated=execution.truncated,
    )

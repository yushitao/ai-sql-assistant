from dataclasses import dataclass
from typing import Any

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.session import engine
from app.schemas.llm import TokenUsage
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
        token_usage: TokenUsage,
    ) -> None:
        super().__init__(message)
        self.generated_sql = generated_sql
        self.token_usage = token_usage.model_copy(deep=True)

class AIQueryExecutionError(Exception):
    def __init__(
        self,
        message: str,
        generated_sql: str,
        token_usage: TokenUsage,
        database_error: str,
    ) -> None:
        super().__init__(message)
        self.generated_sql = generated_sql
        self.token_usage = token_usage.model_copy(deep=True)
        self.database_error=database_error


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
) -> tuple[
    AIQueryResult,
    TokenUsage,
]:
    total_usage = TokenUsage()

    schema_data = get_allowed_database_schema(engine)

    schema_text = format_schema_for_llm(schema_data)

    generated, sql_usage = generate_sql(
        question=question,
        schema_text=schema_text,
    )

    total_usage.add(sql_usage)

    validation = validate_readonly_sql(generated.sql)

    if not validation.valid:
        raise UnsafeGeneratedSQLError(
            message=validation.message,
            generated_sql=generated.sql,
            token_usage=total_usage,
        )

    #验证sql执行错误的临时代码
    #test_sql=("SELECT definitely_missing_column FROM test_results")

    try:
        execution = execute_readonly_sql(
            db=db,
            sql=generated.sql,
            #sql=test_sql,
        )

    except SQLAlchemyError as exc:
        raise AIQueryExecutionError(
            message=(
                "AI生成的SQL执行失败"
            ),
            generated_sql=generated.sql,
            token_usage=total_usage,
            database_error=str(exc)
        ) from exc

    summary, summary_usage = summarize_query_result(
        question=question,
        sql=generated.sql,
        columns=execution.columns,
        rows=execution.rows,
        row_count=execution.row_count,
        truncated=execution.truncated,
    )

    total_usage.add(
        summary_usage
    )

    result = AIQueryResult(
        generated_sql=generated.sql,
        sql_explanation=generated.explanation,
        summary=summary,
        columns=execution.columns,
        rows=execution.rows,
        row_count=execution.row_count,
        execution_time_ms=execution.execution_time_ms,
        truncated=execution.truncated,
    )

    return (
        result,
        total_usage,
    )


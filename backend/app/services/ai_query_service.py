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
from app.services.sql_generator import generate_sql, repair_sql
from app.services.sql_validator import validate_readonly_sql

MAX_SQL_REPAIR_ATTEMPTS = 2


class UnsafeGeneratedSQLError(Exception):
    def __init__(
        self,
        message: str,
        generated_sql: str,
        token_usage: TokenUsage,
        repair_count: int,
    ) -> None:
        super().__init__(message)
        self.generated_sql = generated_sql
        self.token_usage = token_usage.model_copy(deep=True)
        self.repair_count=repair_count

class AIQueryExecutionError(Exception):
    def __init__(
        self,
        message: str,
        generated_sql: str,
        token_usage: TokenUsage,
        database_error: str,
        repair_count: int,
    ) -> None:
        super().__init__(message)
        self.generated_sql = generated_sql
        self.token_usage = token_usage.model_copy(deep=True)
        self.database_error=database_error
        self.repair_count = repair_count


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
    repair_count: int


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

    current_sql = generated.sql
    #验证AI修复功能，临时替代语句,一次错误仅执行这个，两次及以上这个要一起执行
    #current_sql = ("SELECT product_name, COUNT(*) AS test_count FROM test_results GROUP BY product_name")
    
    current_explanation = generated.explanation

    repair_count = 0

    while True:
        validation = validate_readonly_sql(current_sql)

        if not validation.valid:
            raise UnsafeGeneratedSQLError(
                message=validation.message,
                generated_sql=current_sql,
                token_usage=total_usage,
                repair_count=repair_count,
            )

        try:
            execution = execute_readonly_sql(
                db=db,
                sql=current_sql,
                #sql=test_sql,
            )

            break

        except SQLAlchemyError as exc:

            database_error = str(exc)

            print(
                "SQL EXECUTION FAILED:",
                {
                    "repair_count": repair_count,
                    "sql": current_sql,
                    "error": database_error,
                },
            )

            #清理失败SQL留下的事务状态，
            #让下一次修复后的SQL可以继续执行。
            db.rollback()

            if (
                repair_count >= MAX_SQL_REPAIR_ATTEMPTS
            ):
                raise AIQueryExecutionError(
                    message=(
                        "AI生成的SQL经过"
                        "自动修复后仍执行失败"
                    ),
                    generated_sql=current_sql,
                    token_usage=total_usage,
                    database_error=database_error,
                    repair_count=repair_count,
                ) from exc

            repaired, repair_usage = (
                repair_sql(
                    question=question,
                    failed_sql=current_sql,
                    database_error=database_error,
                    schema_text=schema_text,
                )
            )

            print(
                "SQL REPAIRED:",
                {
                    "repair_count": repair_count + 1,
                    "old_sql": current_sql,
                    "new_sql": repaired.sql,
                    "repair_tokens": repair_usage.total_tokens,
                },
            )

            total_usage.add(repair_usage)

            repair_count += 1

            current_sql = repaired.sql
            #验证sql执行两次及以上错误的临时代码
            #current_sql = ("SELECT definitely_missing_column FROM test_results")

            current_explanation = repaired.explanation

            print(
                "SQL REPAIR READY:",
                {
                    "repair_count": repair_count,
                    "sql": current_sql,
                    "total_tokens": total_usage.total_tokens,
                },
            )


            #raise AIQueryExecutionError(
            #    message=(
            #        "AI生成的SQL执行失败"
            #    ),
            #    generated_sql=generated.sql,
            #    token_usage=total_usage,
            #    database_error=str(exc)
            #) from exc

    summary, summary_usage = summarize_query_result(
        question=question,
        sql=current_sql,
        columns=execution.columns,
        rows=execution.rows,
        row_count=execution.row_count,
        truncated=execution.truncated,
    )

    total_usage.add(
        summary_usage
    )

    result = AIQueryResult(
        generated_sql=current_sql,
        sql_explanation=current_explanation,
        summary=summary,
        columns=execution.columns,
        rows=execution.rows,
        row_count=execution.row_count,
        execution_time_ms=execution.execution_time_ms,
        truncated=execution.truncated,
        repair_count = repair_count,
    )

    return (
        result,
        total_usage,
    )


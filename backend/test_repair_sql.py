from sqlalchemy.orm import Session

from app.db.session import engine
from app.services.schema_service import (
    format_schema_for_llm,
    get_allowed_database_schema,
)
from app.services.sql_generator import repair_sql, SQLGenerationError
from app.services.sql_validator import validate_readonly_sql
from app.services.sql_executor import execute_readonly_sql

schema_data = get_allowed_database_schema(engine)

schema_text = format_schema_for_llm(schema_data)

try:
    result, usage = repair_sql(
        question=(
            "统计每个产品的测试数量"
        ),
        failed_sql=(
            "SELECT product_name, "
            "COUNT(*) AS test_count "
            "FROM test_results "
            "GROUP BY product_name"
        ),
        database_error=(
            "no such column: "
            "product_name"
        ),
        schema_text=schema_text,
    )

except SQLGenerationError as exc:
    print(
        "REPAIR FAILED:",
        str(exc)
    )

    raise SystemExit(1)

print("REPAIRED SQL:")

print(result.sql)

print("EXPLANATION")

print(result.explanation)

print(
    "TOKEN USAGE:",
    {
        "prompt": usage.prompt_tokens,
        "completion": usage.completion_tokens,
        "total": usage.total_tokens,
    },
)

validation = (
    validate_readonly_sql(result.sql)
)

print(
    "VALIDATION:",
    {
        "valid": validation.valid,
        "message": validation.message,
    },
)

if validation.valid:
    with Session(engine) as db:
        execution = (
            execute_readonly_sql(
                db=db,
                sql=result.sql,
            )
        )

    print(
        "EXECUTION:",
        {
            "row_count": execution.row_count,
            "columns":execution.columns,
        },
    )


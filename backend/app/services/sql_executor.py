from dataclasses import dataclass
from time import perf_counter
from typing import Any

from fastapi.encoders import jsonable_encoder
from sqlalchemy import text
from sqlalchemy.orm import Session

MAX_RESULT_ROWS = 100


@dataclass
class SQLExecutionResult:
    columns: list[str]
    rows: list[dict[str, Any]]
    row_count: int
    execution_time_ms: float
    truncated: bool


def execute_readonly_sql(
    db: Session,
    sql: str,
) -> SQLExecutionResult:
    start_time = perf_counter()
    result = db.execute(text(sql))
    columns = list(result.keys())

    fetched_rows = result.mappings().fetchmany(MAX_RESULT_ROWS + 1)

    truncated = len(fetched_rows) > MAX_RESULT_ROWS
    visible_rows = fetched_rows[:MAX_RESULT_ROWS]

    rows = [jsonable_encoder(dict(row)) for row in visible_rows]

    execution_time_ms = round(
        (perf_counter() - start_time) * 1000,
        3,
    )

    return SQLExecutionResult(
        columns=columns,
        rows=rows,
        row_count=len(rows),
        execution_time_ms=execution_time_ms,
        truncated=truncated,
    )

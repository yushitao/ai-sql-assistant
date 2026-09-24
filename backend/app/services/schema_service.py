from typing import Any

from sqlalchemy import inspect
from sqlalchemy.engine import Engine

ALLOWED_SCHEMA_TABLES = {
    "test_results",
}


def get_allowed_database_schema(
    engine: Engine,
) -> list[dict[str, Any]]:
    inspector = inspect(engine)

    schema_data: list[dict[str, Any]] = []

    existing_tables = set(inspector.get_table_names())

    for table_name in sorted(ALLOWED_SCHEMA_TABLES):
        if table_name not in existing_tables:
            continue

        columns = inspector.get_columns(table_name)

        schema_data.append(
            {
                "table_name": table_name,
                "columns": [
                    {
                        "name": column["name"],
                        "type": str(column["type"]),
                        "nullable": column["nullable"],
                        "primary_key": bool(column.get("primary_key", False)),
                    }
                    for column in columns
                ],
            }
        )

    return schema_data


def format_schema_for_llm(
    schema_data: list[dict[str, Any]],
) -> str:
    schema_lines: list[str] = []

    for table in schema_data:
        schema_lines.append(f"Table: {table['table_name']}")

        schema_lines.append("Columns:")

        for column in table["columns"]:
            column_parts = [
                f"- {column['name']}",
                column["type"],
            ]

            if not column["nullable"]:
                column_parts.append("NOT NULL")

            if column["primary_key"]:
                column_parts.append("PRIMARY KEY")

            schema_lines.append(" ".join(column_parts))

        schema_lines.append("")

    return "\n".join(schema_lines).strip()

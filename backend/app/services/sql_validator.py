import re
from dataclasses import dataclass, field

import sqlparse

ALLOWED_TABLES = {
    "test_results",
}

FORBIDDEN_TABLES = {
    "users",
    "sql_audits",
    "chat_sessions",
    "chat_messages",
    "sqlite_master",
    "sqlite_schema",
    "sqlite_temp_master",
}

FORBIDDEN_KEYWORDS = {
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "ALTER",
    "CREATE",
    "TRUNCATE",
    "REPLACE",
    "GRANT",
    "REVOKE",
    "ATTACH",
    "DETACH",
    "PRAGMA",
    "VACUUM",
    "ANALYZE",
    "REINDEX",
    "EXEC",
    "EXECUTE",
}


@dataclass
class SQLValidationResult:
    valid: bool
    message: str
    statement_type: str | None = None
    referenced_tables: list[str] = field(default_factory=list)


def normalize_identifier(identifier: str) -> str:
    return (
        identifier.strip()
        .strip('"')
        .strip("'")
        .strip("`")
        .strip("[")
        .strip("]")
        .lower()
    )


def extract_referenced_tables(sql: str) -> set:
    pattern = re.compile(
        r"\b(?:FROM|JOIN)\s+"
        r"([A-Za-z_][A-Za-z0-9_]*"
        r"(?:\.[A-Za-z_][A-Za-z0-9_]*)?)",
        flags=re.IGNORECASE,
    )

    tables: set[str] = set()

    for match in pattern.finditer(sql):
        full_name = match.group(1)
        table_name = full_name.split(".")[-1]
        tables.add(normalize_identifier(table_name))

    return tables


def contains_forbidden_keyword(sql: str) -> str | None:
    parsed = sqlparse.parse(sql)

    if not parsed:
        return None

    for token in parsed[0].flatten():
        token_value = token.value.strip().upper()

        if token_value in FORBIDDEN_KEYWORDS:
            return token_value

    return None


def validate_readonly_sql(sql: str) -> SQLValidationResult:
    cleaned_sql = sql.strip()

    if not cleaned_sql:
        return SQLValidationResult(
            valid=False,
            message="SQL不能为空",
        )

    if len(cleaned_sql) > 5000:
        return SQLValidationResult(
            valid=False,
            message="SQL长度不能超过5000个字符",
        )

    if "--" in cleaned_sql:
        return SQLValidationResult(
            valid=False,
            message="不允许使用单行SQL注释",
        )

    if "/*" in cleaned_sql or "*/" in cleaned_sql:
        return SQLValidationResult(
            valid=False,
            message="不允许使用块SQL注释",
        )

    statements = [item.strip() for item in sqlparse.split(cleaned_sql) if item.strip()]

    if len(statements) != 1:
        return SQLValidationResult(
            valid=False,
            message="一次只允许执行一条SQL语句",
        )

    parsed_statements = sqlparse.parse(statements[0])

    if len(parsed_statements) != 1:
        return SQLValidationResult(
            valid=False,
            message="SQL解析失败",
        )

    statement = parsed_statements[0]
    statement_type = statement.get_type().upper()

    if statement_type != "SELECT":
        return SQLValidationResult(
            valid=False,
            message="只允许执行SELECT查询",
            statement_type=statement_type,
        )

    forbidden_keyword = contains_forbidden_keyword(cleaned_sql)

    if forbidden_keyword is not None:
        return SQLValidationResult(
            valid=False,
            message=f"检测到禁止关键字:{forbidden_keyword}",
            statement_type=statement_type,
        )

    referenced_tables = extract_referenced_tables(cleaned_sql)

    if not referenced_tables:
        return SQLValidationResult(
            valid=False,
            message="SQL中没有检测到允许查询的数据表",
            staement_type=statement_type,
        )

    forbidden_references = referenced_tables & FORBIDDEN_TABLES

    if forbidden_references:
        names = ",".join(sorted(forbidden_references))

        return SQLValidationResult(
            valid=False,
            message=f"禁止访问敏感数据表:{names}",
            statement_type=statement_type,
            referenced_tables=sorted(referenced_tables),
        )

    disallowed_tables = referenced_tables - ALLOWED_TABLES

    if disallowed_tables:
        names = ",".join(sorted(disallowed_tables))

        return SQLValidationResult(
            valid=False,
            message=f"数据表不在允许列表中:{names}",
            statement_type=statement_type,
            referenced_tables=sorted(referenced_tables),
        )

    return SQLValidationResult(
        valid=True,
        message="SQL安全校验通过",
        statement_type=statement_type,
        referenced_tables=sorted(referenced_tables),
    )

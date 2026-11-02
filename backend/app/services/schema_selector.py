import re
from collections.abc import (
    Iterable,
    Mapping,
)
from dataclasses import dataclass
from typing import Any

DEFAULT_MAX_TABLES = 5


TABLE_ALIASES: dict[
    str,
    set[str],
] = {
    "test_results": {
        "test",
        "tests",
        "result",
        "results",
        "测试",
        "测试结果",
        "测试记录",
        "结果",
        "记录",
        "产品",
        "product",
        "站点",
        "station",
        "状态",
        "status",
        "失败",
        "失效",
        "fail",
        "failed",
        "通过",
        "pass",
        "passed",
    },
}


COLUMN_ALIASES: dict[
    str,
    set[str],
] = {
    "product": {
        "product",
        "products",
        "产品",
        "型号",
        "机型",
    },
    "station": {
        "station",
        "stations",
        "站点",
        "工位",
        "测试站",
        "测试站点",
    },
    "test_item": {
        "test_item",
        "item",
        "测试项目",
        "测试项",
        "项目",
    },
    "status": {
        "status",
        "状态",
        "结果",
        "失效",
        "失败",
        "通过",
        "fail",
        "failed",
        "pass",
        "passed",
    },
    "test_time": {
        "test_time",
        "测试时间",
        "测试日期",
        "日期",
        "时间",
    },
    "duration_seconds": {
        "duration",
        "duration_seconds",
        "测试时长",
        "时长",
        "耗时",
        "秒",
    },
    "error_code": {
        "error_code",
        "error",
        "错误码",
        "错误代码",
        "故障代码",
    },
    "error_message": {
        "error_message",
        "错误信息",
        "错误消息",
        "故障信息",
        "失败原因",
    },
    "created_at": {
        "created_at",
        "创建时间",
        "最近",
        "today",
        "date",
        "time",
    },
}


@dataclass(
    frozen=True,
)
class SchemaSelection:
    schema_data: Any
    selected_tables: list[str]
    table_scores: dict[
        str,
        int,
    ]
    used_fallback: bool


def normalize_text(
    value: str,
) -> str:
    normalized = (
        value.strip().lower()
    )

    normalized = re.sub(
        r"[_\-\s]+",
        " ",
        normalized,
    )

    return normalized


def tokenize_text(
    value: str,
) -> set:
    normalized = normalize_text(
        value
    )

    ascii_tokens = set(
        re.findall(
            r"[a-z0-9]+",
            normalized,
        )
    )

    compact_text = re.sub(
        r"\s+",
        "",
        normalized,
    )

    tokens = {
        normalized,
        compact_text,
        *ascii_tokens,
    }

    return {
        token
        for token in tokens
        if token
    }

def extract_column_name(
    column: Any,
) -> str | None:
    if isinstance(
        column,
        str,
    ):
        return column

    if isinstance(
        column,
        Mapping,
    ):
        for key in (
            "name",
            "column_name",
            "column",
        ):
            value = column.get(
                key
            )

            if isinstance(
                value,
                str,
            ):
                return value

    name = getattr(
        column,
        "name",
        None,
    )

    if isinstance(
        name,
        str,
    ):
        return name

    return None


def extract_columns(
    table_schema: Any,
) -> list:
    if isinstance(
        table_schema,
        Mapping,
    ):
        columns = table_schema.get(
            "columns"
        )

        if isinstance(
            columns,
            Iterable,
        ) and not isinstance(
            columns,
            (
                str,
                bytes,
                Mapping,
            ),
        ):
            return list(
                columns
            )

    columns = getattr(
        table_schema,
        "columns",
        None,
    )

    if isinstance(
        columns,
        Iterable,
    ) and not isinstance(
        columns,
        (
            str,
            bytes,
            Mapping,
        ),
    ):
        return list(
            columns
        )

    if isinstance(
        table_schema,
        Iterable,
    ) and not isinstance(
        table_schema,
        (
            str,
            bytes,
            Mapping,
        ),
    ):
        return list(
            table_schema
        )

    return []

def extract_table_items(
    schema_data: Any,
) -> list[
    tuple[
        str,
        Any,
    ]
]:
    if isinstance(
        schema_data,
        list,
    ):
        table_items: list[
            tuple[
                str,
                Any,
            ]
        ] = []

        for table_schema in (
            schema_data
        ):
            if not isinstance(
                table_schema,
                Mapping,
            ):
                continue

            table_name = (
                table_schema.get(
                    "table_name"
                )
            )

            if not isinstance(
                table_name,
                str,
            ):
                continue

            table_items.append(
                (
                    table_name,
                    table_schema,
                )
            )

        return table_items

    if isinstance(
        schema_data,
        Mapping,
    ):
        tables = schema_data.get(
            "table"
        )

        if isinstance(
            tables,
            Mapping,
        ):
            return [
                (
                    str(
                        table_name
                    ),
                    table_schema,
                )
                for (
                    table_name,
                    table_schema,
                ) in tables.items()
            ]

        return [
            (
                str(
                    table_name
                ),
                table_schema,
            )
            for (
                table_name,
                table_schema,
            ) in schema_data.items()
        ]

    tables = getattr(
        schema_data,
        "tables",
        None,
    )

    if isinstance(
        tables,
        Mapping,
    ):
        return [
            (
                str(
                    table_name
                ),
                table_schema,
            )
            for (
                table_name,
                table_schema,
            ) in tables.items()
        ]

    raise TypeError(
        "无法识别Schema数据结构，"
        "请检查schema_service返回值"
    )


def contains_keyword(
    question_text: str,
    keyword: str,
) -> bool:
    normalized_keyword = (
        normalize_text(
            keyword
        )
    )

    if not normalized_keyword:
        return False

    return (
        normalized_keyword
        in question_text
    )


def calculate_table_score(
    question: str,
    table_name: str,
    table_schema: Any,
) -> int:
    question_text = (
        normalize_text(
            question
        )
    )

    question_tokens = (
        tokenize_text(
            question
        )
    )

    normalized_table_name = (
        normalize_text(
            table_name
        )
    )

    table_tokens = (
        tokenize_text(
            table_name
        )
    )

    score = 0

    if (
        normalized_table_name
        in question_text
    ):
        score += 12

    score += (
        len(
            table_tokens
            & question_tokens
        )
        * 6
    )

    for alias in TABLE_ALIASES.get(
        table_name,
        set(),
    ):
        if contains_keyword(
            question_text,
            alias,
        ):
            score += 4

    for column in extract_columns(
        table_schema
    ):
        column_name = (
            extract_column_name(
                column
            )
        )

        if not column_name:
            continue

        normalized_column_name = (
            normalize_text(
                column_name
            )
        )

        column_tokens = (
            tokenize_text(
                column_name
            )
        )

        if (
            normalized_column_name
            in question_text
        ):
            score += 8

        score += (
            len(
                column_tokens
                & question_tokens
            )
            * 5
        )

        for alias in (
            COLUMN_ALIASES.get(
                column_name,
                set(),
            )
        ):
            if contains_keyword(
                question_text,
                alias,
            ):
                score += 3

    return score


def filter_schema_data(
    schema_data: Any,
    selected_tables: list[str],
) -> Any:
    selected_table_set = set(
        selected_tables
    )

    if isinstance(
        schema_data,
        list,
    ):
        return [
            table_schema
            for table_schema
            in schema_data
            if (
                isinstance(
                    table_schema,
                    Mapping,
                )
                and table_schema.get(
                    "table_name"
                )
                in selected_table_set
            )
        ]

    if isinstance(
        schema_data,
        Mapping,
    ):
        tables = schema_data.get(
            "tables"
        )

        if isinstance(
            tables,
            Mapping,
        ):
            filtered_schema = dict(
                schema_data
            )

            filtered_schema[
                "tables"
            ] = {
                table_name:
                table_schema
                for (
                    table_name,
                    table_schema,
                ) in tables.items()
                if (
                    str(
                        table_name
                    )
                    in selected_table_set
                )
            }

            return filtered_schema

        return {
            table_name:
            table_schema
            for (
                table_name,
                table_schema,
            ) in schema_data.items()
            if (
                str(
                    table_name
                )
                in selected_table_set
            )
        }

    raise TypeError(
            "当前Schema结构不支持筛选，"
            "请检查schema_service返回值"
    )


def select_relevant_schema(
    question: str,
    schema_data: Any,
    max_tables: int = (
        DEFAULT_MAX_TABLES
    ),
) -> SchemaSelection:
    if max_tables < 1:
        raise ValueError(
            "max_tables必须大于等于1"
        )

    table_items = (
        extract_table_items(
            schema_data
        )
    )

    if not table_items:
        return SchemaSelection(
            schema_data=schema_data,
            selected_tables=[],
            table_scores={},
            used_fallback=True,
        )

    table_scores = {
        table_name:
        calculate_table_score(
            question=question,
            table_name=(
                table_name
            ),
            table_schema=(
                table_schema
            ),
        )
        for (
            table_name,
            table_schema,
        ) in table_items
    }

    ranked_tables = sorted(
        table_scores.items(),
        key=lambda item: (
            -item[1],
            item[0],
        ),
    )

    positively_matched = [
        table_name
        for (
            table_name,
            score,
        ) in ranked_tables
        if score > 0
    ]

    if not positively_matched:
        fallback_tables = [
            table_name
            for (
                table_name,
                _table_schema,
            ) in table_items
        ]

        return SchemaSelection(
            schema_data=schema_data,
            selected_tables=(
                fallback_tables
            ),
            table_scores=(
                table_scores
            ),
            used_fallback=True,
        )

    selected_tables = (
        positively_matched[
            :max_tables
        ]
    )

    selected_schema = (
        filter_schema_data(
            schema_data=(
                schema_data
            ),
            selected_tables=(
                selected_tables
            ),
        )
    )

    return SchemaSelection(
        schema_data=(
            selected_schema
        ),
        selected_tables=(
            selected_tables
        ),
        table_scores=(
            table_scores
        ),
        used_fallback=False,
    )



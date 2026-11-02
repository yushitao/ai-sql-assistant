from pprint import pprint

from app.db.session import engine
from app.services.schema_selector import (
    select_relevant_schema,
)
from app.services.schema_service import (
    format_schema_for_llm,
    get_allowed_database_schema,
)


schema_data = (
    get_allowed_database_schema(
        engine
    )
)


test_questions = [
    "统计每个产品的失效数量",
    "统计每个测试站点的测试数量",
    "查看失败状态的测试记录",
    "统计最近的测试数据",
    "给我看一些数据",
]


for  question in test_questions:
    selection = (
        select_relevant_schema(
            question=question,
            schema_data=schema_data,
            max_tables=3,
        )
    )

    print(
        "\n"
        "=============================="
    )

    print(
        "QUESTION:",
        question,
    )

    print(
        "SELECTED TABLES:",
        selection.selected_tables,
    )

    print(
        "TABLE SCORES:"
    )

    pprint(
        selection.table_scores
    )

    print(
        "USED FALLBACK:",
        selection.used_fallback,
    )

    print(
        "SELECTED SCHEMA TEXT:"
    )

    print(
        format_schema_for_llm(
            selection.schema_data
        )
    )

mock_schema = [
    {
        "table_name": "test_results",
        "columns":[
            {
                "name": "product",
            },
            {
                "name": "station",
            },
            {
                "name": "status",
            },
        ],
    },
    {
        "table_name": "products",
        "columns": [
            {
                "name": "product_name",
            },
            {
                "name": "category",
            },
        ],
    },
    {
        "table_name": "stations",
        "columns": [
            {
                "name": "station_name",
            },
            {
                "name": "location",
            },
        ],
    }
]


mock_selection = (
    select_relevant_schema(
        question=(
            "统计每个测试站点"
            "的失败数量"
        ),
        schema_data=mock_schema,
        max_tables=2,
    )
)

print(
    "\nMOCK TEST:"
)

print(
    "SELECTED TABLES:",
    mock_selection
    .selected_tables,
)

print(
    "TABLE SCORES:",
    mock_selection.table_scores,
)


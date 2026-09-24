import json
import logging
from typing import Any

from openai import APIError

from app.core.config import settings
from app.services.llm_client import get_llm_client

logger = logging.getLogger(__name__)


def create_fallback_summary(
    row_count: int,
    truncated: bool,
) -> str:
    if row_count == 0:
        return "查询执行成功，但没有找到符合条件的数据。"

    if truncated:
        return f"差选返回前{row_count}条记录，实际结果可能包含更多数据。"

    return f"查询成功，共返回{row_count}条结果。"


def summarize_query_result(
    question: str,
    sql: str,
    columns: list[str],
    rows: list[dict[str, Any]],
    row_count: int,
    truncated: bool,
) -> str:
    if row_count == 0:
        return "查询执行成功，但没有找到符合条件的数据。"

    client = get_llm_client()

    summary_rows = rows[:20]

    result_json = json.dumps(
        {
            "columns": columns,
            "rows": summary_rows,
            "row_count": row_count,
            "truncated": truncated,
        },
        ensure_ascii=False,
        default=str,
    )

    system_prompt = """
你是一名测试数据分析助手。

请根据用户问题、SQL语句和查询结果生成简洁、准确的中文总结。

要求：
1. 只能根据提供的查询结果总结，不得编造数据。
2. 优先给出关键数据、比例、最大值、最小值或趋势。
3. 如果结果被截断，要明确说明只分析了部分数据。
4. 不要重复完整SQL。
5. 不要使用Markdown表格。
6. 总结控制在200个汉字以内。
    """.strip()

    user_prompt = f"""
用户问题:
{question}

执行的SQL：
{sql}

查询结果：
{result_json}
    """.strip()

    try:
        response = client.chat.completions.create(
            model=settings.llm_model,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
            temperature=0,
            max_tokens=400,
        )

        content = response.choices[0].message.content

        if not content:
            return create_fallback_summary(
                row_count=row_count,
                truncated=truncated,
            )

        return content.strip()

    except APIError:
        logger.exception("Failed to summarize SQL query result")

        return create_fallback_summary(
            row_count=row_count,
            truncated=truncated,
        )

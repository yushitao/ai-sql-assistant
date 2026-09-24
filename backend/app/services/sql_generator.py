import json
import logging
import re
from typing import Any

from openai import APIConnectionError, APIError, APITimeoutError
from pydantic import ValidationError

from app.core.config import settings
from app.schemas.ai_query import GeneratedSQL
from app.services.llm_client import get_llm_client

logger = logging.getLogger(__name__)


class SQLGenerationError(Exception):
    pass


def extract_json_object(content: str) -> dict[str, Any]:
    cleaned_content = content.strip()

    if cleaned_content.startswith("```"):
        cleaned_content = re.sub(
            r"^```(?:json)?\s*",
            "",
            cleaned_content,
            flags=re.IGNORECASE,
        )
        cleaned_content = re.sub(
            r"\s*```$",
            "",
            cleaned_content,
        )

    try:
        parsed_content = json.loads(cleaned_content)
    except json.JSONDecodeError as exc:
        first_brace = cleaned_content.find("{")
        last_brace = cleaned_content.rfind("}")

        if first_brace == -1 or last_brace == -1:
            raise SQLGenerationError("大模型没有返回有效的JSON对象") from exc

        json_text = cleaned_content[first_brace : last_brace + 1]

        try:
            parsed_content = json.loads(json_text)
        except json.JSONDecodeError as second_exc:
            raise SQLGenerationError("无法解析大模型返回的JSON") from second_exc

    if not isinstance(parsed_content, dict):
        raise SQLGenerationError("大模型返回的数据不是JSON对象")
    return parsed_content


def build_sql_generation_prompt(
    question: str,
    schema_text: str,
) -> list[dict[str, str]]:
    system_prompt = """
你是一名SQLite数据分析专家。

你的任务是根据用户问题和数据库结构生成一条只读SQL查询。

必须遵守以下规则：
1. 只能生成一条SELECT语句。
2. 只能查询提供的白名单表。
3. 禁止查询users、sql_audits和SQLite系统表。
4. 禁止INSERT、UPDATE、DELETE、DROP、ALTER、CREATE。
5. 禁止PRAGMA、ATTACH、DETACH和多语句。
6. 不要使用SQL注释。
7. 不要使用Markdown代码块。
8. 如果用户问题不够明确，生成最合理、最保守的查询。
9. 除非统计本身只返回少量行，否则使用LIMIT 100。
10. 只返回合法JSON，不要返回其他文字。

必须返回以下JSON格式：

{
    "sql": "生成的SQL",
    "explanation": "对SQL逻辑的简要中文说明"
}
    """.strip()
    user_prompt = f"""
数据库类型：SQLit

允许访问的数据库结构：

{schema_text}

用户问题：

{question}

请生成只读SQL查询。
    """.strip()

    return [
        {
            "role": "system",
            "content": system_prompt,
        },
        {
            "role": "user",
            "content": user_prompt,
        },
    ]


def generate_sql(
    question: str,
    schema_text: str,
) -> GeneratedSQL:
    client = get_llm_client()

    messages = build_sql_generation_prompt(
        question=question,
        schema_text=schema_text,
    )

    try:
        response = client.chat.completions.create(
            model=settings.llm_model,
            messages=messages,
            temperature=0,
            max_tokens=800,
        )
    except APITimeoutError as exc:
        raise SQLGenerationError("大模型请求超市，请稍后重试") from exc
    except APIConnectionError as exc:
        raise SQLGenerationError("无法连接大模型服务，请检查网络") from exc
    except APIError as exc:
        logger.exception("LLM API request failed")

        raise SQLGenerationError("大模型服务调用失败") from exc

    content = response.choices[0].message.content

    if not content:
        raise SQLGenerationError("大模型返回内容为空")

    parsed_content = extract_json_object(content)

    try:
        return GeneratedSQL.model_validate(parsed_content)
    except ValidationError as exc:
        raise SQLGenerationError("大模型返回内容缺少sql或explanation字段") from exc

from functools import lru_cache

from openai import OpenAI

from app.core.config import settings


@lru_cache
def get_llm_client() -> OpenAI:
    return OpenAI(
        api_key=settings.llm_api_key,
        base_url=settings.llm_base_url,
        timeout=settings.llm_timeout_seconds,
        max_retries=settings.llm_max_retries,
        default_headers={
            "HTTP-Referer": settings.app_site_url,
            "X-OperRouter-Title": settings.app_site_name,
        },
    )

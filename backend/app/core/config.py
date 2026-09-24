from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Test Data Assistant"
    app_version: str = "0.1.0"
    api_v1_prefix: str = "/api/v1"
    debug: bool = False

    database_url: str = "sqlite:///./data/ai_sql_assistant.db"

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    llm_api_key: str
    llm_base_url: str = "https://openrouter.ai/api/v1"
    llm_model: str
    llm_timeout_seconds: float = 30.0
    llm_max_retries: int = 1

    app_site_url: str = "http://localhost:8000"
    app_site_name: str = "AI Test Data Assistant"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

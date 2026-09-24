from typing import Any

from fastapi import APIRouter

from app.core.dependencies import CurrentUser
from app.db.session import engine
from app.services.schema_service import get_allowed_database_schema

router = APIRouter(
    prefix="/database",
    tags=["Database Schema"],
)


@router.get(
    "/schema",
    response_model=list[dict[str, Any]],
)
def get_database_schema(
    current_user: CurrentUser,
) -> list[dict[str, Any]]:
    return get_allowed_database_schema(engine)

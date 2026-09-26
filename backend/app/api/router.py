from fastapi import APIRouter

from app.api.routes import (
    ai_queries,
    auth,
    chat_sessions,
    database_schema,
    sql_queries,
    test_results,
    users,
)

api_router = APIRouter()

api_router.include_router(ai_queries.router)
api_router.include_router(auth.router)
api_router.include_router(chat_sessions.router)
api_router.include_router(users.router)
api_router.include_router(test_results.router)
api_router.include_router(sql_queries.router)
api_router.include_router(database_schema.router)

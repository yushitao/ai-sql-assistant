from fastapi import (
    APIRouter,
    HTTPException,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.dependencies import (
    CurrentUser,
    DatabaseSession,
)
from app.models.chat_session import ChatSession
from app.schemas.chat import (
    ChatMessageResponse,
    ChatSessionDetailResponse,
    ChatSessionResponse,
)

router = APIRouter(
    prefix="/chat/sessions",
    tags=["Chat Sessions"],
)


@router.get(
    "",
    response_model=list[ChatSessionResponse],
)
def get_chat_sessions(
    db: DatabaseSession,
    current_user: CurrentUser,
) -> list:
    statement = (
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
    )

    return list(db.scalars(statement).all())


@router.get(
    "/{session_id}",
    response_model=ChatSessionDetailResponse,
)
def get_chat_session(
    session_id: int,
    db: DatabaseSession,
    current_user: CurrentUser,
) -> ChatSessionDetailResponse:
    statement = (
        select(ChatSession)
        .options(selectinload(ChatSession.messages))
        .where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
    )

    chat_session = db.scalar(statement)

    if chat_session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在",
        )

    messages = [
        ChatMessageResponse(
            id=message.id,
            session_id=message.session_id,
            question=message.question,
            generated_sql=(message.generated_sql),
            sql_explanation=(message.sql_explanation),
            summary=message.summary,
            columns=message.columns_data,
            rows=message.rows_data,
            row_count=message.row_count,
            execution_time_ms=(message.execution_time_ms),
            truncated=message.truncated,
            created_at=message.created_at,
        )
        for message in chat_session.messages
    ]

    return ChatSessionDetailResponse(
        id=chat_session.id,
        title=chat_session.title,
        created_at=chat_session.created_at,
        updated_at=chat_session.updated_at,
        messages=messages,
    )



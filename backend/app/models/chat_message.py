from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.chat_session import ChatSession


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    session_id: Mapped[int] = mapped_column(
        ForeignKey(
            "chat_sessions.id",
            ondelete="CASCADE",
        ),
        index=True,
        nullable=False,
    )

    question: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    generated_sql: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    sql_explanation: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    columns_data: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    rows_data: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON,
        nullable=False,
    )

    row_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    execution_time_ms: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    truncated: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False,
    )

    session: Mapped["ChatSession"] = relationship(
        back_populates="messages",
    )

from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.db.base import Base


class FeedbackType(
    str,
    Enum,
):
    LIKE = "LIKE"
    DISLIKE = "DISLIKE"

class QueryFeedback(Base):
    __tablename__ = "query_feedback"

    id: Mapped[int] = mapped_column(
            primary_key=True,
        )

    user_id: Mapped[int] = mapped_column(
            ForeignKey("users.id"),
            nullable=False,
        )

    message_id: Mapped[int] = mapped_column(
            ForeignKey("chat_messages.id"),
            nullable=False,
        )

    feedback_type: Mapped[FeedbackType] = mapped_column(
        SAEnum(FeedbackType),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


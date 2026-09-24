from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SQLAudit(Base):
    __tablename__ = "sql_audits"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        index=True,
        nullable=False,
    )

    sql_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    validation_passed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    execution_success: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    row_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    execution_time_ms: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False,
    )

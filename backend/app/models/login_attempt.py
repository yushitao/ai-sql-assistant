from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    Integer,
    String,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.db.base import Base


class LoginAttempt(Base):
    __tablename__ = "login_attempts"
    id: Mapped[int] = (
        mapped_column(
            primary_key=True,
        )
    )
    username: Mapped[str] = (
        mapped_column(
            String(255),
            index=True,
        )
    )
    failed_count: Mapped[int] = (
        mapped_column(
            Integer,
            default=0,
        )
    )
    locked_until: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime(),
        nullable=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone = True),
        default=lambda:
        datetime.now(timezone.utc),
    )


from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TestStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    SKIP = "SKIP"


class TestResult(Base):
    __tablename__ = "test_results"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    test_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
        nullable=False,
    )

    product: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )

    station: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )

    test_item: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )

    status: Mapped[TestStatus] = mapped_column(
        SqlEnum(TestStatus),
        index=True,
        nullable=False,
    )

    duration_seconds: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    error_code: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    error_message: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

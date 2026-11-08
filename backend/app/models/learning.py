from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class LearningProfile(Base):
    __tablename__ = "learning_profiles"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        primary_key=True,
    )

    target_band: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=7.0,
    )

    test_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="academic",
    )

    exam_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    daily_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=20,
    )

    focus_skill: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="writing",
    )

    # Reserved for a verified payment webhook.
    # Students cannot set this through the dashboard.
    paid_until: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )
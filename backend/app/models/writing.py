from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class WritingQuestion(Base):
    __tablename__ = "writing_questions"

    id: Mapped[int] = mapped_column(primary_key=True)

    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    task: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )

    test_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    prompt: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    points: Mapped[list[str] | None] = mapped_column(
        JSON,
        nullable=True,
    )

    visual_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="draft",
        nullable=False,
        index=True,
    )

    source_type: Mapped[str] = mapped_column(
        String(30),
        default="original",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )


class WritingAttempt(Base):
    __tablename__ = "writing_attempts"

    __table_args__ = (
        Index(
            "ix_writing_attempts_user_created",
            "user_id",
            "created_at",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    question_id: Mapped[int] = mapped_column(
        ForeignKey("writing_questions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    answer: Mapped[str] = mapped_column(
        Text,
        default="",
        nullable=False,
    )

    word_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    elapsed_seconds: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="draft",
        nullable=False,
    )

    feedback: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
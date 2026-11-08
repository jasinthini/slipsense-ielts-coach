from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, func, select
from sqlalchemy.orm import Mapped, Session, mapped_column

from app.database import Base, get_db
from app.models.user import User
from app.routers.auth import get_current_user


Skill = Literal["speaking", "reading", "listening"]

router = APIRouter(prefix="/practice-history", tags=["Practice History"])


class PracticeAttempt(Base):
    __tablename__ = "practice_attempts"

    __table_args__ = (
        Index(
            "ix_practice_attempts_user_skill_created",
            "user_id",
            "skill",
            "created_at",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    skill: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    elapsed_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_questions: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )


class PracticeAttemptCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    skill: Skill
    title: str = Field(min_length=1, max_length=200)
    elapsed_seconds: int = Field(default=0, ge=0, le=604800)
    score: int | None = Field(default=None, ge=0)
    total_questions: int | None = Field(default=None, ge=1, le=100)

    @model_validator(mode="after")
    def validate_result(self):
        if self.skill == "speaking":
            if self.score is not None or self.total_questions is not None:
                raise ValueError("Speaking practice does not have a quiz score.")
        else:
            if self.score is None or self.total_questions is None:
                raise ValueError("Reading and Listening require a score and question count.")

            if self.score > self.total_questions:
                raise ValueError("Score cannot exceed the question count.")

        return self


class PracticeAttemptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    skill: Skill
    title: str
    elapsed_seconds: int
    score: int | None
    total_questions: int | None
    created_at: datetime


@router.post(
    "/attempts",
    response_model=PracticeAttemptResponse,
    status_code=status.HTTP_201_CREATED,
)
def save_practice_attempt(
    data: PracticeAttemptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attempt = PracticeAttempt(
        user_id=current_user.id,
        **data.model_dump(),
    )

    db.add(attempt)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(attempt)
    return attempt


@router.get("/attempts", response_model=list[PracticeAttemptResponse])
def get_practice_attempts(
    skill: Skill | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    statement = select(PracticeAttempt).where(
        PracticeAttempt.user_id == current_user.id,
    )

    if skill is not None:
        statement = statement.where(PracticeAttempt.skill == skill)

    statement = (
        statement
        .order_by(PracticeAttempt.created_at.desc(), PracticeAttempt.id.desc())
        .offset(offset)
        .limit(limit)
    )

    return list(db.scalars(statement).all())
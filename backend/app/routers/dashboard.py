from datetime import date, datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.learning import LearningProfile
from app.models.user import User
from app.models.writing import WritingAttempt, WritingQuestion
from app.routers.auth import get_current_user


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


class GoalInput(BaseModel):
    target_band: float = Field(ge=1, le=9)
    test_type: Literal["academic", "general"]
    exam_date: date | None = None
    daily_minutes: int = Field(ge=5, le=180)
    focus_skill: Literal["writing", "speaking", "reading", "listening"]

    @field_validator("target_band")
    @classmethod
    def validate_band(cls, value):
        if value * 2 != int(value * 2):
            raise ValueError("Choose a whole or half band, such as 6 or 6.5.")
        return value


class SettingsInput(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)

    @field_validator("full_name")
    @classmethod
    def clean_name(cls, value):
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Enter at least two characters.")
        return value


def database_now(db: Session) -> datetime:
    # Uses the same database clock as users.created_at.
    return db.scalar(select(func.now()))


def access_details(db: Session, user: User):
    now = database_now(db)
    trial_end = user.created_at + timedelta(days=3)
    profile = db.get(LearningProfile, user.id)

    paid_until = profile.paid_until if profile else None
    paid_active = paid_until is not None and paid_until > now
    remaining = max(0, int((trial_end - now).total_seconds()))

    return {
        "trial_active": remaining > 0,
        "remaining_seconds": remaining,
        "trial_ends_at": trial_end.isoformat(),
        "paid_active": paid_active,
        "can_practice": remaining > 0 or paid_active,
    }


def goal_response(profile):
    if profile is None:
        return None

    return {
        "target_band": profile.target_band,
        "test_type": profile.test_type,
        "exam_date": profile.exam_date,
        "daily_minutes": profile.daily_minutes,
        "focus_skill": profile.focus_skill,
    }


def attempt_response(attempt, question):
    return {
        "id": attempt.id,
        "question_id": attempt.question_id,
        "title": question.title,
        "category": question.category,
        "status": attempt.status,
        "word_count": attempt.word_count,
        "updated_at": attempt.updated_at,
        "has_feedback": attempt.feedback is not None,
    }


@router.get("/overview")
def get_overview(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    recent_statement = (
        select(WritingAttempt, WritingQuestion)
        .join(
            WritingQuestion,
            WritingQuestion.id == WritingAttempt.question_id,
        )
        .where(WritingAttempt.user_id == user.id)
        .order_by(
            WritingAttempt.updated_at.desc(),
            WritingAttempt.id.desc(),
        )
        .limit(5)
    )

    draft_statement = (
        select(WritingAttempt, WritingQuestion)
        .join(
            WritingQuestion,
            WritingQuestion.id == WritingAttempt.question_id,
        )
        .where(
            WritingAttempt.user_id == user.id,
            WritingAttempt.status == "draft",
        )
        .order_by(
            WritingAttempt.updated_at.desc(),
            WritingAttempt.id.desc(),
        )
        .limit(3)
    )

    profile = db.get(LearningProfile, user.id)

    return {
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
        },
        "access": access_details(db, user),
        "goal": goal_response(profile),
        "recent_attempts": [
            attempt_response(attempt, question)
            for attempt, question in db.execute(recent_statement).all()
        ],
        "drafts": [
            attempt_response(attempt, question)
            for attempt, question in db.execute(draft_statement).all()
        ],
    }


@router.put("/goal")
def save_goal(
    data: GoalInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.exam_date and data.exam_date < database_now(db).date():
        raise HTTPException(
            status_code=422,
            detail="Choose today or a future exam date.",
        )

    user_id = user.id

    profile = db.scalar(
        select(LearningProfile)
        .where(LearningProfile.user_id == user_id)
        .with_for_update()
    )

    if profile is None:
        profile = LearningProfile(user_id=user_id)
        db.add(profile)

    for key, value in data.model_dump().items():
        setattr(profile, key, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Your goal changed in another request. Refresh and try again.",
        ) from None
    except Exception:
        db.rollback()
        raise

    db.refresh(profile)
    return goal_response(profile)


@router.put("/settings")
def save_settings(
    data: SettingsInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user.full_name = data.full_name

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(user)

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
    }


def require_writing_access(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Saved answers/history remain readable after the trial.
    needs_access = (
        request.url.path.rstrip("/").endswith("/questions")
        or request.method in {"POST", "PUT", "PATCH", "DELETE"}
    )

    if needs_access and not access_details(db, user)["can_practice"]:
        raise HTTPException(
            status_code=403,
            detail="Your free trial has ended. Open Plans & Billing.",
        )
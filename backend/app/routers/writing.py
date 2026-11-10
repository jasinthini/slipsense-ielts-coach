import logging
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.writing import WritingAttempt, WritingQuestion
from app.routers.auth import get_current_user
from app.schemas.writing import (
    WritingAttemptCreate,
    WritingAttemptResponse,
    WritingQuestionResponse,
)
from app.services.writing_feedback import generate_writing_feedback


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/writing",
    tags=["Writing Practice"],
)

WritingCategory = Literal[
    "discussion", "opinion", "letters", "bar", "line",
    "pie", "map", "process", "table",
]


def _feedback_input(
    question: WritingQuestion,
    data: WritingAttemptCreate,
) -> dict:
    prompt = question.prompt

    if question.visual_url:
        prompt += (
            "\n\nThe visual is not included in this feedback request. "
            "Give feedback on language and organisation. "
            "Do not judge whether figures or visual details are accurate."
        )

    return {
        "question": prompt,
        "answer": data.answer,
        "task": question.task,
        "category": question.category,
        "points": question.points,
        "include_tamil": True,
    }


def _save_attempt(
    db: Session,
    attempt: WritingAttempt,
    feedback_input: dict | None = None,
) -> WritingAttempt:
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    if feedback_input is not None:
        try:
            feedback = generate_writing_feedback(**feedback_input)
        except Exception as error:
            logger.warning(
                "Writing feedback generation failed: %s",
                type(error).__name__,
            )
        else:
            try:
                attempt.feedback = feedback
                db.commit()
            except Exception as error:
                db.rollback()
                logger.error(
                    "Could not save writing feedback: %s",
                    type(error).__name__,
                )

    db.refresh(attempt)
    return attempt


@router.get("/questions", response_model=list[WritingQuestionResponse])
def get_questions(
    category: WritingCategory,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    statement = (
        select(WritingQuestion)
        .where(
            WritingQuestion.category == category,
            WritingQuestion.status == "published",
        )
        .order_by(WritingQuestion.id)
        .offset(offset)
        .limit(limit)
    )

    return list(db.scalars(statement).all())


@router.post(
    "/attempts",
    response_model=WritingAttemptResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_attempt(
    data: WritingAttemptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    question = db.scalar(
        select(WritingQuestion).where(
            WritingQuestion.id == data.question_id,
            WritingQuestion.status == "published",
        )
    )

    if question is None:
        raise HTTPException(status_code=404, detail="Writing question not found.")

    feedback_input = None

    if data.status == "submitted":
        if not data.answer.strip():
            raise HTTPException(
                status_code=422,
                detail="Write an answer before submitting.",
            )

        feedback_input = _feedback_input(question, data)

    attempt = WritingAttempt(
        user_id=current_user.id,
        question_id=question.id,
        answer=data.answer,
        word_count=len(data.answer.split()),
        elapsed_seconds=data.elapsed_seconds,
        status=data.status,
    )

    db.add(attempt)
    return _save_attempt(db, attempt, feedback_input)


@router.get("/attempts", response_model=list[WritingAttemptResponse])
def get_my_attempts(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    statement = (
        select(WritingAttempt)
        .where(WritingAttempt.user_id == current_user.id)
        .order_by(
            WritingAttempt.created_at.desc(),
            WritingAttempt.id.desc(),
        )
        .offset(offset)
        .limit(limit)
    )

    return list(db.scalars(statement).all())


@router.get("/attempts/{attempt_id}", response_model=WritingAttemptResponse)
def get_my_attempt(
    attempt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attempt = db.scalar(
        select(WritingAttempt).where(
            WritingAttempt.id == attempt_id,
            WritingAttempt.user_id == current_user.id,
        )
    )

    if attempt is None:
        raise HTTPException(status_code=404, detail="Writing attempt not found.")

    return attempt


@router.put("/attempts/{attempt_id}", response_model=WritingAttemptResponse)
def update_my_draft(
    attempt_id: int,
    data: WritingAttemptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attempt = db.scalar(
        select(WritingAttempt)
        .where(
            WritingAttempt.id == attempt_id,
            WritingAttempt.user_id == current_user.id,
        )
        .with_for_update()
    )

    if attempt is None:
        raise HTTPException(status_code=404, detail="Writing attempt not found.")

    if attempt.status != "draft":
        raise HTTPException(
            status_code=409,
            detail="Submitted answers cannot be changed. Start a new attempt.",
        )

    if attempt.question_id != data.question_id:
        raise HTTPException(
            status_code=422,
            detail="The question cannot be changed for this attempt.",
        )

    feedback_input = None

    if data.status == "submitted":
        if not data.answer.strip():
            raise HTTPException(
                status_code=422,
                detail="Write an answer before submitting.",
            )

        question = db.get(WritingQuestion, attempt.question_id)

        if question is None:
            raise HTTPException(
                status_code=404,
                detail="Writing question not found.",
            )

        feedback_input = _feedback_input(question, data)

    attempt.answer = data.answer
    attempt.word_count = len(data.answer.split())
    attempt.elapsed_seconds = data.elapsed_seconds
    attempt.status = data.status

    return _save_attempt(db, attempt, feedback_input)


@router.get(
    "/attempts/{attempt_id}/question",
    response_model=WritingQuestionResponse,
)
def get_my_attempt_question(
    attempt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    question = db.scalar(
        select(WritingQuestion)
        .join(
            WritingAttempt,
            WritingAttempt.question_id == WritingQuestion.id,
        )
        .where(
            WritingAttempt.id == attempt_id,
            WritingAttempt.user_id == current_user.id,
        )
    )

    if question is None:
        raise HTTPException(
            status_code=404,
            detail="Writing attempt or question not found.",
        )

    return question
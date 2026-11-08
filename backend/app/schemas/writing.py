from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class WritingQuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: str
    task: str
    test_type: str
    title: str
    prompt: str
    points: list[str] | None = None
    visual_url: str | None = None


class WritingAttemptCreate(BaseModel):
    question_id: int = Field(gt=0)
    answer: str = Field(default="", max_length=50000)
    elapsed_seconds: int = Field(default=0, ge=0, le=604800)
    status: Literal["draft", "submitted"] = "draft"


class WritingAttemptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    question_id: int
    answer: str
    word_count: int
    elapsed_seconds: int
    status: str
    feedback: dict | None = None
    created_at: datetime
    updated_at: datetime
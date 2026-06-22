"""
Survey Models
"""
from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, Field


class SurveyQuestion(BaseModel):
    id: str
    type: str           # RATING | MCQ | TEXT
    text: str
    options: Optional[List[str]] = None   # for MCQ only
    required: bool = True


class SurveyCreate(BaseModel):
    title: str
    description: Optional[str] = None
    questions: List[SurveyQuestion]
    wardId: Optional[str] = None          # None = all wards


class SurveyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None          # DRAFT | ACTIVE | CLOSED
    wardId: Optional[str] = None


class SurveyAnswer(BaseModel):
    questionId: str
    value: Any                            # int for RATING, str for MCQ/TEXT


class SurveyResponseCreate(BaseModel):
    answers: List[SurveyAnswer]

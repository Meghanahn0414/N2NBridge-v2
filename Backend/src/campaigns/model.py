"""
Campaign Model and Schemas
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class CampaignStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class CampaignType(str, Enum):
    AWARENESS = "Awareness"
    HEALTH = "Health"
    INFRASTRUCTURE = "Infrastructure"
    EDUCATION = "Education"
    WELFARE = "Welfare"
    OTHER = "Other"


class CampaignRepeat(str, Enum):
    ONE_TIME = "One-time"
    DAILY = "Daily"
    WEEKLY = "Weekly"
    MONTHLY = "Monthly"


class CampaignCreate(BaseModel):
    name: str
    type: Optional[str] = "Awareness"
    message: Optional[str] = None
    status: Optional[str] = "DRAFT"      # DRAFT | ACTIVE — caller sets ACTIVE to publish immediately
    targetAudience: Optional[List[str]] = []
    coverImage: Optional[str] = None
    wardId: Optional[str] = None          # target a specific ward; None = all citizens
    channels: Optional[List[str]] = []
    startDate: Optional[datetime] = None
    repeat: Optional[str] = "One-time"
    reach: Optional[int] = 0
    engagement: Optional[float] = 0
    roi: Optional[float] = 0


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    message: Optional[str] = None
    coverImage: Optional[str] = None
    status: Optional[CampaignStatus] = None
    targetAudience: Optional[List[str]] = None
    wardId: Optional[str] = None
    channels: Optional[List[str]] = None
    startDate: Optional[datetime] = None
    repeat: Optional[str] = None
    reach: Optional[int] = None
    engagement: Optional[float] = None
    roi: Optional[float] = None


class CampaignResponse(BaseModel):
    id: str = Field(alias="_id")
    name: str
    type: str = "Awareness"
    status: str = "DRAFT"
    message: Optional[str] = None
    targetAudience: List[str] = []
    coverImage: Optional[str] = None
    wardId: Optional[str] = None
    channels: List[str] = []
    startDate: Optional[datetime] = None
    repeat: str = "One-time"
    reach: int = 0
    engagement: float = 0
    roi: float = 0
    createdAt: datetime
    updatedAt: datetime

    @field_validator('startDate', mode='before')
    @classmethod
    def empty_str_to_none(cls, v):
        if v == '' or v is None:
            return None
        return v

    model_config = ConfigDict(populate_by_name=True)

"""
Emergency SOS Model and Schemas
"""
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class EmergencyType(str, Enum):
    """Emergency types"""
    MEDICAL = "Medical"
    FIRE = "Fire"
    FLOOD = "Flood"
    ACCIDENT = "Accident"
    OTHER = "Other"


class EmergencyStatus(str, Enum):
    """Emergency status"""
    REPORTED = "REPORTED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"


class EmergencySOSBase(BaseModel):
    """Base emergency SOS schema"""
    type: EmergencyType
    details: str


class EmergencySOSCreate(EmergencySOSBase):
    """Emergency SOS creation"""
    citizenId: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    shareLocation: bool = False


class EmergencySOSResponse(BaseModel):
    """Emergency SOS response"""
    id: str = Field(alias="_id")
    sosTicketId: str
    citizenId: str
    type: str
    details: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    shareLocation: bool
    status: str
    createdAt: datetime
    acknowledgedBy: Optional[list] = []
    resolvedAt: Optional[datetime] = None
    resolvedBy: Optional[str] = None

    class Config:
        populate_by_name = True


class EmergencySOSUpdate(BaseModel):
    """Emergency SOS update"""
    status: Optional[EmergencyStatus] = None
    acknowledgedBy: Optional[str] = None
    resolvedBy: Optional[str] = None

"""
Event Model and Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class EventStatus(str, Enum):
    """Event status"""
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ONGOING = "ONGOING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class EventBase(BaseModel):
    """Base event schema"""
    eventName: str
    description: str
    eventType: str
    venue: str
    eventDate: datetime
    capacity: int
    qrEnabled: bool = True


class EventCreate(EventBase):
    """Event creation"""
    organizerId: str
    wardId: Optional[str] = None


class EventUpdate(BaseModel):
    """Event update"""
    eventName: Optional[str] = None
    description: Optional[str] = None
    eventDate: Optional[datetime] = None
    venue: Optional[str] = None
    capacity: Optional[int] = None


class EventResponse(BaseModel):
    """Event response"""
    id: str = Field(alias="_id")
    eventName: str
    description: str
    eventType: str
    venue: str
    eventDate: datetime
    organizerId: str
    capacity: int
    qrEnabled: bool
    registrationCount: int
    status: Optional[str] = "DRAFT"
    wardId: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        populate_by_name = True


class EventRegistrationCreate(BaseModel):
    """Event registration creation"""
    eventId: Optional[str] = None
    citizenId: str


class EventRegistrationResponse(BaseModel):
    """Event registration response"""
    id: str = Field(alias="_id")
    eventId: str
    citizenId: Optional[str] = None
    qrCode: Optional[str] = None
    attendanceStatus: str
    registeredAt: datetime
    
    class Config:
        populate_by_name = True

"""
Complaint Model and Schemas
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class ComplaintCategory(str, Enum):
    """Complaint category"""
    ROADS = "Roads"
    WATER = "Water"
    WASTE = "Waste"
    ELECTRICITY = "Electricity"
    PARKS = "Parks"
    DRAINAGE = "Drainage"
    STREET_LIGHT = "Street Light"
    OTHER = "Other"


class ComplaintPriority(str, Enum):
    """Complaint priority"""
    LOW = "Low"
    NORMAL = "Normal"
    HIGH = "High"


class ComplaintStatus(str, Enum):
    """Complaint status"""
    NEW = "NEW"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class ComplaintBase(BaseModel):
    """Base complaint schema"""
    category: ComplaintCategory
    description: str
    location: str
    ward: int = Field(ge=1, le=50)
    priority: ComplaintPriority = ComplaintPriority.NORMAL


class ComplaintCreate(ComplaintBase):
    """Complaint creation"""
    citizenId: str
    photos: List[str] = []  # base64 encoded images
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contactPhone: Optional[str] = None


class ComplaintResponse(BaseModel):
    """Complaint response"""
    id: str = Field(alias="_id")
    complaintId: str
    citizenId: str
    category: str
    description: str
    location: str
    ward: int
    priority: str
    status: str
    photos: List[str] = []
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contactPhone: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True


class ComplaintUpdate(BaseModel):
    """Complaint update"""
    status: Optional[ComplaintStatus] = None
    priority: Optional[ComplaintPriority] = None
    remarks: Optional[str] = None

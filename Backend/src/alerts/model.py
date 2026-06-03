"""
Alert Model and Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class AlertType(str, Enum):
    """Alert types"""
    EMERGENCY = "EMERGENCY"
    SECURITY = "SECURITY"
    HEALTH = "HEALTH"
    INFRASTRUCTURE = "INFRASTRUCTURE"
    POLLUTION = "POLLUTION"
    OTHER = "OTHER"


class AlertPriority(str, Enum):
    """Alert priority"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AlertStatus(str, Enum):
    """Alert status"""
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class AlertBase(BaseModel):
    """Base alert schema"""
    alertType: AlertType
    priority: AlertPriority
    description: str
    location: Optional[dict] = None  # GeoJSON Point


class AlertCreate(AlertBase):
    """Alert creation"""
    citizenId: str
    mediaAttachments: Optional[List[str]] = []


class AlertUpdate(BaseModel):
    """Alert update"""
    status: Optional[AlertStatus] = None
    assignedTo: Optional[str] = None
    priority: Optional[AlertPriority] = None


class AlertResponse(BaseModel):
    """Alert response"""
    id: str = Field(alias="_id")
    alertNumber: str
    citizenId: str
    alertType: str
    priority: str
    description: str
    location: Optional[dict] = None
    mediaAttachments: List[str] = []
    assignedTo: Optional[str] = None
    status: str
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        populate_by_name = True

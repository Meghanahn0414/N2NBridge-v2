"""
Alert Model and Schemas
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, model_validator


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

    @model_validator(mode="before")
    @classmethod
    def normalize_alert_payload(cls, values):
        if not isinstance(values, dict):
            return values

        normalized = dict(values)

        if "alertType" not in normalized and "type" in normalized:
            normalized["alertType"] = normalized["type"]

        if "description" not in normalized and "message" in normalized:
            normalized["description"] = normalized["message"]

        if "description" not in normalized and "body" in normalized:
            normalized["description"] = normalized["body"]

        if "priority" not in normalized and "severity" in normalized:
            normalized["priority"] = normalized["severity"]

        if isinstance(normalized.get("priority"), str):
            normalized["priority"] = normalized["priority"].upper()

        if isinstance(normalized.get("alertType"), str):
            normalized["alertType"] = normalized["alertType"].upper()

        return normalized


class AlertCreate(AlertBase):
    """Alert creation"""
    citizenId: str
    mediaAttachments: Optional[List[str]] = Field(default_factory=list)


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

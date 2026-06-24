"""
Notification Model and Schemas
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class NotificationCreate(BaseModel):
    """Notification creation"""
    userId: str
    title: str
    body: str
    type: str


class NotificationResponse(BaseModel):
    """Notification response"""
    id: str = Field(alias="_id")
    userId: Optional[str] = None
    title: Optional[str] = ''
    body: Optional[str] = ''
    type: Optional[str] = 'INFO'
    isRead: Optional[bool] = False
    createdAt: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)


class NotificationUpdate(BaseModel):
    """Notification update"""
    isRead: bool

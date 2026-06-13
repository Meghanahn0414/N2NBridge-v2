"""
Notification Model and Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


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

    class Config:
        populate_by_name = True


class NotificationUpdate(BaseModel):
    """Notification update"""
    isRead: bool

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
    userId: str
    title: str
    body: str
    type: str
    isRead: bool
    createdAt: datetime
    
    class Config:
        populate_by_name = True


class NotificationUpdate(BaseModel):
    """Notification update"""
    isRead: bool

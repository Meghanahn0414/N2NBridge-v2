"""
Task Model and Schemas
"""
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class TaskStatus(str, Enum):
    """Task status"""
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    ON_HOLD = "ON_HOLD"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class TaskPriority(str, Enum):
    """Task priority"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class TaskBase(BaseModel):
    """Base task schema"""
    grievanceId: str
    priority: TaskPriority = TaskPriority.MEDIUM
    dueDate: datetime


class TaskCreate(TaskBase):
    """Task creation"""
    assignedBy: str
    assignedTo: str


class TaskUpdate(BaseModel):
    """Task update"""
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    dueDate: Optional[datetime] = None
    remarks: Optional[str] = None


class TaskResponse(BaseModel):
    """Task response"""
    id: str = Field(alias="_id")
    grievanceId: str
    assignedBy: str
    assignedTo: str
    priority: str
    dueDate: datetime
    status: str
    remarks: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    
    model_config = ConfigDict(populate_by_name=True)


class FieldReportCreate(BaseModel):
    """Field report creation"""
    taskId: str
    officerId: str
    reportText: str
    gpsLocation: Optional[dict] = None


class FieldReportResponse(BaseModel):
    """Field report response"""
    id: str = Field(alias="_id")
    taskId: str
    officerId: str
    reportText: str
    photos: list = []
    gpsLocation: Optional[dict] = None
    submittedAt: datetime
    
    model_config = ConfigDict(populate_by_name=True)

"""
Grievance Model and Schemas
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class GrievanceStatus(str, Enum):
    """Grievance status"""
    NEW = "NEW"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    ON_HOLD = "ON_HOLD"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"
    REJECTED = "REJECTED"


class GrievancePriority(str, Enum):
    """Grievance priority"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class GrievanceCategory(str, Enum):
    """Grievance category"""
    ROAD_ISSUE = "ROAD_ISSUE"
    WATER_SUPPLY = "WATER_SUPPLY"
    ELECTRICITY = "ELECTRICITY"
    GARBAGE = "GARBAGE"
    NOISE_POLLUTION = "NOISE_POLLUTION"
    OTHER = "OTHER"

class AttachmentSchema(BaseModel):
    """Attachment schema"""
    fileName: Optional[str] = None
    fileUrl: Optional[str] = None
    uploadedAt: Optional[datetime] = None


class HistoryEntry(BaseModel):
    """History entry"""
    oldStatus: Optional[str] = None
    newStatus: Optional[str] = None
    remarks: Optional[str] = None
    updatedBy: Optional[str] = None
    createdAt: Optional[datetime] = None


class FeedbackSchema(BaseModel):
    """Feedback schema"""
    rating: int = Field(ge=1, le=5)
    comments: str
    submittedAt: datetime


class AIAnalysisSchema(BaseModel):
    """AI Analysis schema"""
    predictedCategory: Optional[str] = None
    urgencyScore: Optional[float] = None
    sentimentScore: Optional[float] = None
    analyzedAt: Optional[datetime] = None


class GrievanceBase(BaseModel):
    """Base grievance schema"""
    category: GrievanceCategory
    description: str
    address: str
    wardId: Optional[str] = None
    constituencyId: Optional[str] = None
    priority: GrievancePriority = GrievancePriority.MEDIUM


class GrievanceCreate(BaseModel):
    """Grievance creation"""
    citizenId: str
    categoryId: str
    description: str
    address: str
    wardId: Optional[str] = None
    priority: str = "MEDIUM"
    gpsLocation: Optional[dict] = None


class GrievanceUpdate(BaseModel):
    """Grievance update"""
    status: Optional[GrievanceStatus] = None
    priority: Optional[GrievancePriority] = None
    assignedOfficerId: Optional[str] = None
    remarks: Optional[str] = None


class GrievanceResponse(BaseModel):
    """Grievance response"""
    id: str = Field(alias="_id")
    complaintNumber: Optional[str] = None
    citizenId: Optional[str] = None
    categoryId: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    wardId: Optional[str] = None
    constituencyId: Optional[str] = None
    priority: Optional[str] = "MEDIUM"
    status: Optional[str] = "NEW"
    escalationLevel: Optional[int] = 0
    assignedOfficerId: Optional[str] = None
    attachments: Optional[List[AttachmentSchema]] = []
    history: Optional[List[HistoryEntry]] = []
    feedback: Optional[FeedbackSchema] = None
    aiAnalysis: Optional[AIAnalysisSchema] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    createdBy: Optional[str] = None
    updatedBy: Optional[str] = None
    isDeleted: Optional[bool] = False
    citizenName: Optional[str] = None

    class Config:
        populate_by_name = True


class GrievanceCategoryCreate(BaseModel):
    """Grievance category creation"""
    categoryName: str
    description: str


class GrievanceCategoryResponse(BaseModel):
    """Grievance category response"""
    id: str = Field(alias="_id")
    categoryName: str
    description: str
    isActive: bool
    
    class Config:
        populate_by_name = True


class GrievanceFeedbackCreate(BaseModel):
    """Grievance feedback"""
    rating: int = Field(ge=1, le=5)
    comments: str
    submittedAt: datetime

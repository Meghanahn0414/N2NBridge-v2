"""
Grievance Model and Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


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


class AttachmentSchema(BaseModel):
    """Attachment schema"""
    fileName: str
    fileUrl: str
    uploadedAt: datetime


class HistoryEntry(BaseModel):
    """History entry"""
    oldStatus: str
    newStatus: str
    remarks: Optional[str] = None
    updatedBy: str
    createdAt: datetime


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
    categoryId: str
    description: str
    address: str
    wardId: Optional[str] = None
    constituencyId: Optional[str] = None
    priority: GrievancePriority = GrievancePriority.MEDIUM


class GrievanceCreate(GrievanceBase):
    """Grievance creation"""
    citizenId: str
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
    complaintNumber: str
    citizenId: str
    categoryId: str
    description: str
    address: str
    wardId: Optional[str] = None
    constituencyId: Optional[str] = None
    priority: str
    status: str
    escalationLevel: int
    assignedOfficerId: Optional[str] = None
    attachments: List[AttachmentSchema] = []
    history: List[HistoryEntry] = []
    feedback: Optional[FeedbackSchema] = None
    aiAnalysis: Optional[AIAnalysisSchema] = None
    createdAt: datetime
    updatedAt: datetime
    createdBy: str
    updatedBy: str
    isDeleted: bool
    
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

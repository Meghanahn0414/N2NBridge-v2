"""
Citizen Profile Models
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class CitizenProfileUpdate(BaseModel):
    """Citizen profile update schema"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    profileImage: Optional[str] = None
    age: Optional[int] = Field(None, ge=1, le=120)
    gender: Optional[str] = None
    wardId: Optional[str] = None
    constituencyId: Optional[str] = None


class CitizenProfileResponse(BaseModel):
    """Citizen profile response schema"""
    id: str = Field(alias="_id")
    fullName: str
    mobile: str
    email: str
    address: Optional[str] = None
    profileImage: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    constituencyId: Optional[str] = None
    wardId: Optional[str] = None
    role: str
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        populate_by_name = True

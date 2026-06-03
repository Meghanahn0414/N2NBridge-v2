"""
User Model and Schemas
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId


class UserBase(BaseModel):
    """Base user schema"""
    fullName: str
    mobile: str
    email: EmailStr
    role: str
    constituencyId: Optional[str] = None
    wardId: Optional[str] = None
    boothNumber: Optional[str] = None
    address: Optional[str] = None
    profileImage: Optional[str] = None


class UserCreate(UserBase):
    """User creation schema"""
    password: str


class UserUpdate(BaseModel):
    """User update schema"""
    fullName: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    profileImage: Optional[str] = None
    constituencyId: Optional[str] = None
    wardId: Optional[str] = None


class UserResponse(BaseModel):
    """User response schema"""
    id: str = Field(alias="_id")
    fullName: str
    mobile: str
    email: str
    role: str
    constituencyId: Optional[str] = None
    wardId: Optional[str] = None
    boothNumber: Optional[str] = None
    address: Optional[str] = None
    profileImage: Optional[str] = None
    status: str
    lastLoginAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        populate_by_name = True


class UserLoginRequest(BaseModel):
    """Login request"""
    email: EmailStr
    password: str


class UserPasswordChange(BaseModel):
    """Password change request"""
    oldPassword: str
    newPassword: str


class TokenResponse(BaseModel):
    """Token response"""
    accessToken: str
    tokenType: str = "bearer"
    user: UserResponse


class ConstituencyCreate(BaseModel):
    """Constituency creation"""
    constituencyCode: str
    name: str
    district: str
    state: str
    representativeId: Optional[str] = None


class ConstituencyResponse(BaseModel):
    """Constituency response"""
    id: str = Field(alias="_id")
    constituencyCode: str
    name: str
    district: str
    state: str
    representativeId: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        populate_by_name = True


class WardCreate(BaseModel):
    """Ward creation"""
    wardNumber: str
    wardName: str
    constituencyId: str


class WardResponse(BaseModel):
    """Ward response"""
    id: str = Field(alias="_id")
    wardNumber: str
    wardName: str
    constituencyId: str
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        populate_by_name = True

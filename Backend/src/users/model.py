"""
User Model and Schemas
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

# from bson import ObjectId


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
    status: Optional[str] = None


class UserResponse(BaseModel):
    """User response schema"""
    id: str = Field(alias="_id")
    citizenId: Optional[str] = None
    fullName: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    constituencyId: Optional[str] = None
    wardId: Optional[str] = None
    boothNumber: Optional[str] = None
    address: Optional[str] = None
    profileImage: Optional[str] = None
    status: Optional[str] = 'ACTIVE'
    lastLoginAt: Optional[datetime] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

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


class SendOtpRequest(BaseModel):
    """Send OTP request"""
    type: str = Field(..., description="'phone' or 'email'")
    value: str = Field(..., description="Phone number or email address")


class VerifyOtpRequest(BaseModel):
    """Verify OTP request"""
    value: str = Field(..., description="Phone number or email address")
    otp: str = Field(..., description="6-digit OTP code")


class OtpResponse(BaseModel):
    """OTP response"""
    success: bool
    message: str
    token: Optional[str] = None
    role: Optional[str] = None
    user: Optional[UserResponse] = None


class ConstituencyCreate(BaseModel):
    """Constituency creation"""
    constituencyCode: Optional[str] = None
    name: str
    district: str
    state: str
    representativeId: Optional[str] = None


class ConstituencyUpdate(BaseModel):
    """Constituency update"""
    constituencyCode: Optional[str] = None
    name: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    representativeId: Optional[str] = None


class ConstituencyResponse(BaseModel):
    """Constituency response"""
    id: str = Field(alias="_id")
    constituencyCode: Optional[str] = None
    name: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    representativeId: Optional[str] = None
    wardCount: Optional[int] = 0
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

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
    wardNumber: Optional[str] = None
    wardName: Optional[str] = None
    constituencyId: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        populate_by_name = True

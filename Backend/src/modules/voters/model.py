# Voters Data Models
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime
    

class VoterCreate(BaseModel):
    fullName: str
    mobile: int
    email: str
    password: str
    confirmPassword: str
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    profileImage: Optional[str] = None

class VoterUpdate(BaseModel):
    fullName: Optional[str] = None
    email: Optional[EmailStr] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    profileImage: Optional[str] = None

class VoterResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    id: str = Field(alias="_id")
    fullName: str
    email: Optional[str] = None
    mobile: int
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    profileImage: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

"""
Citizen Profile Models
"""
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class CitizenRegisterDetails(BaseModel):
    """Fill in citizen details after OTP verification"""
    name:         str                = Field(..., description="Full name of the citizen")
    email:        Optional[EmailStr] = Field(None, description="Email address")
    gender:       Optional[str]      = Field(None, description="Male | Female | Other")
    age:          Optional[int]      = Field(None, ge=1, le=120, description="Age in years")
    address:      Optional[str]      = Field(None, description="Residential address")
    pincode:      Optional[str]      = Field(None, description="PIN / ZIP code")
    profileImage: Optional[str]      = Field(None, description="Profile photo URL")


class CitizenProfileUpdate(BaseModel):
    """Update citizen profile fields"""
    name:               Optional[str]       = Field(None, description="Full name")
    email:              Optional[EmailStr]  = Field(None, description="Email address")
    gender:             Optional[str]       = Field(None, description="Male | Female | Other")
    age:                Optional[int]       = Field(None, ge=1, le=120, description="Age in years")
    address:            Optional[str]       = Field(None, description="Residential address")
    pincode:            Optional[str]       = Field(None, description="PIN / ZIP code")
    profileImage:       Optional[str]       = Field(None, description="Profile photo URL")
    assembly_name:      Optional[str]       = Field(None, description="Assembly constituency")
    parliamentary_name: Optional[str]       = Field(None, description="Parliamentary constituency")
    ward_id:            Optional[str]       = Field(None, description="Ward ID")
    area_name:          Optional[str]       = Field(None, description="Area name")
    taluk:              Optional[str]       = Field(None, description="Taluk / Tehsil")
    district:           Optional[str]       = Field(None, description="District")
    state:              Optional[str]       = Field(None, description="State")

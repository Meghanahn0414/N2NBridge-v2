"""
User Models and Schemas
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ── Representative Register ────────────────────────────────────────────────────

class RepresentativeRegisterRequest(BaseModel):
    """Request body for POST /api/auth/representative/register"""
    name:               str      = Field(..., description="Full name of the representative")
    rep_type:           str      = Field(..., description="MLA | MP | COUNCILLOR")
    mobile:             str      = Field(..., description="10-digit mobile number")
    email:              EmailStr = Field(..., description="Email address")
    password:           str      = Field(..., description="Login password")
    location:           str      = Field(..., description="Constituency / ward name — used to generate the invite slug")

    assembly_name:      Optional[str] = Field(None, description="Required for MLA — Assembly constituency name")
    parliamentary_name: Optional[str] = Field(None, description="Required for MP — Parliamentary constituency name")
    ward_id:            Optional[str] = Field(None, description="Required for COUNCILLOR — Ward ID / number")
    ward_name:          Optional[str] = Field(None, description="COUNCILLOR — Ward name")

    taluk:    Optional[str] = Field(None, description="Taluk / Tehsil")
    district: Optional[str] = Field(None, description="District name")
    state:    Optional[str] = Field(None, description="State name")


# ── Staff Register ─────────────────────────────────────────────────────────────

class StaffRegisterRequest(BaseModel):
    """Request body for POST /api/auth/staff/register"""
    name:        str      = Field(..., description="Full name")
    mobile:      str      = Field(..., description="10-digit mobile number")
    email:       EmailStr = Field(..., description="Email address")
    password:    str      = Field(..., description="Login password")
    designation: Optional[str] = Field("Staff", description="PA | Field Officer | Manager | Volunteer")
    role:        Optional[str] = Field("STAFF",  description="STAFF (default)")


# ── Citizen Register (OTP flow) ────────────────────────────────────────────────

class SendOtpRequest(BaseModel):
    """Step 1 — send OTP to citizen mobile or email"""
    type:  str = Field(..., description="phone  or  email")
    value: str = Field(..., description="Mobile number or email address")


class VerifyOtpRequest(BaseModel):
    """Step 2 — verify OTP and register / login citizen"""
    value:   str           = Field(..., description="Same mobile or email used in send-otp")
    otp:     str           = Field(..., description="6-digit OTP received")
    db_name: Optional[str] = Field(None, description="Tenant DB name (internal use)")


class CitizenRegisterRequest(BaseModel):
    """Step 2 — verify OTP and register citizen by selecting their representative"""
    value:              str           = Field(..., description="Mobile number or email used in send-otp")
    otp:                str           = Field(..., description="6-digit OTP received")
    rep_type:           str           = Field(..., description="MLA | MP | COUNCILLOR")
    assembly_name:      Optional[str] = Field(None, description="Assembly constituency name — required when rep_type is MLA")
    parliamentary_name: Optional[str] = Field(None, description="Parliamentary constituency name — required when rep_type is MP")
    ward_id:            Optional[str] = Field(None, description="Ward ID — required when rep_type is COUNCILLOR")


class CitizenCompleteProfileRequest(BaseModel):
    """
    Complete Your Profile page — used when OTP verification was done WITHOUT
    picking a representative up front (see auth/routes.py verify_otp_compat).
    This is where Ward/Assembly/Parliament selection happens instead: the
    representative is resolved here, and the citizen is moved from the plain
    tenant-less account created at OTP time into that representative's own
    database.
    """
    fullName:           str           = Field(..., description="Full name of the citizen")
    email:              Optional[str] = Field(None, description="Email address")
    mobile:             Optional[str] = Field(None, description="Phone number (confirms/updates the OTP-verified number)")
    age:                Optional[int] = Field(None, ge=1, le=120, description="Age in years")
    address:            Optional[str] = Field(None, description="Residential address")
    ward_number:        Optional[str] = Field(None, description="General ward number (distinct from the COUNCILLOR-lookup ward_id below)")
    rep_type:           str           = Field(..., description="MLA | MP | COUNCILLOR")
    assembly_name:      Optional[str] = Field(None, description="Assembly constituency name — required when rep_type is MLA")
    parliamentary_name: Optional[str] = Field(None, description="Parliamentary constituency name — required when rep_type is MP")
    ward_id:            Optional[str] = Field(None, description="Ward ID — required when rep_type is COUNCILLOR")
    ward_name:          Optional[str] = Field(None, description="Ward name (optional, alongside ward_id)")


# ── Login ──────────────────────────────────────────────────────────────────────

class UserLoginRequest(BaseModel):
    email:    EmailStr = Field(..., description="Registered email address")
    password: str      = Field(..., description="Password")


class UserPasswordChange(BaseModel):
    oldPassword: str = Field(..., description="Current password")
    newPassword: str = Field(..., description="New password")


# ── Profile models ─────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    """Legacy registration — backward-compat only."""
    fullName: str
    mobile:   str
    email:    EmailStr
    role:     Optional[str] = "MLA"
    password: str
    # Required when role == "ADMIN" — which representative type (MLA / MP /
    # COUNCILLOR) this admin will manage. Chosen directly on the Admin
    # Signup form; not used for any other role.
    scope: Optional[str] = None
    # Optional display name when the Admin Signup form's "Other" option was
    # picked — the account still registers under `scope` (one of the 3 real
    # types the rest of the app understands), this is purely cosmetic.
    scopeLabel: Optional[str] = None


class UserUpdate(BaseModel):
    """Update representative / staff profile."""
    fullName:           Optional[str]      = Field(None, description="Full name")
    mobile:             Optional[str]      = Field(None, description="Mobile number")
    email:              Optional[EmailStr] = Field(None, description="Email address")
    address:            Optional[str]      = Field(None, description="Office / home address")
    profileImage:       Optional[str]      = Field(None, description="Profile photo URL")
    age:                Optional[int]      = None
    gender:             Optional[str]      = Field(None, description="Male | Female | Other")
    bio:                Optional[str]      = Field(None, description="Short bio / about")
    officePhone:        Optional[str]      = Field(None, description="Office phone number")
    officeAddress:      Optional[str]      = Field(None, description="Office address")
    assembly_name:      Optional[str]      = None
    parliamentary_name: Optional[str]      = None
    ward_id:            Optional[str]      = None
    ward_name:          Optional[str]      = None
    taluk:              Optional[str]      = None
    district:           Optional[str]      = None
    state:              Optional[str]      = None


class UserResponse(BaseModel):
    """User response — representative or staff."""
    id:                 str             = Field(alias="_id")
    fullName:           Optional[str]   = None
    mobile:             Optional[str]   = None
    email:              Optional[str]   = None
    role:               Optional[str]   = None
    title:              Optional[str]   = None
    status:             Optional[str]   = "ACTIVE"
    address:            Optional[str]   = None
    profileImage:       Optional[str]   = None
    age:                Optional[int]   = None
    gender:             Optional[str]   = None
    bio:                Optional[str]   = None
    officePhone:        Optional[str]   = None
    officeAddress:      Optional[str]   = None
    assembly_name:      Optional[str]   = None
    parliamentary_name: Optional[str]   = None
    ward_id:            Optional[str]   = None
    ward_name:          Optional[str]   = None
    taluk:              Optional[str]   = None
    district:           Optional[str]   = None
    state:              Optional[str]   = None
    # Scoped-admin fields: scope = MLA|MP|COUNCILLOR the admin's invite token
    # was locked to; managedDbName = the tenant DB of the one representative
    # they've registered (null until they complete that one-time step).
    scope:              Optional[str]   = None
    managedDbName:      Optional[str]   = None
    createdAt:          Optional[datetime] = None
    updatedAt:          Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)


class TokenResponse(BaseModel):
    accessToken: str
    tokenType:   str = "bearer"
    user:        UserResponse


class OtpResponse(BaseModel):
    success:     bool
    message:     str
    accessToken: Optional[str]          = None
    role:        Optional[str]          = None
    user:        Optional[UserResponse] = None

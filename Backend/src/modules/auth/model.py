# Authentication Models
from pydantic import BaseModel
from typing import Optional, Literal

class LoginRequest(BaseModel):
    email: str
    password: str

class OTPRequest(BaseModel):
    contact_type: Literal["email", "phone"]    
    contact: str  # email or phone number

class OTPVerifyRequest(BaseModel):
    contact_type: Literal["email", "phone"]
    contact: str
    otp: str

class PasswordLoginRequest(BaseModel):
    contact: str
    contact_type: Literal["email", "phone"]
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    success: Optional[bool] = True
    message: Optional[str] = None

class OTPResponse(BaseModel):
    success: bool
    message: str
    contact: str
    contact_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None
    full_name: Optional[str] = None


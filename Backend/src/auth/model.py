"""
Authentication Models and Schemas
"""
from pydantic import BaseModel
from typing import Optional
# from datetime import datetime


class TokenData(BaseModel):
    """Token payload data"""
    user_id: str
    role: str
    email: Optional[str] = None


class AuthToken(BaseModel):
    """Authentication token response"""
    accessToken: str
    tokenType: str = "bearer"
    expiresIn: int

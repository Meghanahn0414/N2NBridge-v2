"""
Authentication Routes
"""
from fastapi import APIRouter, Depends, Header, HTTPException, status
from typing import Optional
from auth.service import AuthService
from users.model import UserLoginRequest, TokenResponse, UserCreate, UserResponse
from users.service import UserService
from utils.response import success_response, error_response, ResponseMessage
from utils.jwt import TokenManager
import logging

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)


def get_current_user(authorization: Optional[str] = Header(None)):
    """Get current user from token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    token = TokenManager.extract_token_from_header(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    payload = AuthService.verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return payload


@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLoginRequest):
    """User login"""
    result = AuthService.login(login_data)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    return result


@router.post("/register")
async def register(user_data: UserCreate):
    """Register new user (public endpoint)"""
    try:
        user_id = AuthService.register_user(user_data.dict(), None)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to register user"
            )
        
        # Create token for newly registered user
        token = TokenManager.create_token(user_id, user_data.role)
        
        # Return simple response with token
        return {
            "accessToken": token,
            "user": {
                "id": str(user_id),
                "email": user_data.email,
                "fullName": user_data.fullName,
                "role": user_data.role
            }
        }
    except Exception as e:
        logger.error(f"Registration error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Registration failed")


@router.get("/verify")
async def verify_token(current_user: dict = Depends(get_current_user)):
    """Verify token"""
    user = UserService.get_user_by_id(current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return success_response({"user_id": current_user["user_id"], "role": current_user["role"]})

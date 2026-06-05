"""
Authentication Service
"""
from users.service import UserService
from config.security import SecurityManager
from utils.jwt import TokenManager
from users.model import UserLoginRequest, UserResponse, TokenResponse
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class AuthService:
    """Authentication business logic"""
    
    @staticmethod
    def login(login_data: UserLoginRequest) -> Optional[TokenResponse]:
        """User login"""
        # Get user by email
        user = UserService.get_user_by_email(login_data.email)
        if not user:
            logger.warning(f"Login attempt with non-existent email: {login_data.email}")
            return None
        
        # Verify password
        if not SecurityManager.verify_password(login_data.password, user["passwordHash"]):
            logger.warning(f"Failed login attempt for user: {user['_id']}")
            return None
        
        # Update last login
        UserService.update_last_login(str(user["_id"]))
        
        # Create token
        token = TokenManager.create_token(str(user["_id"]), user["role"])
        
        # Build response
        user_response = UserResponse(
            _id=str(user["_id"]),
            fullName=user["fullName"],
            mobile=user["mobile"],
            email=user["email"],
            role=user["role"],
            constituencyId=user.get("constituencyId"),
            wardId=user.get("wardId"),
            boothNumber=user.get("boothNumber"),
            address=user.get("address"),
            profileImage=user.get("profileImage"),
            status=user["status"],
            lastLoginAt=user.get("lastLoginAt"),
            createdAt=user["createdAt"],
            updatedAt=user["updatedAt"]
        )
        
        return TokenResponse(
            accessToken=token,
            user=user_response
        )
    
    @staticmethod
    def verify_token(token: str) -> Optional[dict]:
        """Verify JWT token"""
        return TokenManager.verify_token(token)
    
    @staticmethod
    def register_user(user_data: dict, admin_id: str) -> Optional[str]:
        """Register new user (by admin/manager)"""
        try:
            logger.info(f"Starting registration for email: {user_data.get('email')}")
            
            # Check if user already exists
            existing_user = UserService.get_user_by_email(user_data["email"])
            if existing_user:
                logger.warning(f"User registration failed: Email already exists: {user_data['email']}")
                return None
            
            logger.info(f"Email {user_data['email']} is available. Creating user...")
            # Create user
            user_id = UserService.create_user(user_data, admin_id)
            logger.info(f"New user registered successfully. User ID: {user_id}")
            return user_id
        except Exception as e:
            logger.error(f"User registration error: {e}", exc_info=True)
            return None

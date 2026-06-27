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
        try:
            # Get user by email
            user = UserService.get_user_by_email(login_data.email)
            if not user:
                logger.warning(f"Login attempt with non-existent email: {login_data.email}")
                return None

            # Verify password — .get() guards against missing passwordHash field
            password_hash = user.get("passwordHash", "")
            if not SecurityManager.verify_password(login_data.password, password_hash):
                logger.warning(f"Failed login attempt for user: {user.get('_id')}")
                return None

            user_id = str(user["_id"])

            # Update last login (non-fatal)
            try:
                UserService.update_last_login(user_id)
            except Exception as e:
                logger.warning(f"Could not update lastLoginAt for {user_id}: {e}")

            # Create token
            token = TokenManager.create_token(user_id, user.get("role", ""))

            # Build response — use .get() for every field so missing keys never raise KeyError
            user_response = UserResponse(
                _id=user_id,
                fullName=user.get("fullName"),
                mobile=user.get("mobile"),
                email=user.get("email"),
                role=user.get("role"),
                constituencyId=str(user["constituencyId"]) if user.get("constituencyId") else None,
                wardId=str(user["wardId"]) if user.get("wardId") else None,
                boothNumber=user.get("boothNumber"),
                address=user.get("address"),
                profileImage=user.get("profileImage"),
                status=user.get("status", "ACTIVE"),
                lastLoginAt=user.get("lastLoginAt"),
                createdAt=user.get("createdAt"),
                updatedAt=user.get("updatedAt"),
                citizenId=user.get("citizenId"),
                age=user.get("age"),
                gender=user.get("gender"),
                title=user.get("title"),
                bio=user.get("bio"),
                officePhone=user.get("officePhone"),
                officeAddress=user.get("officeAddress"),
                showApprovalRating=user.get("showApprovalRating"),
                showResolvedCount=user.get("showResolvedCount"),
                notifPreferences=user.get("notifPreferences"),
                broadcastSignature=user.get("broadcastSignature"),
                defaultBroadcastType=user.get("defaultBroadcastType"),
            )

            return TokenResponse(
                accessToken=token,
                user=user_response
            )
        except Exception as e:
            logger.error(f"Login error for {login_data.email}: {e}", exc_info=True)
            raise
    
    @staticmethod
    def verify_token(token: str) -> Optional[dict]:
        """Verify JWT token"""
        return TokenManager.verify_token(token)
    
    @staticmethod
    def register_user(user_data: dict, admin_id: str) -> Optional[str]:
        """Register new user (by admin/manager)"""
        try:
            logger.info(f"Starting registration for email: {user_data.get('email')}, mobile: {user_data.get('mobile')}")
            
            # Check if user already exists by email
            existing_user_email = UserService.get_user_by_email(user_data["email"])
            if existing_user_email:
                logger.warning(f"User registration failed: Email already exists: {user_data['email']}")
                return None
            
            # Check if user already exists by mobile
            existing_user_mobile = UserService.get_user_by_mobile(user_data.get("mobile"))
            if existing_user_mobile:
                logger.warning(f"User registration failed: Mobile already exists: {user_data.get('mobile')}")
                return None
            
            logger.info(f"Email {user_data['email']} and mobile {user_data.get('mobile')} are available. Creating user...")
            # Create user
            user_id = UserService.create_user(user_data, admin_id)
            logger.info(f"New user registered successfully. User ID: {user_id}")
            return user_id
        except Exception as e:
            logger.error(f"User registration error: {e}", exc_info=True)
            return None

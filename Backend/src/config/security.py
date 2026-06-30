"""
Security Configuration and Authentication
"""
from datetime import datetime, timedelta
from typing import Optional
import jwt
import bcrypt
from config.settings import settings
import logging

logger = logging.getLogger(__name__)


class SecurityManager:
    """Handle security operations"""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password"""
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password"""
        try:
            return bcrypt.checkpw(
                plain_password.encode("utf-8"),
                hashed_password.encode("utf-8")
            )
        except Exception:
            return False
    
    @staticmethod
    def create_access_token(
        data: dict,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create JWT token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                hours=settings.JWT_EXPIRATION_HOURS
            )
        
        to_encode.update({"exp": expire})
        
        try:
            encoded_jwt = jwt.encode(
                to_encode,
                settings.JWT_SECRET_KEY,
                algorithm=settings.JWT_ALGORITHM
            )
            return encoded_jwt
        except Exception as e:
            logger.error(f"Error creating token: {e}")
            raise
    
    @staticmethod
    def decode_token(token: str) -> Optional[dict]:
        """Decode JWT token"""
        try:
            logger.debug(f"[JWT] Attempting to decode token, length: {len(token)}")
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            logger.debug(f"[JWT] ✅ Token decoded successfully, user_id: {payload.get('user_id')}")
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("[JWT] ❌ Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"[JWT] ❌ Invalid token: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"[JWT] ❌ Unexpected error decoding token: {str(e)}")
            return None


# Define available roles
class UserRole:
    """User roles"""
    CITIZEN = "CITIZEN"
    REPRESENTATIVE = "REPRESENTATIVE"
    CONSTITUENCY_MANAGER = "CONSTITUENCY_MANAGER"
    FIELD_OFFICER = "FIELD_OFFICER"
    VOLUNTEER = "VOLUNTEER"
    ADMIN = "ADMIN"
    
    ALL_ROLES = [CITIZEN, REPRESENTATIVE, CONSTITUENCY_MANAGER, FIELD_OFFICER, VOLUNTEER, ADMIN]


class Permission:
    """Permission definitions by role"""
    
    ROLE_PERMISSIONS = {
        UserRole.ADMIN: ["*"],  # Full access
        UserRole.CONSTITUENCY_MANAGER: [
            "grievance:read",
            "grievance:update",
            "alert:read",
            "user:read",
            "task:read",
            "task:update",
            "analytics:read"
        ],
        UserRole.FIELD_OFFICER: [
            "grievance:read",
            "grievance:update",
            "alert:read",
            "task:read",
            "task:update",
            "field_report:create"
        ],
        UserRole.REPRESENTATIVE: [
            "grievance:read",
            "alert:read",
            "user:read",
            "analytics:read"
        ],
        UserRole.VOLUNTEER: [
            "grievance:read",
            "alert:read"
        ],
        UserRole.CITIZEN: [
            "grievance:create",
            "grievance:read_own",
            "alert:create",
            "event:read",
            "survey:read"
        ]
    }
    
    @classmethod
    def has_permission(cls, role: str, permission: str) -> bool:
        """Check if role has permission"""
        role_perms = cls.ROLE_PERMISSIONS.get(role, [])
        return "*" in role_perms or permission in role_perms

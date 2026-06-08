"""
JWT Token Utility
"""
from config.security import SecurityManager
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)


class TokenManager:
    """Token management"""
    
    @staticmethod
    def create_token(user_id: str, role: str) -> str:
        """Create access token"""
        data = {
            "user_id": user_id,
            "role": role
        }
        return SecurityManager.create_access_token(data)
    
    @staticmethod
    def verify_token(token: str) -> Optional[Dict]:
        """Verify and decode token"""
        return SecurityManager.decode_token(token)
    
    @staticmethod
    def extract_token_from_header(authorization_header: str) -> Optional[str]:
        """Extract token from authorization header"""
        if not authorization_header:
            logger.warning("[JWT] No authorization header provided")
            return None
        
        parts = authorization_header.split()
        if len(parts) != 2:
            logger.warning(f"[JWT] Invalid header format - expected 2 parts, got {len(parts)}")
            return None
        
        if parts[0].lower() != "bearer":
            logger.warning(f"[JWT] Invalid auth scheme - expected 'Bearer', got '{parts[0]}'")
            return None
        
        logger.debug(f"[JWT] ✅ Token extracted successfully, length: {len(parts[1])}")
        return parts[1]

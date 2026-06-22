"""
Citizen Service
"""
from config.database import MongoDatabase
from users.service import UserService
from utils.helper import Helper
from bson import ObjectId
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class CitizenService:
    """Citizen profile business logic"""
    
    @staticmethod
    def get_citizen_profile(user_id: str) -> Optional[dict]:
        """Get citizen profile by user ID"""
        try:
            user = UserService.get_user_by_id(user_id)
            if not user or user.get("role") != "CITIZEN":
                logger.warning(f"Citizen profile not found or not a citizen: {user_id}")
                return None
            return user
        except Exception as e:
            logger.error(f"Error fetching citizen profile: {e}")
            return None
    
    @staticmethod
    def update_citizen_profile(user_id: str, update_data: dict) -> bool:
        """Update citizen profile"""
        try:
            # Map frontend field names to backend field names
            field_mapping = {
                "name": "fullName",
                "email": "email",
                "phone": "mobile",
                "address": "address",
                "profileImage": "profileImage",
                "age": "age",
                "gender": "gender",
                "wardId": "wardId",
                "constituencyId": "constituencyId",
            }
            
            # Create update dict with backend field names
            backend_data = {}
            for frontend_field, value in update_data.items():
                if frontend_field in field_mapping and value is not None:
                    backend_data[field_mapping[frontend_field]] = value
            
            if not backend_data:
                logger.warning(f"No valid fields to update for user {user_id}")
                return False
            
            # Update in database
            success = UserService.update_user(user_id, backend_data, user_id)
            
            if success:
                logger.info(f"Citizen profile updated: {user_id}")
            else:
                logger.warning(f"Failed to update citizen profile: {user_id}")
            
            return success
        except Exception as e:
            logger.error(f"Error updating citizen profile: {e}")
            return False

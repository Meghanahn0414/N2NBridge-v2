"""
User Service
"""
import logging
import re
from datetime import datetime
from typing import Dict, List, Optional

from bson import ObjectId
from config.database import MongoDatabase
from config.security import SecurityManager, UserRole
from utils.helper import Helper
from utils.id_generator import IDGenerator

logger = logging.getLogger(__name__)


class UserService:
    """User business logic"""
    
    @staticmethod
    def create_user(user_data: dict, user_id: str) -> dict:
        """Create new user"""
        try:
            db = MongoDatabase.get_db()
            
            logger.info(f"Creating user with email: {user_data.get('email')}")
            # Hash password
            user_data["passwordHash"] = SecurityManager.hash_password(user_data.pop("password"))
            user_data["status"] = "ACTIVE"
            user_data["lastLoginAt"] = None
            
            # Generate unique citizen ID for CITIZEN role
            if user_data.get("role") == "CITIZEN":
                user_data["citizenId"] = IDGenerator.generate_citizen_id()
                logger.info(f"Generated citizen ID: {user_data['citizenId']}")
            
            # Normalize contact fields for consistent lookup and storage
            if "email" in user_data:
                user_data["email"] = UserService.normalize_email(user_data["email"])
            if "mobile" in user_data:
                user_data["mobile"] = UserService.normalize_mobile(user_data["mobile"])

            # Handle audit fields - use "system" for public registration (when user_id is None)
            audit_user_id = user_id if user_id else "system"
            user_data.update(Helper.audit_fields(audit_user_id))
            
            logger.info(f"Inserting user document into database")
            result = db.users.insert_one(user_data)
            logger.info(f"User created successfully with ID: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error creating user: {e}", exc_info=True)
            raise
    
    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[dict]:
        """Get user by ID"""
        db = MongoDatabase.get_db()
        return db.users.find_one({
            "_id": ObjectId(user_id),
            "isDeleted": False
        })
    
    @staticmethod
    def normalize_email(email: Optional[str]) -> Optional[str]:
        if not email:
            return None
        normalized = email.strip().lower()
        return normalized if normalized else None

    @staticmethod
    def normalize_mobile(mobile: Optional[str]) -> Optional[str]:
        if not mobile:
            return None
        normalized = re.sub(r"\D", "", mobile)
        return normalized if normalized else None

    @staticmethod
    def get_user_by_email(email: str) -> Optional[dict]:
        """Get user by email"""
        db = MongoDatabase.get_db()
        normalized_email = UserService.normalize_email(email)
        if not normalized_email:
            return None
        return db.users.find_one({
            "email": {
                "$regex": f"^{re.escape(normalized_email)}$",
                "$options": "i"
            },
            "isDeleted": False
        })
    
    @staticmethod
    def get_user_by_mobile(mobile: str) -> Optional[dict]:
        """Get user by mobile"""
        db = MongoDatabase.get_db()
        normalized_mobile = UserService.normalize_mobile(mobile)
        if not normalized_mobile:
            return None
        separator_pattern = r"[^\da-zA-Z]*"
        pattern = r"^" + separator_pattern.join(re.escape(d) for d in normalized_mobile) + separator_pattern + r"$"
        return db.users.find_one({
            "mobile": {
                "$regex": pattern
            },
            "isDeleted": False
        })
    
    @staticmethod
    def list_users(skip: int = 0, limit: int = 10, role: Optional[str] = None) -> List[dict]:
        """List users with pagination"""
        db = MongoDatabase.get_db()
        query = {"isDeleted": False}
        
        if role:
            query["role"] = role
        
        return list(db.users.find(query).skip(skip).limit(limit))
    
    @staticmethod
    def update_user(user_id: str, update_data: dict, updated_by: str) -> bool:
        """Update user"""
        db = MongoDatabase.get_db()

        if "email" in update_data:
            update_data["email"] = UserService.normalize_email(update_data["email"])
        if "mobile" in update_data:
            update_data["mobile"] = UserService.normalize_mobile(update_data["mobile"])

        # Generate citizenId for CITIZEN users who don't have one yet
        existing = db.users.find_one({"_id": ObjectId(user_id), "isDeleted": False}, {"role": 1, "citizenId": 1})
        if existing and existing.get("role") == "CITIZEN" and not existing.get("citizenId"):
            update_data["citizenId"] = IDGenerator.generate_citizen_id()
            logger.info(f"Generated citizenId for existing citizen {user_id}: {update_data['citizenId']}")

        update_data.update(Helper.audit_fields(updated_by, is_update=True))

        result = db.users.update_one(
            {"_id": ObjectId(user_id), "isDeleted": False},
            {"$set": update_data}
        )
        return result.matched_count > 0
    
    @staticmethod
    def delete_user(user_id: str, deleted_by: str) -> bool:
        """Soft delete user"""
        db = MongoDatabase.get_db()
        result = db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "isDeleted": True,
                "deletedAt": Helper.soft_delete_fields()["deletedAt"],
                "updatedBy": deleted_by,
                "updatedAt": Helper.audit_fields(deleted_by, is_update=True)["updatedAt"]
            }}
        )
        return result.modified_count > 0
    
    @staticmethod
    def update_last_login(user_id: str):
        """Update last login"""
        db = MongoDatabase.get_db()
        from datetime import datetime
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"lastLoginAt": datetime.utcnow()}}
        )
    
    @staticmethod
    def count_users(role: Optional[str] = None) -> int:
        """Count users"""
        db = MongoDatabase.get_db()
        query = {"isDeleted": False}
        if role:
            query["role"] = role
        return db.users.count_documents(query)


class ConstituencyService:
    """Constituency business logic"""
    
    @staticmethod
    def create_constituency(data: dict) -> str:
        """Create constituency"""
        db = MongoDatabase.get_db()
        result = db.constituencies.insert_one(data)
        return str(result.inserted_id)
    
    @staticmethod
    def get_all_constituencies() -> List[dict]:
        """Get all constituencies"""
        db = MongoDatabase.get_db()
        return list(db.constituencies.find())
    
    @staticmethod
    def get_constituency_by_id(constituency_id: str) -> Optional[dict]:
        """Get constituency by ID"""
        db = MongoDatabase.get_db()
        return db.constituencies.find_one({"_id": ObjectId(constituency_id)})
    
    @staticmethod
    def update_constituency(constituency_id: str, data: dict) -> bool:
        """Update constituency"""
        db = MongoDatabase.get_db()
        data["updatedAt"] = datetime.utcnow()
        result = db.constituencies.update_one(
            {"_id": ObjectId(constituency_id)},
            {"$set": data}
        )
        return result.modified_count > 0

    @staticmethod
    def delete_constituency(constituency_id: str) -> bool:
        """Delete constituency"""
        db = MongoDatabase.get_db()
        result = db.constituencies.delete_one({"_id": ObjectId(constituency_id)})
        return result.deleted_count > 0

    @staticmethod
    def search_constituencies(query: str) -> List[dict]:
        """Search constituencies"""
        db = MongoDatabase.get_db()
        return list(db.constituencies.find({
            "$or": [
                {"name": {"$regex": query, "$options": "i"}},
                {"district": {"$regex": query, "$options": "i"}}
            ]
        }))


class WardService:
    """Ward business logic"""
    
    @staticmethod
    def create_ward(data: dict) -> str:
        """Create ward"""
        db = MongoDatabase.get_db()
        result = db.wards.insert_one(data)
        return str(result.inserted_id)
    
    @staticmethod
    def get_all_wards() -> List[dict]:
        """Get all wards"""
        db = MongoDatabase.get_db()
        return list(db.wards.find())

    @staticmethod
    def get_wards_by_constituency(constituency_id: str) -> List[dict]:
        """Get wards by constituency"""
        db = MongoDatabase.get_db()
        return list(db.wards.find({"constituencyId": constituency_id}))
    
    @staticmethod
    def get_ward_by_id(ward_id: str) -> Optional[dict]:
        """Get ward by ID"""
        db = MongoDatabase.get_db()
        return db.wards.find_one({"_id": ObjectId(ward_id)})

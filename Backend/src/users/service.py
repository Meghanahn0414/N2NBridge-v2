"""
User Service
"""
from config.database import MongoDatabase
from config.security import SecurityManager, UserRole
from utils.helper import Helper
from bson import ObjectId
from typing import Optional, List, Dict
import logging

logger = logging.getLogger(__name__)


class UserService:
    """User business logic"""
    
    @staticmethod
    def create_user(user_data: dict, user_id: str) -> dict:
        """Create new user"""
        db = MongoDatabase.get_db()
        
        # Hash password
        user_data["passwordHash"] = SecurityManager.hash_password(user_data.pop("password"))
        user_data["status"] = "ACTIVE"
        user_data["lastLoginAt"] = None
        user_data.update(Helper.audit_fields(user_id))
        
        result = db.users.insert_one(user_data)
        logger.info(f"User created: {result.inserted_id}")
        return str(result.inserted_id)
    
    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[dict]:
        """Get user by ID"""
        db = MongoDatabase.get_db()
        return db.users.find_one({
            "_id": ObjectId(user_id),
            "isDeleted": False
        })
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[dict]:
        """Get user by email"""
        db = MongoDatabase.get_db()
        return db.users.find_one({
            "email": email,
            "isDeleted": False
        })
    
    @staticmethod
    def get_user_by_mobile(mobile: str) -> Optional[dict]:
        """Get user by mobile"""
        db = MongoDatabase.get_db()
        return db.users.find_one({
            "mobile": mobile,
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
        update_data.update(Helper.audit_fields(updated_by, is_update=True))
        
        result = db.users.update_one(
            {"_id": ObjectId(user_id), "isDeleted": False},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
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
    def get_wards_by_constituency(constituency_id: str) -> List[dict]:
        """Get wards by constituency"""
        db = MongoDatabase.get_db()
        return list(db.wards.find({"constituencyId": constituency_id}))
    
    @staticmethod
    def get_ward_by_id(ward_id: str) -> Optional[dict]:
        """Get ward by ID"""
        db = MongoDatabase.get_db()
        return db.wards.find_one({"_id": ObjectId(ward_id)})

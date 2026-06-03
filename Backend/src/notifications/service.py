"""
Notification Service
"""
from config.database import MongoDatabase
from bson import ObjectId
from typing import Optional, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """Notification business logic"""
    
    @staticmethod
    def create_notification(notification_data: dict) -> str:
        """Create notification"""
        db = MongoDatabase.get_db()
        
        notification_data["isRead"] = False
        notification_data["createdAt"] = datetime.utcnow()
        
        result = db.notifications.insert_one(notification_data)
        return str(result.inserted_id)
    
    @staticmethod
    def get_notification_by_id(notification_id: str) -> Optional[dict]:
        """Get notification by ID"""
        db = MongoDatabase.get_db()
        return db.notifications.find_one({"_id": ObjectId(notification_id)})
    
    @staticmethod
    def get_user_notifications(user_id: str, skip: int = 0, limit: int = 10) -> List[dict]:
        """Get user notifications"""
        db = MongoDatabase.get_db()
        return list(db.notifications.find({
            "userId": user_id
        }).sort("createdAt", -1).skip(skip).limit(limit))
    
    @staticmethod
    def get_unread_notifications(user_id: str) -> List[dict]:
        """Get unread notifications"""
        db = MongoDatabase.get_db()
        return list(db.notifications.find({
            "userId": user_id,
            "isRead": False
        }))
    
    @staticmethod
    def mark_as_read(notification_id: str) -> bool:
        """Mark notification as read"""
        db = MongoDatabase.get_db()
        
        result = db.notifications.update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": {"isRead": True}}
        )
        return result.modified_count > 0
    
    @staticmethod
    def mark_all_as_read(user_id: str) -> int:
        """Mark all user notifications as read"""
        db = MongoDatabase.get_db()
        
        result = db.notifications.update_many(
            {"userId": user_id, "isRead": False},
            {"$set": {"isRead": True}}
        )
        return result.modified_count
    
    @staticmethod
    def delete_notification(notification_id: str) -> bool:
        """Delete notification"""
        db = MongoDatabase.get_db()
        
        result = db.notifications.delete_one({"_id": ObjectId(notification_id)})
        return result.deleted_count > 0
    
    @staticmethod
    def notify_user(user_id: str, title: str, body: str, notification_type: str) -> str:
        """Create and notify user"""
        return NotificationService.create_notification({
            "userId": user_id,
            "title": title,
            "body": body,
            "type": notification_type
        })

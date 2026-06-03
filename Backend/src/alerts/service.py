"""
Alert Service
"""
from config.database import MongoDatabase
from utils.helper import Helper
from bson import ObjectId
from typing import Optional, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class AlertService:
    """Alert business logic"""
    
    @staticmethod
    def create_alert(alert_data: dict, user_id: str) -> str:
        """Create alert"""
        db = MongoDatabase.get_db()
        
        alert_data["alertNumber"] = Helper.generate_alert_number()
        alert_data["status"] = "OPEN"
        alert_data.update(Helper.audit_fields(user_id))
        
        result = db.alerts.insert_one(alert_data)
        return str(result.inserted_id)
    
    @staticmethod
    def get_alert_by_id(alert_id: str) -> Optional[dict]:
        """Get alert by ID"""
        db = MongoDatabase.get_db()
        return db.alerts.find_one({"_id": ObjectId(alert_id)})
    
    @staticmethod
    def list_alerts(skip: int = 0, limit: int = 10, filters: dict = None) -> List[dict]:
        """List alerts"""
        db = MongoDatabase.get_db()
        query = {}
        
        if filters:
            if filters.get("status"):
                query["status"] = filters["status"]
            if filters.get("priority"):
                query["priority"] = filters["priority"]
            if filters.get("citizenId"):
                query["citizenId"] = filters["citizenId"]
        
        return list(db.alerts.find(query).skip(skip).limit(limit))
    
    @staticmethod
    def update_alert(alert_id: str, update_data: dict, updated_by: str) -> bool:
        """Update alert"""
        db = MongoDatabase.get_db()
        update_data.update(Helper.audit_fields(updated_by, is_update=True))
        
        result = db.alerts.update_one(
            {"_id": ObjectId(alert_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    @staticmethod
    def assign_alert(alert_id: str, officer_id: str, assigned_by: str) -> bool:
        """Assign alert to officer"""
        db = MongoDatabase.get_db()
        
        result = db.alerts.update_one(
            {"_id": ObjectId(alert_id)},
            {
                "$set": {
                    "assignedTo": officer_id,
                    "status": "ACKNOWLEDGED",
                    "updatedBy": assigned_by,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0
    
    @staticmethod
    def add_media_attachment(alert_id: str, media_url: str) -> bool:
        """Add media attachment to alert"""
        db = MongoDatabase.get_db()
        
        result = db.alerts.update_one(
            {"_id": ObjectId(alert_id)},
            {
                "$push": {"mediaAttachments": media_url},
                "$set": {
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0

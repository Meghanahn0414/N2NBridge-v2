"""
Event Service
"""
from config.database import MongoDatabase
from utils.helper import Helper
from bson import ObjectId
from typing import Optional, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class EventService:
    """Event business logic"""
    
    @staticmethod
    def create_event(event_data: dict, user_id: str) -> str:
        """Create event"""
        db = MongoDatabase.get_db()
        
        event_data["status"] = "DRAFT"
        event_data["registrationCount"] = 0
        
        # Handle audit fields - use "system" for public creation (when user_id is None)
        audit_user_id = user_id if user_id else "system"
        event_data.update(Helper.audit_fields(audit_user_id))
        
        result = db.events.insert_one(event_data)
        return str(result.inserted_id)
    
    @staticmethod
    def get_event_by_id(event_id: str) -> Optional[dict]:
        """Get event by ID"""
        db = MongoDatabase.get_db()
        return db.events.find_one({"_id": ObjectId(event_id)})
    
    @staticmethod
    def list_events(skip: int = 0, limit: int = 10) -> List[dict]:
        """List events"""
        db = MongoDatabase.get_db()
        return list(db.events.find().skip(skip).limit(limit))
    
    @staticmethod
    def update_event(event_id: str, update_data: dict, updated_by: str) -> bool:
        """Update event"""
        db = MongoDatabase.get_db()
        update_data.update(Helper.audit_fields(updated_by, is_update=True))
        
        result = db.events.update_one(
            {"_id": ObjectId(event_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    @staticmethod
    def publish_event(event_id: str, user_id: str) -> bool:
        """Publish event"""
        db = MongoDatabase.get_db()
        
        result = db.events.update_one(
            {"_id": ObjectId(event_id)},
            {
                "$set": {
                    "status": "PUBLISHED",
                    "updatedBy": user_id,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0


class EventRegistrationService:
    """Event registration business logic"""
    
    @staticmethod
    def register_citizen(registration_data: dict) -> str:
        """Register citizen for event"""
        db = MongoDatabase.get_db()
        
        registration_data["qrCode"] = Helper.generate_qr_code(
            registration_data["eventId"],
            registration_data["citizenId"]
        )
        registration_data["attendanceStatus"] = "REGISTERED"
        registration_data["registeredAt"] = datetime.utcnow()
        
        result = db.event_registrations.insert_one(registration_data)
        
        # Update registration count
        db.events.update_one(
            {"_id": ObjectId(registration_data["eventId"])},
            {"$inc": {"registrationCount": 1}}
        )
        
        return str(result.inserted_id)
    
    @staticmethod
    def get_registration(event_id: str, citizen_id: str) -> Optional[dict]:
        """Get registration"""
        db = MongoDatabase.get_db()
        return db.event_registrations.find_one({
            "eventId": event_id,
            "citizenId": citizen_id
        })
    
    @staticmethod
    def get_event_registrations(event_id: str, skip: int = 0, limit: int = 10) -> List[dict]:
        """Get event registrations"""
        db = MongoDatabase.get_db()
        return list(db.event_registrations.find({
            "eventId": event_id
        }).skip(skip).limit(limit))
    
    @staticmethod
    def mark_attendance(registration_id: str) -> bool:
        """Mark attendance"""
        db = MongoDatabase.get_db()
        
        result = db.event_registrations.update_one(
            {"_id": ObjectId(registration_id)},
            {"$set": {"attendanceStatus": "ATTENDED"}}
        )
        return result.modified_count > 0

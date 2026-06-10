"""
Complaint Service
"""
import logging
from datetime import datetime
from typing import Dict, List, Optional

from complaints.model import ComplaintCreate, ComplaintStatus
from config.database import MongoDatabase
from utils.id_generator import IDGenerator

logger = logging.getLogger(__name__)


class ComplaintService:
    """Service for complaint operations"""
    
    COLLECTION = "complaints"
    
    @staticmethod
    def create_complaint(complaint_data: Dict) -> str:
        """Create a new complaint"""
        try:
            # Generate complaint ID
            complaint_id = f"CMP-{int(datetime.utcnow().timestamp() * 1000)}"
            
            complaint_doc = {
                "complaintId": complaint_id,
                "citizenId": complaint_data.get("citizenId"),
                "category": complaint_data.get("category"),
                "description": complaint_data.get("description"),
                "location": complaint_data.get("location"),
                "ward": complaint_data.get("ward"),
                "priority": complaint_data.get("priority", "Normal"),
                "status": "NEW",
                "photos": complaint_data.get("photos", []),
                "latitude": complaint_data.get("latitude"),
                "longitude": complaint_data.get("longitude"),
                "contactPhone": complaint_data.get("contactPhone"),
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
                "remarks": "",
            }
            
            result = MongoDatabase.get_db()[ComplaintService.COLLECTION].insert_one(complaint_doc)
            logger.info(f"Complaint created: {complaint_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error creating complaint: {e}")
            raise
    
    @staticmethod
    def get_complaint_by_id(complaint_id: str) -> Optional[Dict]:
        """Get complaint by ID"""
        try:
            from bson import ObjectId
            complaint = MongoDatabase.get_db()[ComplaintService.COLLECTION].find_one(
                {"_id": ObjectId(complaint_id)}
            )
            return complaint
        except Exception as e:
            logger.error(f"Error fetching complaint: {e}")
            return None
    
    @staticmethod
    def get_complaint_by_complaint_id(complaint_id: str) -> Optional[Dict]:
        """Get complaint by complaint ID (e.g., CMP-xxx)"""
        try:
            complaint = MongoDatabase.get_db()[ComplaintService.COLLECTION].find_one(
                {"complaintId": complaint_id}
            )
            return complaint
        except Exception as e:
            logger.error(f"Error fetching complaint: {e}")
            return None
    
    @staticmethod
    def get_citizen_complaints(citizen_id: str, skip: int = 0, limit: int = 10) -> List[Dict]:
        """Get complaints for a citizen"""
        try:
            complaints = list(
                MongoDatabase.get_db()[ComplaintService.COLLECTION]
                .find({"citizenId": citizen_id})
                .sort("createdAt", -1)
                .skip(skip)
                .limit(limit)
            )
            return complaints
        except Exception as e:
            logger.error(f"Error fetching citizen complaints: {e}")
            return []
    
    @staticmethod
    def get_ward_complaints(ward: int, skip: int = 0, limit: int = 10) -> List[Dict]:
        """Get complaints for a ward"""
        try:
            complaints = list(
                MongoDatabase.get_db()[ComplaintService.COLLECTION]
                .find({"ward": ward})
                .sort("createdAt", -1)
                .skip(skip)
                .limit(limit)
            )
            return complaints
        except Exception as e:
            logger.error(f"Error fetching ward complaints: {e}")
            return []
    
    @staticmethod
    def update_complaint(complaint_id: str, update_data: Dict) -> bool:
        """Update complaint"""
        try:
            from bson import ObjectId
            update_doc = {
                "status": update_data.get("status"),
                "priority": update_data.get("priority"),
                "remarks": update_data.get("remarks", ""),
                "updatedAt": datetime.utcnow(),
            }
            # Remove None values
            update_doc = {k: v for k, v in update_doc.items() if v is not None}
            
            result = MongoDatabase.get_db()[ComplaintService.COLLECTION].update_one(
                {"_id": ObjectId(complaint_id)},
                {"$set": update_doc}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating complaint: {e}")
            return False
    
    @staticmethod
    def get_complaints_by_status(status: str, skip: int = 0, limit: int = 10) -> List[Dict]:
        """Get complaints by status"""
        try:
            complaints = list(
                MongoDatabase.get_db()[ComplaintService.COLLECTION]
                .find({"status": status})
                .sort("createdAt", -1)
                .skip(skip)
                .limit(limit)
            )
            return complaints
        except Exception as e:
            logger.error(f"Error fetching complaints by status: {e}")
            return []
    
    @staticmethod
    def get_complaint_stats() -> Dict:
        """Get complaint statistics"""
        try:
            total = MongoDatabase.get_db()[ComplaintService.COLLECTION].count_documents({})
            by_status = MongoDatabase.get_db()[ComplaintService.COLLECTION].aggregate([
                {"$group": {"_id": "$status", "count": {"$sum": 1}}}
            ])
            by_priority = MongoDatabase.get_db()[ComplaintService.COLLECTION].aggregate([
                {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
            ])
            by_category = MongoDatabase.get_db()[ComplaintService.COLLECTION].aggregate([
                {"$group": {"_id": "$category", "count": {"$sum": 1}}}
            ])
            
            return {
                "total": total,
                "by_status": {item["_id"]: item["count"] for item in by_status},
                "by_priority": {item["_id"]: item["count"] for item in by_priority},
                "by_category": {item["_id"]: item["count"] for item in by_category},
            }
        except Exception as e:
            logger.error(f"Error fetching complaint stats: {e}")
            return {}

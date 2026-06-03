"""
Grievance Service
"""
from config.database import MongoDatabase
from utils.helper import Helper
from bson import ObjectId
from typing import Optional, List, Dict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class GrievanceService:
    """Grievance business logic"""
    
    @staticmethod
    def create_grievance(grievance_data: dict, user_id: str) -> str:
        """Create grievance"""
        db = MongoDatabase.get_db()
        
        grievance_data["complaintNumber"] = Helper.generate_complaint_number()
        grievance_data["status"] = "NEW"
        grievance_data["escalationLevel"] = 0
        grievance_data["attachments"] = []
        grievance_data["history"] = []
        grievance_data["feedback"] = None
        grievance_data.update(Helper.audit_fields(user_id))
        
        result = db.grievances.insert_one(grievance_data)
        logger.info(f"Grievance created: {result.inserted_id}")
        return str(result.inserted_id)
    
    @staticmethod
    def get_grievance_by_id(grievance_id: str) -> Optional[dict]:
        """Get grievance by ID"""
        db = MongoDatabase.get_db()
        return db.grievances.find_one({
            "_id": ObjectId(grievance_id),
            "isDeleted": False
        })
    
    @staticmethod
    def get_grievance_by_complaint_number(complaint_number: str) -> Optional[dict]:
        """Get grievance by complaint number"""
        db = MongoDatabase.get_db()
        return db.grievances.find_one({
            "complaintNumber": complaint_number,
            "isDeleted": False
        })
    
    @staticmethod
    def list_grievances(skip: int = 0, limit: int = 10, filters: dict = None) -> List[dict]:
        """List grievances"""
        db = MongoDatabase.get_db()
        query = {"isDeleted": False}
        
        if filters:
            if filters.get("status"):
                query["status"] = filters["status"]
            if filters.get("priority"):
                query["priority"] = filters["priority"]
            if filters.get("categoryId"):
                query["categoryId"] = filters["categoryId"]
            if filters.get("citizenId"):
                query["citizenId"] = filters["citizenId"]
            if filters.get("assignedOfficerId"):
                query["assignedOfficerId"] = filters["assignedOfficerId"]
        
        return list(db.grievances.find(query).skip(skip).limit(limit))
    
    @staticmethod
    def update_grievance_status(
        grievance_id: str,
        new_status: str,
        user_id: str,
        remarks: str = None
    ) -> bool:
        """Update grievance status"""
        db = MongoDatabase.get_db()
        
        grievance = GrievanceService.get_grievance_by_id(grievance_id)
        if not grievance:
            return False
        
        old_status = grievance["status"]
        
        # Add history entry
        history_entry = {
            "oldStatus": old_status,
            "newStatus": new_status,
            "remarks": remarks,
            "updatedBy": user_id,
            "createdAt": datetime.utcnow()
        }
        
        result = db.grievances.update_one(
            {"_id": ObjectId(grievance_id)},
            {
                "$set": {
                    "status": new_status,
                    "updatedBy": user_id,
                    "updatedAt": datetime.utcnow()
                },
                "$push": {"history": history_entry}
            }
        )
        return result.modified_count > 0
    
    @staticmethod
    def assign_grievance(
        grievance_id: str,
        officer_id: str,
        assigned_by: str,
        remarks: str = None
    ) -> bool:
        """Assign grievance to officer"""
        db = MongoDatabase.get_db()
        
        return GrievanceService.update_grievance_status(
            grievance_id,
            "ASSIGNED",
            assigned_by,
            f"Assigned to officer. {remarks or ''}"
        ) and db.grievances.update_one(
            {"_id": ObjectId(grievance_id)},
            {"$set": {"assignedOfficerId": officer_id}}
        ).modified_count > 0
    
    @staticmethod
    def add_grievance_feedback(
        grievance_id: str,
        feedback_data: dict
    ) -> bool:
        """Add feedback to grievance"""
        db = MongoDatabase.get_db()
        
        feedback_data["submittedAt"] = datetime.utcnow()
        
        result = db.grievances.update_one(
            {"_id": ObjectId(grievance_id)},
            {"$set": {"feedback": feedback_data}}
        )
        return result.modified_count > 0
    
    @staticmethod
    def add_attachment(
        grievance_id: str,
        file_name: str,
        file_url: str
    ) -> bool:
        """Add attachment to grievance"""
        db = MongoDatabase.get_db()
        
        attachment = {
            "fileName": file_name,
            "fileUrl": file_url,
            "uploadedAt": datetime.utcnow()
        }
        
        result = db.grievances.update_one(
            {"_id": ObjectId(grievance_id)},
            {"$push": {"attachments": attachment}}
        )
        return result.modified_count > 0
    
    @staticmethod
    def get_grievances_by_citizen(citizen_id: str, skip: int = 0, limit: int = 10) -> List[dict]:
        """Get grievances by citizen"""
        db = MongoDatabase.get_db()
        return list(db.grievances.find({
            "citizenId": citizen_id,
            "isDeleted": False
        }).skip(skip).limit(limit))
    
    @staticmethod
    def count_grievances_by_status() -> Dict[str, int]:
        """Count grievances by status"""
        db = MongoDatabase.get_db()
        result = db.grievances.aggregate([
            {"$match": {"isDeleted": False}},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ])
        return {item["_id"]: item["count"] for item in result}


class GrievanceCategoryService:
    """Grievance category business logic"""
    
    @staticmethod
    def create_category(data: dict) -> str:
        """Create category"""
        db = MongoDatabase.get_db()
        data["isActive"] = True
        result = db.grievance_categories.insert_one(data)
        return str(result.inserted_id)
    
    @staticmethod
    def get_all_categories() -> List[dict]:
        """Get all categories"""
        db = MongoDatabase.get_db()
        return list(db.grievance_categories.find({"isActive": True}))
    
    @staticmethod
    def get_category_by_id(category_id: str) -> Optional[dict]:
        """Get category by ID"""
        db = MongoDatabase.get_db()
        return db.grievance_categories.find_one({
            "_id": ObjectId(category_id),
            "isActive": True
        })

"""
Task Service
"""
from config.database import MongoDatabase
from utils.helper import Helper
from bson import ObjectId
from typing import Optional, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class TaskService:
    """Task business logic"""
    
    @staticmethod
    def create_task(task_data: dict, user_id: str) -> str:
        """Create task"""
        db = MongoDatabase.get_db()
        
        task_data["status"] = "PENDING"
        
        # Handle audit fields - use "system" for public creation (when user_id is None)
        audit_user_id = user_id if user_id else "system"
        task_data.update(Helper.audit_fields(audit_user_id))
        
        result = db.tasks.insert_one(task_data)
        return str(result.inserted_id)
    
    @staticmethod
    def get_task_by_id(task_id: str) -> Optional[dict]:
        """Get task by ID"""
        db = MongoDatabase.get_db()
        return db.tasks.find_one({"_id": ObjectId(task_id)})
    
    @staticmethod
    def list_tasks(skip: int = 0, limit: int = 10, filters: dict = None) -> List[dict]:
        """List tasks"""
        db = MongoDatabase.get_db()
        query = {}
        
        if filters:
            if filters.get("status"):
                query["status"] = filters["status"]
            if filters.get("assignedTo"):
                query["assignedTo"] = filters["assignedTo"]
            if filters.get("priority"):
                query["priority"] = filters["priority"]
        
        return list(db.tasks.find(query).skip(skip).limit(limit))
    
    @staticmethod
    def update_task(task_id: str, update_data: dict, updated_by: str) -> bool:
        """Update task"""
        db = MongoDatabase.get_db()
        update_data.update(Helper.audit_fields(updated_by, is_update=True))
        
        result = db.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    @staticmethod
    def get_tasks_by_officer(officer_id: str, skip: int = 0, limit: int = 10) -> List[dict]:
        """Get tasks assigned to officer"""
        db = MongoDatabase.get_db()
        return list(db.tasks.find({
            "assignedTo": officer_id,
            "status": {"$ne": "COMPLETED"}
        }).skip(skip).limit(limit))


class FieldReportService:
    """Field report business logic"""
    
    @staticmethod
    def create_report(report_data: dict) -> str:
        """Create field report"""
        db = MongoDatabase.get_db()
        
        report_data["submittedAt"] = datetime.utcnow()
        
        # Validate and clean gpsLocation - must be valid GeoJSON or null
        gps_location = report_data.get("gpsLocation")
        if gps_location:
            # Check if it's valid GeoJSON Point format
            if not (isinstance(gps_location, dict) and 
                    gps_location.get("type") == "Point" and 
                    isinstance(gps_location.get("coordinates"), list) and 
                    len(gps_location.get("coordinates", [])) == 2):
                # Invalid format, set to null
                logger.warning(f"Invalid gpsLocation format: {gps_location}. Setting to null.")
                report_data["gpsLocation"] = None
        
        result = db.field_reports.insert_one(report_data)
        
        # Update task status
        if report_data.get("taskId"):
            db.tasks.update_one(
                {"_id": ObjectId(report_data["taskId"])},
                {"$set": {"status": "COMPLETED"}}
            )
        
        return str(result.inserted_id)
    
    @staticmethod
    def get_report_by_task(task_id: str) -> Optional[dict]:
        """Get report by task"""
        db = MongoDatabase.get_db()
        return db.field_reports.find_one({"taskId": task_id})
    
    @staticmethod
    def get_reports_by_officer(officer_id: str, skip: int = 0, limit: int = 10) -> List[dict]:
        """Get reports by officer"""
        db = MongoDatabase.get_db()
        return list(db.field_reports.find({
            "officerId": officer_id
        }).skip(skip).limit(limit))

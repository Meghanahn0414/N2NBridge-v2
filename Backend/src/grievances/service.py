"""
Grievance Service
"""
import logging
from datetime import datetime
from typing import Dict, List, Optional

from bson import ObjectId
from config.database import MongoDatabase
from bson import ObjectId
from typing import Optional, List, Dict
from datetime import datetime
import logging
from utils.email_service import send_email
from utils.helper import Helper
from utils.id_generator import IDGenerator

logger = logging.getLogger(__name__)


class GrievanceService:
    """Grievance business logic"""
    
    @staticmethod
    def _populate_citizen_name(grievance: dict) -> dict:
        """Attach citizen fullName from profile if missing."""
        if not grievance or not grievance.get("citizenId"):
            return grievance
        if grievance.get("citizenName"):
            return grievance

        db = MongoDatabase.get_db()
        try:
            user = db.users.find_one(
                {"_id": ObjectId(grievance["citizenId"]), "isDeleted": False},
                {"fullName": 1}
            )
            if user and user.get("fullName"):
                grievance["citizenName"] = user["fullName"]
        except Exception:
            logger.warning(f"Unable to resolve citizen name for citizenId={grievance.get('citizenId')}")

        return grievance

    @staticmethod
    def create_grievance(grievance_data: dict, user_id: str) -> str:
        """Create grievance"""
        db = MongoDatabase.get_db()
        
        # Generate unique 4-digit grievance ID
        grievance_data["grievanceId"] = IDGenerator.generate_grievance_id()
        grievance_data["complaintNumber"] = Helper.generate_complaint_number()
        grievance_data["status"] = "NEW"
        grievance_data["escalationLevel"] = 0
        grievance_data["attachments"] = []
        grievance_data["history"] = []
        grievance_data["feedback"] = None
        
        # Validate and clean gpsLocation - must be valid GeoJSON or null
        gps_location = grievance_data.get("gpsLocation")
        if gps_location:
            # Check if it's valid GeoJSON Point format
            if not (isinstance(gps_location, dict) and 
                    gps_location.get("type") == "Point" and 
                    isinstance(gps_location.get("coordinates"), list) and 
                    len(gps_location.get("coordinates", [])) == 2):
                # Invalid format, set to null
                logger.warning(f"Invalid gpsLocation format: {gps_location}. Setting to null.")
                grievance_data["gpsLocation"] = None
        
        # Store citizen name for activity feeds and complaint display
        citizen_id = grievance_data.get("citizenId")
        if citizen_id:
            try:
                user = db.users.find_one({"_id": ObjectId(citizen_id), "isDeleted": False}, {"fullName": 1})
                if user and user.get("fullName"):
                    grievance_data["citizenName"] = user["fullName"]
            except Exception:
                logger.warning(f"Unable to resolve citizen name for citizenId={citizen_id}")

        # Handle audit fields - use "system" for public creation (when user_id is None)
        audit_user_id = user_id if user_id else "system"
        grievance_data.update(Helper.audit_fields(audit_user_id))
        
        result = db.grievances.insert_one(grievance_data)
        inserted_id = str(result.inserted_id)
        logger.info(f"Grievance created with ID {grievance_data['grievanceId']}: {inserted_id}")

        # Notify staff roles (non-blocking)
        try:
            GrievanceService._notify_staff_on_new_grievance({**grievance_data, "_id": result.inserted_id})
        except Exception as e:
            logger.warning(f"Staff notification failed (non-fatal): {e}")

        return inserted_id
    
    @staticmethod
    def get_grievance_by_id(grievance_id: str) -> Optional[dict]:
        """Get grievance by ID"""
        db = MongoDatabase.get_db()
        grievance = db.grievances.find_one({
            "_id": ObjectId(grievance_id),
            "isDeleted": {"$ne": True}
        })
        return GrievanceService._populate_citizen_name(grievance)
    
    @staticmethod
    def get_grievance_by_complaint_number(complaint_number: str) -> Optional[dict]:
        """Get grievance by complaint number"""
        db = MongoDatabase.get_db()
        grievance = db.grievances.find_one({
            "complaintNumber": complaint_number,
            "isDeleted": False
        })
        return GrievanceService._populate_citizen_name(grievance)
    
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
        
        grievances = list(db.grievances.find(query).sort("createdAt", -1).skip(skip).limit(limit))
        grievances = [GrievanceService._populate_citizen_name(g) for g in grievances]

        # Batch-resolve assigned officer names in a single DB query
        officer_ids = list({g["assignedOfficerId"] for g in grievances if g.get("assignedOfficerId")})
        if officer_ids:
            try:
                officer_docs = db.users.find(
                    {"_id": {"$in": [ObjectId(oid) for oid in officer_ids]}},
                    {"fullName": 1}
                )
                officer_map = {str(u["_id"]): u.get("fullName", "") for u in officer_docs}
                for g in grievances:
                    oid = g.get("assignedOfficerId")
                    if oid:
                        g["assignedOfficerName"] = officer_map.get(oid, "")
            except Exception:
                logger.warning("Unable to batch-resolve officer names")

        return grievances
    
    @staticmethod
    def _notify_staff_on_new_grievance(grievance: dict) -> None:
        """Notify all staff roles when a new grievance is filed."""
        try:
            from notifications.service import NotificationService
            db = MongoDatabase.get_db()
            complaint_num = grievance.get("complaintNumber") or grievance.get("grievanceId", "")
            category      = grievance.get("category") or grievance.get("categoryId") or "General"
            title = f"New Grievance Filed — {complaint_num}"
            body  = f"A new complaint has been submitted: {category}. Complaint #{complaint_num}."
            staff_roles = ["ADMIN", "REPRESENTATIVE", "CONSTITUENCY_MANAGER", "MANAGER"]
            staff_users = list(db.users.find(
                {"role": {"$in": staff_roles}, "isDeleted": {"$ne": True}, "status": "ACTIVE"},
                {"_id": 1}
            ))
            now = datetime.utcnow()
            if staff_users:
                records = [
                    {"userId": str(u["_id"]), "title": title, "body": body,
                     "type": "NEW_GRIEVANCE", "isRead": False, "createdAt": now}
                    for u in staff_users
                ]
                db.notifications.insert_many(records)
                logger.info(f"Notified {len(records)} staff users of new grievance {complaint_num}")
        except Exception as e:
            logger.warning(f"_notify_staff_on_new_grievance error (non-fatal): {e}")

    @staticmethod
    def _notify_officer_on_assignment(grievance: dict, officer_id: str) -> None:
        """Notify a field officer when a grievance is assigned to them."""
        try:
            from notifications.service import NotificationService
            complaint_num = grievance.get("complaintNumber") or grievance.get("grievanceId", "")
            category      = grievance.get("category") or grievance.get("categoryId") or "General"
            NotificationService.create_notification({
                "userId":    officer_id,
                "title":     f"New Assignment — {complaint_num}",
                "body":      f"Grievance {complaint_num} ({category}) has been assigned to you.",
                "type":      "ASSIGNMENT",
                "isRead":    False,
                "createdAt": datetime.utcnow(),
            })
        except Exception as e:
            logger.warning(f"_notify_officer_on_assignment error (non-fatal): {e}")

    @staticmethod
    def _notify_citizen_on_status_change(grievance: dict, new_status: str) -> None:
        """Send status-update notification via citizen's preferred channel."""
        try:
            citizen_id = grievance.get("citizenId") or ""
            if not citizen_id:
                return
            db = MongoDatabase.get_db()
            citizen = db.users.find_one({"_id": ObjectId(citizen_id), "isDeleted": {"$ne": True}})
            if not citizen:
                return

            complaint_num = grievance.get("complaintNumber") or grievance.get("_id", "")
            status_label  = new_status.replace("_", " ").title()
            title = f"Grievance Update — {complaint_num}"
            body  = f"Your complaint ({complaint_num}) status has changed to: {status_label}."

            channel = (citizen.get("notifPreferences") or {}).get("channel", "Notifications")

            if channel == "Email":
                email = citizen.get("email")
                if email:
                    try:
                        body_text = f"Hello {citizen.get('fullName', 'Citizen')},\n\n{body}\n\nThank you,\nN2N Team"
                        email_sent = send_email(email, title, body_text)
                        if not email_sent:
                            logger.warning(f"Grievance email notification failed for {email}")
                    except Exception as e:
                        logger.warning(f"Grievance email notification failed: {e}")

            elif channel == "SMS":
                mobile = citizen.get("mobile")
                if mobile:
                    try:
                        from utils.sms_service import send_otp_via_sms
                        send_otp_via_sms(mobile, "", message=body)
                    except Exception as e:
                        logger.warning(f"Grievance SMS notification failed: {e}")

            else:
                # In-app notification (default)
                try:
                    from notifications.service import NotificationService
                    NotificationService.create_notification({
                        "userId": citizen_id,
                        "title":  title,
                        "body":   body,
                        "type":   "GRIEVANCE_UPDATE",
                        "isRead": False,
                        "createdAt": datetime.utcnow(),
                    })
                except Exception as e:
                    logger.warning(f"Grievance in-app notification failed: {e}")
        except Exception as e:
            logger.warning(f"_notify_citizen_on_status_change error (non-fatal): {e}")

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

        if result.modified_count > 0 and old_status != new_status:
            GrievanceService._notify_citizen_on_status_change(grievance, new_status)

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

        # Always attempt status update (no-op if already ASSIGNED)
        GrievanceService.update_grievance_status(
            grievance_id,
            "ASSIGNED",
            assigned_by,
            f"Assigned to officer. {remarks or ''}"
        )
        # Force-write officer + updatedAt so modified_count is always 1
        db.grievances.update_one(
            {"_id": ObjectId(grievance_id)},
            {"$set": {"assignedOfficerId": officer_id, "updatedAt": datetime.utcnow()}}
        )

        grievance = GrievanceService.get_grievance_by_id(grievance_id)
        if grievance:
            GrievanceService._notify_officer_on_assignment(grievance, officer_id)

        return True
    
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
        grievances = list(db.grievances.find({
            "citizenId": citizen_id,
            "isDeleted": False
        }).skip(skip).limit(limit))
        return [GrievanceService._populate_citizen_name(g) for g in grievances]
    
    @staticmethod
    def count_grievances_by_status() -> Dict[str, int]:
        """Count grievances by status"""
        db = MongoDatabase.get_db()
        result = db.grievances.aggregate([
            {"$match": {"isDeleted": False}},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ])
        return {item["_id"]: item["count"] for item in result}

    @staticmethod
    def count_grievances_by_citizen_and_status(citizen_id: str) -> Dict[str, int]:
        """Count grievances for a specific citizen, grouped by status"""
        db = MongoDatabase.get_db()
        result = db.grievances.aggregate([
            {"$match": {"citizenId": citizen_id, "isDeleted": False}},
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

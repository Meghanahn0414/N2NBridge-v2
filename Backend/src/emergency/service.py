"""
Emergency SOS Service
"""
import logging
from datetime import datetime
from typing import Dict, List, Optional

from config.database import MongoDatabase

logger = logging.getLogger(__name__)


class EmergencySOSService:
    """Service for emergency SOS operations"""
    
    COLLECTION = "emergency_sos"
    
    @staticmethod
    def create_sos_alert(sos_data: Dict) -> str:
        """Create a new emergency SOS alert"""
        try:
            # Generate SOS ticket ID
            sos_ticket_id = f"SOS-{int(datetime.utcnow().timestamp() * 1000)}"
            
            sos_doc = {
                "sosTicketId": sos_ticket_id,
                "citizenId": sos_data.get("citizenId"),
                "type": sos_data.get("type"),
                "details": sos_data.get("details"),
                "latitude": sos_data.get("latitude"),
                "longitude": sos_data.get("longitude"),
                "shareLocation": sos_data.get("shareLocation", False),
                "status": "REPORTED",
                "acknowledgedBy": [],
                "createdAt": datetime.utcnow(),
                "resolvedAt": None,
                "resolvedBy": None,
            }
            
            result = MongoDatabase.get_db()[EmergencySOSService.COLLECTION].insert_one(sos_doc)
            logger.info(f"Emergency SOS alert created: {sos_ticket_id}")
            
            # TODO: Send notifications to ward officers
            EmergencySOSService._broadcast_to_officers(sos_doc)
            
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error creating emergency SOS alert: {e}")
            raise
    
    @staticmethod
    def _broadcast_to_officers(sos_doc: Dict):
        """Broadcast emergency alert to nearby officers"""
        try:
            # Get ward from GPS location or use citizen's ward
            # For now, just log the broadcast
            logger.info(f"Broadcasting emergency alert {sos_doc['sosTicketId']} to field officers")
            
            # TODO: Implement notification service
            # - Get all field officers in the area (based on GPS or ward)
            # - Send push notifications
            # - Send SMS alerts
            # - Log in notifications collection
        except Exception as e:
            logger.error(f"Error broadcasting emergency alert: {e}")
    
    @staticmethod
    def get_sos_by_id(sos_id: str) -> Optional[Dict]:
        """Get emergency SOS alert by ID"""
        try:
            from bson import ObjectId
            sos = MongoDatabase.get_db()[EmergencySOSService.COLLECTION].find_one(
                {"_id": ObjectId(sos_id)}
            )
            return sos
        except Exception as e:
            logger.error(f"Error fetching emergency SOS alert: {e}")
            return None
    
    @staticmethod
    def get_sos_by_ticket_id(sos_ticket_id: str) -> Optional[Dict]:
        """Get emergency SOS alert by ticket ID"""
        try:
            sos = MongoDatabase.get_db()[EmergencySOSService.COLLECTION].find_one(
                {"sosTicketId": sos_ticket_id}
            )
            return sos
        except Exception as e:
            logger.error(f"Error fetching emergency SOS alert: {e}")
            return None
    
    @staticmethod
    def get_citizen_sos_alerts(citizen_id: str, skip: int = 0, limit: int = 10) -> List[Dict]:
        """Get SOS alerts for a citizen"""
        try:
            alerts = list(
                MongoDatabase.get_db()[EmergencySOSService.COLLECTION]
                .find({"citizenId": citizen_id})
                .sort("createdAt", -1)
                .skip(skip)
                .limit(limit)
            )
            return alerts
        except Exception as e:
            logger.error(f"Error fetching citizen SOS alerts: {e}")
            return []
    
    @staticmethod
    def acknowledge_sos(sos_id: str, officer_id: str) -> bool:
        """Acknowledge SOS alert by officer"""
        try:
            from bson import ObjectId
            result = MongoDatabase.get_db()[EmergencySOSService.COLLECTION].update_one(
                {"_id": ObjectId(sos_id)},
                {
                    "$set": {
                        "status": "ACKNOWLEDGED",
                    },
                    "$addToSet": {
                        "acknowledgedBy": {
                            "officerId": officer_id,
                            "acknowledgedAt": datetime.utcnow(),
                        }
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error acknowledging SOS alert: {e}")
            return False
    
    @staticmethod
    def resolve_sos(sos_id: str, officer_id: str) -> bool:
        """Mark SOS alert as resolved"""
        try:
            from bson import ObjectId
            result = MongoDatabase.get_db()[EmergencySOSService.COLLECTION].update_one(
                {"_id": ObjectId(sos_id)},
                {
                    "$set": {
                        "status": "RESOLVED",
                        "resolvedBy": officer_id,
                        "resolvedAt": datetime.utcnow(),
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error resolving SOS alert: {e}")
            return False
    
    @staticmethod
    def get_active_sos_alerts(skip: int = 0, limit: int = 100) -> List[Dict]:
        """Get all active SOS alerts (for officers/admins)"""
        try:
            alerts = list(
                MongoDatabase.get_db()[EmergencySOSService.COLLECTION]
                .find({"status": {"$in": ["REPORTED", "ACKNOWLEDGED", "IN_PROGRESS"]}})
                .sort("createdAt", -1)
                .skip(skip)
                .limit(limit)
            )
            return alerts
        except Exception as e:
            logger.error(f"Error fetching active SOS alerts: {e}")
            return []
    
    @staticmethod
    def get_sos_stats() -> Dict:
        """Get SOS statistics"""
        try:
            total = MongoDatabase.get_db()[EmergencySOSService.COLLECTION].count_documents({})
            by_status = list(
                MongoDatabase.get_db()[EmergencySOSService.COLLECTION].aggregate([
                    {"$group": {"_id": "$status", "count": {"$sum": 1}}}
                ])
            )
            by_type = list(
                MongoDatabase.get_db()[EmergencySOSService.COLLECTION].aggregate([
                    {"$group": {"_id": "$type", "count": {"$sum": 1}}}
                ])
            )
            
            return {
                "total": total,
                "by_status": {item["_id"]: item["count"] for item in by_status},
                "by_type": {item["_id"]: item["count"] for item in by_type},
            }
        except Exception as e:
            logger.error(f"Error fetching SOS stats: {e}")
            return {}

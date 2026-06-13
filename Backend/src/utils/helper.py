"""
Helper Utilities
"""
from datetime import datetime
import uuid
import logging
from typing import Optional, Dict, Any
from bson import ObjectId

logger = logging.getLogger(__name__)


class Helper:
    """Helper utilities"""
    
    @staticmethod
    def generate_complaint_number() -> str:
        """Generate unique complaint number"""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        random_part = str(uuid.uuid4())[:8].upper()
        return f"GRV{timestamp}{random_part}"
    
    @staticmethod
    def generate_alert_number() -> str:
        """Generate unique alert number"""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        random_part = str(uuid.uuid4())[:8].upper()
        return f"ALT{timestamp}{random_part}"
    
    @staticmethod
    def generate_qr_code(event_id: str, citizen_id: str) -> str:
        """Generate QR code string"""
        return f"{event_id}:{citizen_id}:{uuid.uuid4()}"
    
    @staticmethod
    def paginate(page: int = 1, per_page: int = 10) -> tuple:
        """Get skip and limit for pagination"""
        if page < 1:
            page = 1
        skip = (page - 1) * per_page
        return skip, per_page
    
    @staticmethod
    def build_audit_entry(user_id: str, module: str, action: str, old_data: dict, new_data: dict, ip_address: str = None):
        """Build audit log entry"""
        return {
            "userId": user_id,
            "module": module,
            "action": action,
            "oldData": old_data,
            "newData": new_data,
            "ipAddress": ip_address,
            "createdAt": datetime.utcnow()
        }
    
    @staticmethod
    def soft_delete_fields():
        """Get soft delete fields"""
        return {
            "isDeleted": True,
            "deletedAt": datetime.utcnow()
        }
    
    @staticmethod
    def audit_fields(user_id: str, is_update: bool = False):
        """Get audit fields"""
        fields = {
            "updatedBy": user_id,
            "updatedAt": datetime.utcnow()
        }
        if not is_update:
            fields["createdBy"] = user_id
            fields["createdAt"] = datetime.utcnow()
            fields["isDeleted"] = False
            fields["deletedAt"] = None
        return fields
    
    @staticmethod
    def convert_mongo_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
        """Convert MongoDB document to JSON-serializable dict, handling nested ObjectIds"""
        if not doc:
            return {}
        result = {}
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, dict):
                result[key] = Helper.convert_mongo_doc(value)
            elif isinstance(value, list):
                result[key] = [
                    Helper.convert_mongo_doc(v) if isinstance(v, dict)
                    else str(v) if isinstance(v, ObjectId)
                    else v
                    for v in value
                ]
            else:
                result[key] = value
        return result

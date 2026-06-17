"""
Campaign Service
"""
from config.database import MongoDatabase
from utils.helper import Helper
from bson import ObjectId
from typing import Optional, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)



class CampaignService:

    @staticmethod
    def create_campaign(data: dict, created_by: str) -> str:
        db = MongoDatabase.get_db()
        data["status"] = "DRAFT"
        data.update(Helper.audit_fields(created_by or "system"))
        result = db.campaigns.insert_one(data)
        return str(result.inserted_id)

    @staticmethod
    def get_campaign_by_id(campaign_id: str) -> Optional[dict]:
        db = MongoDatabase.get_db()
        return db.campaigns.find_one({"_id": ObjectId(campaign_id), "isDeleted": {"$ne": True}})

    @staticmethod
    def list_campaigns(skip: int = 0, limit: int = 100, filters: dict = None) -> List[dict]:
        db = MongoDatabase.get_db()
        query = {"isDeleted": {"$ne": True}}
        if filters:
            if filters.get("status"):
                query["status"] = filters["status"]
            if filters.get("type"):
                query["type"] = filters["type"]
        return list(db.campaigns.find(query).sort("createdAt", -1).skip(skip).limit(limit))

    @staticmethod
    def update_campaign(campaign_id: str, data: dict, updated_by: str) -> bool:
        db = MongoDatabase.get_db()
        data.update(Helper.audit_fields(updated_by or "system", is_update=True))
        result = db.campaigns.update_one(
            {"_id": ObjectId(campaign_id), "isDeleted": {"$ne": True}},
            {"$set": data}
        )
        return result.modified_count > 0

    @staticmethod
    def delete_campaign(campaign_id: str, deleted_by: str) -> bool:
        db = MongoDatabase.get_db()
        result = db.campaigns.update_one(
            {"_id": ObjectId(campaign_id)},
            {"$set": {
                "isDeleted": True,
                "updatedAt": datetime.utcnow(),
                "updatedBy": deleted_by or "system"
            }}
        )
        return result.modified_count > 0

    @staticmethod
    def launch_campaign(campaign_id: str, updated_by: str) -> bool:
        db = MongoDatabase.get_db()

        campaign = db.campaigns.find_one(
            {"_id": ObjectId(campaign_id), "isDeleted": {"$ne": True}}
        )
        if not campaign:
            return False

        result = db.campaigns.update_one(
            {"_id": ObjectId(campaign_id)},
            {"$set": {
                "status": "ACTIVE",
                "launchedAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
                "updatedBy": updated_by or "system",
            }}
        )

        if result.modified_count > 0:
            from tasks.background import send_campaign_notifications
            try:
                send_campaign_notifications.delay(campaign_id)
                logger.info(f"Campaign {campaign_id} launched; notifications queued via Celery")
            except Exception as exc:
                logger.warning(
                    f"Celery unavailable ({exc}); running campaign notifications synchronously"
                )
                try:
                    send_campaign_notifications(campaign_id)
                except Exception as inner:
                    logger.error(f"Synchronous campaign notifications failed: {inner}")
            return True

        return False

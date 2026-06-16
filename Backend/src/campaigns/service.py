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


def _resolve_target_users(db, target_audience: list) -> List[str]:
    """Return user_id strings for the given audience list."""
    if not target_audience:
        return []

    query = {"isDeleted": {"$ne": True}, "role": "CITIZEN"}

    # "All Citizens" or no specific filter → all citizens
    if "All Citizens" in target_audience or not target_audience:
        pass  # query already targets all citizens
    # For Specific Ward / Constituency we can extend later;
    # for now they also resolve to all citizens since no ward ID is stored on the campaign
    users = db.users.find(query, {"_id": 1})
    return [str(u["_id"]) for u in users]


def _send_push_notifications(db, campaign: dict) -> int:
    """Create in-app notification records for each resolved user. Returns count sent."""
    channels = campaign.get("channels") or []
    if "Push Notification" not in channels:
        return 0

    audience = campaign.get("targetAudience") or []
    user_ids = _resolve_target_users(db, audience)
    if not user_ids:
        return 0

    title = f"📢 {campaign.get('name', 'New Campaign')}"
    body = campaign.get("message") or f"A new {campaign.get('type', 'awareness')} campaign has been launched."

    now = datetime.utcnow()
    notifications = [
        {
            "userId": uid,
            "title": title,
            "body": body,
            "type": "CAMPAIGN",
            "campaignId": str(campaign["_id"]),
            "isRead": False,
            "createdAt": now,
        }
        for uid in user_ids
    ]

    if notifications:
        db.notifications.insert_many(notifications)
    logger.info(f"Campaign {campaign['_id']}: sent push notifications to {len(notifications)} users")
    return len(notifications)


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
            # Fetch updated doc so _id is available
            campaign["status"] = "ACTIVE"
            sent = _send_push_notifications(db, campaign)
            logger.info(f"Campaign {campaign_id} launched; {sent} notifications queued")
            return True

        return False

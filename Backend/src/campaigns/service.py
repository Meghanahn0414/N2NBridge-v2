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
        requested_status = data.get("status", "DRAFT")
        data["status"] = "DRAFT"  # always start as DRAFT
        data.update(Helper.audit_fields(created_by or "system"))
        result = db.campaigns.insert_one(data)
        campaign_id = str(result.inserted_id)

        # Auto-launch if caller wanted ACTIVE
        if requested_status == "ACTIVE":
            campaign = db.campaigns.find_one({"_id": result.inserted_id})
            if campaign:
                db.campaigns.update_one(
                    {"_id": result.inserted_id},
                    {"$set": {"status": "ACTIVE", "launchedAt": datetime.utcnow(), "updatedAt": datetime.utcnow()}}
                )
                _send_notifications_sync(db, campaign, campaign_id)

        return campaign_id

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
        if result.modified_count > 0:
            deleted = db.notifications.delete_many({"campaignId": campaign_id})
            logger.info(f"Campaign {campaign_id} deleted; removed {deleted.deleted_count} notifications")
        return result.modified_count > 0

    @staticmethod
    def cancel_campaign(campaign_id: str, cancelled_by: str) -> bool:
        """Cancel campaign — sets status to CANCELLED, keeps record in DB"""
        db = MongoDatabase.get_db()
        result = db.campaigns.update_one(
            {"_id": ObjectId(campaign_id), "isDeleted": {"$ne": True}},
            {"$set": {
                "status": "CANCELLED",
                "cancelledAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
                "updatedBy": cancelled_by or "system",
            }}
        )
        return result.matched_count > 0

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
            # Send notifications synchronously first so they are guaranteed to fire,
            # then also queue via Celery if available for push delivery.
            sent = _send_notifications_sync(db, campaign, campaign_id)
            logger.info(f"Campaign {campaign_id} launched; {sent} notifications created")
            try:
                from tasks.background import send_campaign_notifications
                send_campaign_notifications.delay(campaign_id)
            except Exception:
                pass  # Celery push is best-effort; in-app notifications already created above
            return True

        return False


def _send_notifications_sync(db, campaign: dict, campaign_id: str) -> int:
    """Create in-app notifications for all target citizens synchronously."""
    try:
        ward_id = campaign.get("wardId")
        query = {"role": "CITIZEN", "isDeleted": {"$ne": True}}
        if ward_id:
            query["wardId"] = ward_id

        citizens = list(db.users.find(query, {"_id": 1}))
        if not citizens:
            logger.warning(f"Campaign {campaign_id}: no matching citizens found")
            return 0

        title = f"New Campaign: {campaign.get('name', 'New Campaign')}"
        body = (
            campaign.get("message")
            or f"A new {campaign.get('type', 'awareness')} campaign has been launched."
        )
        if ward_id:
            body = f"[Ward update] {body}"

        now = datetime.utcnow()
        records = [
            {
                "userId": str(c["_id"]),
                "title": title,
                "body": body,
                "type": "CAMPAIGN",
                "campaignId": campaign_id,
                "wardId": ward_id,
                "isRead": False,
                "createdAt": now,
            }
            for c in citizens
        ]

        batch_size = 500
        for i in range(0, len(records), batch_size):
            db.notifications.insert_many(records[i : i + batch_size], ordered=False)

        # Update campaign's reach count
        reach = len(records)
        db.campaigns.update_one(
            {"_id": ObjectId(campaign_id)},
            {"$set": {"reach": reach, "updatedAt": datetime.utcnow()}}
        )

        return reach
    except Exception as exc:
        logger.error(f"_send_notifications_sync error for campaign {campaign_id}: {exc}")
        return 0

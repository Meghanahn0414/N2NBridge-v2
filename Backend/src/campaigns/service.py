import logging
from typing import List, Optional

from bson import ObjectId
from config.database import MongoDatabase
from utils.helper import Helper

logger = logging.getLogger(__name__)


class CampaignService:
    @staticmethod
    def create_campaign(campaign_data: dict, user_id: str) -> str:
        db = MongoDatabase.get_db()
        campaign_data.setdefault("status", "DRAFT")
        campaign_data.update(Helper.audit_fields(user_id or "system"))
        result = db.campaigns.insert_one(campaign_data)
        return str(result.inserted_id)

    @staticmethod
    def get_campaign_by_id(campaign_id: str) -> Optional[dict]:
        db = MongoDatabase.get_db()
        return db.campaigns.find_one({"_id": ObjectId(campaign_id)})

    @staticmethod
    def list_campaigns(skip: int = 0, limit: int = 10, filters: dict = None) -> List[dict]:
        db = MongoDatabase.get_db()
        query = {}
        if filters:
            if filters.get("status"):
                query["status"] = filters["status"]
        return list(db.campaigns.find(query).skip(skip).limit(limit))

    @staticmethod
    def update_campaign(campaign_id: str, update_data: dict, updated_by: str) -> bool:
        db = MongoDatabase.get_db()
        update_data.update(Helper.audit_fields(updated_by or "system", is_update=True))
        result = db.campaigns.update_one({"_id": ObjectId(campaign_id)}, {"$set": update_data})
        return result.modified_count > 0

    @staticmethod
    def delete_campaign(campaign_id: str) -> bool:
        db = MongoDatabase.get_db()
        result = db.campaigns.delete_one({"_id": ObjectId(campaign_id)})
        return result.deleted_count > 0

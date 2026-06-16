"""
Campaign Routes
"""
import logging
from typing import Optional

from campaigns.model import CampaignCreate, CampaignResponse, CampaignUpdate
from campaigns.service import CampaignService
from fastapi import APIRouter, HTTPException, Query
from utils.helper import Helper

router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])
logger = logging.getLogger(__name__)


@router.get("/", response_model=list[CampaignResponse])
async def list_campaigns(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=1000),
    status: Optional[str] = None,
    type: Optional[str] = None,
):
    skip, limit = Helper.paginate(page, per_page)
    filters = {}
    if status:
        filters["status"] = status
    if type:
        filters["type"] = type
    campaigns = CampaignService.list_campaigns(skip, limit, filters)
    return [CampaignResponse(**Helper.convert_mongo_doc(c)) for c in campaigns]


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(campaign_id: str):
    campaign = CampaignService.get_campaign_by_id(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return CampaignResponse(**Helper.convert_mongo_doc(campaign))


@router.post("/", response_model=CampaignResponse)
async def create_campaign(data: CampaignCreate):
    campaign_id = CampaignService.create_campaign(data.model_dump(), None)
    campaign = CampaignService.get_campaign_by_id(campaign_id)
    return CampaignResponse(**Helper.convert_mongo_doc(campaign))


@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(campaign_id: str, data: CampaignUpdate):
    success = CampaignService.update_campaign(
        campaign_id, data.model_dump(exclude_unset=True), None
    )
    if not success:
        raise HTTPException(status_code=404, detail="Campaign not found or no changes made")
    campaign = CampaignService.get_campaign_by_id(campaign_id)
    return CampaignResponse(**Helper.convert_mongo_doc(campaign))


@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str):
    success = CampaignService.delete_campaign(campaign_id, None)
    if not success:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"success": True, "message": "Campaign deleted"}


@router.post("/{campaign_id}/launch", response_model=CampaignResponse)
async def launch_campaign(campaign_id: str):
    success = CampaignService.launch_campaign(campaign_id, None)
    if not success:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign = CampaignService.get_campaign_by_id(campaign_id)
    return CampaignResponse(**Helper.convert_mongo_doc(campaign))


@router.post("/{campaign_id}/notify")
async def send_campaign_notifications(campaign_id: str):
    """Re-send / send push notifications for an existing campaign."""
    from campaigns.service import _send_push_notifications
    from config.database import MongoDatabase
    from bson import ObjectId
    db = MongoDatabase.get_db()
    campaign = db.campaigns.find_one({"_id": ObjectId(campaign_id), "isDeleted": {"$ne": True}})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    sent = _send_push_notifications(db, campaign)
    return {"success": True, "notified": sent, "message": f"Notifications sent to {sent} users"}

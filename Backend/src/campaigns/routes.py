import logging
from typing import Optional

from campaigns.model import CampaignCreate, CampaignResponse
from campaigns.service import CampaignService
from fastapi import APIRouter, HTTPException, Query
from utils.helper import Helper

router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])
logger = logging.getLogger(__name__)


@router.get("/", response_model=list[CampaignResponse])
async def list_campaigns(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=1000),
    status: Optional[str] = None,
):
    skip, limit = Helper.paginate(page, per_page)
    filters = {"status": status} if status else None
    campaigns = CampaignService.list_campaigns(skip, limit, filters)
    return [CampaignResponse(**Helper.convert_mongo_doc(c)) for c in campaigns]


@router.post("/", response_model=CampaignResponse)
async def create_campaign(campaign_data: CampaignCreate):
    campaign_id = CampaignService.create_campaign(campaign_data.dict(), None)
    campaign = CampaignService.get_campaign_by_id(campaign_id)
    if not campaign:
        raise HTTPException(status_code=500, detail="Failed to create campaign")
    return CampaignResponse(**Helper.convert_mongo_doc(campaign))


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(campaign_id: str):
    campaign = CampaignService.get_campaign_by_id(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return CampaignResponse(**Helper.convert_mongo_doc(campaign))


@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(campaign_id: str, update_data: CampaignCreate):
    success = CampaignService.update_campaign(campaign_id, update_data.dict(exclude_unset=True), None)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update campaign")
    campaign = CampaignService.get_campaign_by_id(campaign_id)
    return CampaignResponse(**Helper.convert_mongo_doc(campaign))


@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str):
    success = CampaignService.delete_campaign(campaign_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete campaign")
    return {"success": True, "message": "Campaign deleted successfully"}

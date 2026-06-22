"""
Campaign Routes
"""
import logging
from typing import Optional

from campaigns.model import CampaignCreate, CampaignResponse, CampaignUpdate
from campaigns.service import CampaignService
from fastapi import APIRouter, HTTPException, Query, File, UploadFile
from utils.helper import Helper

router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])
logger = logging.getLogger(__name__)


@router.get("/citizen-count")
async def get_citizen_count():
    """Total registered citizens — used by Broadcasts page for reach estimate."""
    from config.database import MongoDatabase
    db = MongoDatabase.get_db()
    count = db.users.count_documents({"role": "CITIZEN", "isDeleted": {"$ne": True}})
    return {"count": count}


@router.get("/audience-wards")
async def get_audience_wards():
    """Return distinct ward values that have registered citizens."""
    from config.database import MongoDatabase
    db = MongoDatabase.get_db()

    # wardId is stored as a plain string on citizen profiles (e.g. "Ward 21")
    ward_values = db.users.distinct(
        "wardId",
        {"role": "CITIZEN", "isDeleted": {"$ne": True}, "wardId": {"$nin": [None, ""]}}
    )

    results = [{"id": str(w), "name": str(w)} for w in sorted(ward_values, key=str)]
    return {"wards": results}


@router.get("/constituents/stats")
async def get_constituents_stats():
    """Aggregate citizen stats for the Constituents dashboard page."""
    from config.database import MongoDatabase
    from datetime import datetime, timedelta
    db = MongoDatabase.get_db()

    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    sixty_days_ago  = now - timedelta(days=60)

    base_q = {"role": "CITIZEN", "isDeleted": {"$ne": True}}

    total      = db.users.count_documents(base_q)
    new_30d    = db.users.count_documents({**base_q, "createdAt": {"$gte": thirty_days_ago}})
    new_prev30 = db.users.count_documents({**base_q, "createdAt": {"$gte": sixty_days_ago, "$lt": thirty_days_ago}})
    new_pct    = round(((new_30d - new_prev30) / new_prev30 * 100) if new_prev30 > 0 else 0)

    # Verified = citizen has wardId + age filled in
    verified = db.users.count_documents({**base_q, "wardId": {"$nin": [None, ""]}, "age": {"$exists": True, "$ne": None}})

    # Active 30d = citizens who submitted at least 1 grievance in last 30 days
    active_citizen_ids = db.grievances.distinct("citizenId", {"createdAt": {"$gte": thirty_days_ago}})
    active_30d = len([c for c in active_citizen_ids if c])  # exclude null/empty citizenId

    # Engagement funnel — citizens with 1+, 2+, 5+ complaints
    pipeline_engaged = [
        {"$match": {}},
        {"$group": {"_id": "$citizenId", "count": {"$sum": 1}}},
        {"$match": {"count": {"$gte": 2}}},
        {"$count": "total"},
    ]
    engaged_res = list(db.grievances.aggregate(pipeline_engaged))
    engaged = engaged_res[0]["total"] if engaged_res else 0

    pipeline_advocates = [
        {"$match": {}},
        {"$group": {"_id": "$citizenId", "count": {"$sum": 1}}},
        {"$match": {"count": {"$gte": 5}}},
        {"$count": "total"},
    ]
    advocate_res = list(db.grievances.aggregate(pipeline_advocates))
    advocates = advocate_res[0]["total"] if advocate_res else 0

    # Ward breakdown (top 5 wards by size)
    ward_pipeline = [
        {"$match": {**base_q, "wardId": {"$nin": [None, ""]}}},
        {"$group": {"_id": "$wardId", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
    ]
    wards = [{"ward": w["_id"], "count": w["count"]} for w in db.users.aggregate(ward_pipeline)]

    # Gender breakdown
    gender_pipeline = [
        {"$match": {**base_q, "gender": {"$nin": [None, ""]}}},
        {"$group": {"_id": "$gender", "count": {"$sum": 1}}},
    ]
    genders = {g["_id"]: g["count"] for g in db.users.aggregate(gender_pipeline)}

    # Registration growth — last 12 months by month
    twelve_ago = now - timedelta(days=365)
    growth_pipeline = [
        {"$match": {**base_q, "createdAt": {"$gte": twelve_ago}}},
        {"$group": {"_id": {"year": {"$year": "$createdAt"}, "month": {"$month": "$createdAt"}}, "count": {"$sum": 1}}},
        {"$sort": {"_id.year": 1, "_id.month": 1}},
    ]
    growth = [{"year": g["_id"]["year"], "month": g["_id"]["month"], "count": g["count"]} for g in db.users.aggregate(growth_pipeline)]

    # Most engaged residents — top 4 by grievance count
    top_pipeline = [
        {"$group": {"_id": "$citizenId", "complaints": {"$sum": 1}}},
        {"$sort": {"complaints": -1}},
        {"$limit": 4},
    ]
    top_ids = list(db.grievances.aggregate(top_pipeline))
    top_residents = []
    for entry in top_ids:
        cid = entry["_id"]
        if not cid:
            continue
        try:
            from bson import ObjectId
            user = db.users.find_one({"_id": ObjectId(cid)})
        except Exception:
            user = None
        if user:
            full_name = user.get("fullName") or user.get("name") or "Resident"
            initials  = "".join(w[0] for w in full_name.split()[:2]).upper()
            top_residents.append({
                "name":      full_name,
                "initials":  initials,
                "ward":      user.get("wardId", ""),
                "complaints": entry["complaints"],
            })

    return {
        "total":      total,
        "verified":   verified,
        "active30d":  active_30d,
        "new30d":     new_30d,
        "newPct":     new_pct,
        "engaged":    engaged,
        "advocates":  advocates,
        "wards":      wards,
        "genders":    genders,
        "growth":     growth,
        "topResidents": top_residents,
    }


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


@router.post("/upload-image")
async def upload_campaign_image(file: UploadFile = File(...)):
    try:
        from utils.storage import upload_file

        file_url = await upload_file(file, folder="campaigns")
        return {"fileUrl": file_url}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error(f"Campaign image upload failed: {exc}")
        raise HTTPException(status_code=500, detail="Upload failed")


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


@router.post("/{campaign_id}/cancel", response_model=CampaignResponse)
async def cancel_campaign(campaign_id: str):
    """Cancel campaign — keeps it in DB with status CANCELLED"""
    success = CampaignService.cancel_campaign(campaign_id, None)
    if not success:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign = CampaignService.get_campaign_by_id(campaign_id)
    return CampaignResponse(**Helper.convert_mongo_doc(campaign))


@router.post("/{campaign_id}/launch", response_model=CampaignResponse)
async def launch_campaign(campaign_id: str):
    success = CampaignService.launch_campaign(campaign_id, None)
    if not success:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign = CampaignService.get_campaign_by_id(campaign_id)
    if campaign:
        from tasks.background import notify_staff_users
        title = f"📢 Campaign Launched: {campaign.get('name', 'New Campaign')}"
        body = campaign.get("message") or f"A new {campaign.get('type','awareness')} campaign has been activated."
        extra = {"campaignId": campaign_id}
        try:
            notify_staff_users.delay(title, body, "CAMPAIGN", extra)
        except Exception as exc:
            logger.warning(f"Staff campaign notification dispatch failed (non-fatal): {exc}")
    return CampaignResponse(**Helper.convert_mongo_doc(campaign))


@router.post("/{campaign_id}/notify")
async def resend_campaign_notifications(campaign_id: str):
    """Re-send notifications for an existing campaign."""
    from tasks.background import send_campaign_notifications
    from config.database import MongoDatabase
    from bson import ObjectId
    db = MongoDatabase.get_db()
    campaign = db.campaigns.find_one({"_id": ObjectId(campaign_id), "isDeleted": {"$ne": True}})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    try:
        send_campaign_notifications.delay(campaign_id)
        return {"success": True, "notified": 0, "message": "Notifications queued for delivery"}
    except Exception:
        try:
            result = send_campaign_notifications(campaign_id)
            sent = result.get("sent", 0) if isinstance(result, dict) else 0
            return {"success": True, "notified": sent, "message": f"Notifications sent to {sent} citizens"}
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Failed to send notifications: {exc}")

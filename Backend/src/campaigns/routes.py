"""
Campaign Routes — Multi-Tenant

GET    /api/campaigns/                 List campaigns
POST   /api/campaigns/                 Create campaign
GET    /api/campaigns/{id}             Get campaign
PUT    /api/campaigns/{id}             Update campaign
DELETE /api/campaigns/{id}             Delete campaign
POST   /api/campaigns/{id}/launch      Activate campaign
POST   /api/campaigns/{id}/cancel      Cancel campaign
POST   /api/campaigns/{id}/join        Citizen joins campaign
GET    /api/campaigns/constituents/stats  Citizen stats for the dashboard
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel
from utils.response import success_response
from utils.tenant import get_tenant_db, require_auth


class CampaignCreate(BaseModel):
    title:           str
    description:     Optional[str] = ""
    start_date:      Optional[str] = ""
    end_date:        Optional[str] = ""
    target_audience: Optional[str] = "all"
    status:          Optional[str] = "Draft"
    image_url:       Optional[str] = ""

class CampaignUpdate(BaseModel):
    title:           Optional[str] = None
    description:     Optional[str] = None
    start_date:      Optional[str] = None
    end_date:        Optional[str] = None
    target_audience: Optional[str] = None
    image_url:       Optional[str] = None

router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])
logger = logging.getLogger(__name__)


def _doc(d: dict) -> dict:
    if not d:
        return {}
    d = dict(d)
    d["id"] = str(d.pop("_id", ""))
    for k, v in d.items():
        if isinstance(v, ObjectId):
            d[k] = str(v)
        elif isinstance(v, datetime):
            d[k] = v.isoformat()
    return d


def _oid(val: str) -> ObjectId:
    try:
        return ObjectId(val)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid ID: {val}")


# ── Citizen stats (used by Constituents dashboard) ─────────────────────────────

@router.get("/constituents/stats")
async def constituents_stats(db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Aggregate citizen statistics for the representative dashboard."""
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")

    now = datetime.now(timezone.utc)
    thirty_ago = now - timedelta(days=30)
    sixty_ago  = now - timedelta(days=60)
    base: dict = {"is_deleted": {"$ne": True}}

    total      = db.citizens.count_documents(base)
    new_30d    = db.citizens.count_documents({**base, "created_at": {"$gte": thirty_ago}})
    new_prev30 = db.citizens.count_documents({**base, "created_at": {"$gte": sixty_ago, "$lt": thirty_ago}})
    new_pct    = round(((new_30d - new_prev30) / new_prev30 * 100) if new_prev30 > 0 else 0)

    # Active = submitted at least 1 grievance in last 30 days
    active_ids = db.grievances.distinct("citizen_id", {"created_at": {"$gte": thirty_ago}})
    active_30d = len([c for c in active_ids if c])

    # Gender breakdown
    gender_pipeline = [
        {"$match": {**base, "gender": {"$nin": [None, ""]}}},
        {"$group": {"_id": "$gender", "count": {"$sum": 1}}},
    ]
    genders = {g["_id"]: g["count"] for g in db.citizens.aggregate(gender_pipeline)}

    # Growth — last 12 months
    twelve_ago = now - timedelta(days=365)
    growth_pipeline = [
        {"$match": {**base, "created_at": {"$gte": twelve_ago}}},
        {"$group": {"_id": {"year": {"$year": "$created_at"}, "month": {"$month": "$created_at"}}, "count": {"$sum": 1}}},
        {"$sort": {"_id.year": 1, "_id.month": 1}},
    ]
    growth = [{"year": g["_id"]["year"], "month": g["_id"]["month"], "count": g["count"]}
              for g in db.citizens.aggregate(growth_pipeline)]

    # Top citizens by grievance count
    top_pipeline = [
        {"$group": {"_id": "$citizen_id", "complaints": {"$sum": 1}}},
        {"$sort": {"complaints": -1}},
        {"$limit": 5},
    ]
    top_ids = list(db.grievances.aggregate(top_pipeline))
    top_citizens = []
    for entry in top_ids:
        cid = entry["_id"]
        if not cid:
            continue
        try:
            c = db.citizens.find_one({"_id": _oid(cid)})
        except Exception:
            c = None
        if c:
            name = c.get("name") or "Resident"
            top_citizens.append({
                "name":       name,
                "initials":   "".join(w[0] for w in name.split()[:2]).upper(),
                "mobile":     c.get("mobile", ""),
                "complaints": entry["complaints"],
            })

    return success_response({
        "total": total, "new30d": new_30d, "newPct": new_pct,
        "active30d": active_30d, "genders": genders,
        "growth": growth, "topCitizens": top_citizens,
    }, "Constituent stats retrieved")


@router.get("/citizen-count")
async def citizen_count(db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Total registered citizens — used for reach estimate."""
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    count = db.citizens.count_documents({"is_deleted": {"$ne": True}})
    return success_response({"count": count}, "Citizen count retrieved")


# ── CRUD ──────────────────────────────────────────────────────────────────────

@router.get("/")
async def list_campaigns(
    page:     int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status:   Optional[str] = None,
    db=Depends(get_tenant_db),
    user=Depends(require_auth),
):
    q: dict = {"is_deleted": {"$ne": True}}
    if status:
        q["status"] = status
    skip  = (page - 1) * per_page
    items = list(db.campaigns.find(q).sort("created_at", -1).skip(skip).limit(per_page))
    total = db.campaigns.count_documents(q)
    return success_response(
        {"items": [_doc(c) for c in items], "total": total, "page": page, "per_page": per_page},
        "Campaigns retrieved",
    )


@router.get("/{campaign_id}")
async def get_campaign(campaign_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    c = db.campaigns.find_one({"_id": _oid(campaign_id), "is_deleted": {"$ne": True}})
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return success_response(_doc(c), "Campaign retrieved")


@router.post("/")
async def create_campaign(body: CampaignCreate, db=Depends(get_tenant_db), user=Depends(require_auth)):
    """
    Create a campaign.

    Body:
      title            str  (required)
      description      str
      start_date       str  (ISO date)
      end_date         str  (ISO date)
      target_audience  str  — all | ward | custom
      status           str  — Draft (default)
    """
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    now = datetime.now(timezone.utc)
    doc = {
        "title":           body.title,
        "description":     body.description or "",
        "start_date":      body.start_date or "",
        "end_date":        body.end_date or "",
        "target_audience": body.target_audience or "all",
        "status":          body.status or "Draft",
        "image_url":       body.image_url or "",
        "reach":           0,
        "participants":    [],
        "is_deleted":      False,
        "created_by":      user.get("user_id"),
        "created_at":      now,
        "updated_at":      now,
    }
    result = db.campaigns.insert_one(doc)
    doc["_id"] = result.inserted_id
    return success_response(_doc(doc), "Campaign created")


@router.put("/{campaign_id}")
async def update_campaign(campaign_id: str, body: CampaignUpdate, db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    update = body.model_dump(exclude_unset=True)
    if not update:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    update["updated_at"] = datetime.now(timezone.utc)
    result = db.campaigns.update_one({"_id": _oid(campaign_id)}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    c = db.campaigns.find_one({"_id": _oid(campaign_id)})
    return success_response(_doc(c), "Campaign updated")


@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    result = db.campaigns.update_one(
        {"_id": _oid(campaign_id)},
        {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return success_response(None, "Campaign deleted")


@router.post("/{campaign_id}/launch")
async def launch_campaign(campaign_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    now = datetime.now(timezone.utc)
    result = db.campaigns.update_one(
        {"_id": _oid(campaign_id)},
        {"$set": {"status": "Active", "launched_at": now, "updated_at": now}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    # Notify all citizens
    c = db.campaigns.find_one({"_id": _oid(campaign_id)})
    if c:
        citizens = list(db.citizens.find({"is_deleted": {"$ne": True}}, {"_id": 1}))
        notifs = [{
            "user_id":      str(cit["_id"]),
            "title":        f"New Campaign: {c.get('title')}",
            "message":      c.get("description", ""),
            "type":         "Campaign",
            "reference_id": campaign_id,
            "is_read":      False,
            "created_at":   now,
        } for cit in citizens]
        if notifs:
            db.notifications.insert_many(notifs)
    return success_response(None, "Campaign launched")


@router.post("/{campaign_id}/cancel")
async def cancel_campaign(campaign_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    result = db.campaigns.update_one(
        {"_id": _oid(campaign_id)},
        {"$set": {"status": "Cancelled", "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return success_response(None, "Campaign cancelled")


@router.post("/{campaign_id}/join")
async def join_campaign(campaign_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Citizen joins / supports a campaign."""
    citizen_id = user.get("user_id")
    c = db.campaigns.find_one({"_id": _oid(campaign_id), "is_deleted": {"$ne": True}})
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if citizen_id in c.get("participants", []):
        return success_response({"alreadyJoined": True}, "Already joined")
    db.campaigns.update_one(
        {"_id": _oid(campaign_id)},
        {"$addToSet": {"participants": citizen_id}, "$inc": {"reach": 1}},
    )
    return success_response({"alreadyJoined": False}, "Joined campaign")


@router.post("/upload-image")
async def upload_campaign_image(file: UploadFile = File(...), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    try:
        from utils.storage import upload_file
        file_url = await upload_file(file, folder="campaigns")
        return success_response({"file_url": file_url}, "Image uploaded")
    except Exception as exc:
        logger.error(f"Campaign image upload failed: {exc}")
        raise HTTPException(status_code=500, detail="Upload failed")

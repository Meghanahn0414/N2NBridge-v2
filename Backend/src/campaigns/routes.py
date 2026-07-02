"""
Campaign Routes — Multi-Tenant

GET    /api/campaigns/                 List campaigns
POST   /api/campaigns/                 Create campaign
GET    /api/campaigns/{id}             Get campaign
PUT    /api/campaigns/{id}             Update campaign
DELETE /api/campaigns/{id}             Delete campaign
POST   /api/campaigns/{id}/launch      Activate campaign + notify citizens
POST   /api/campaigns/{id}/notify      Re-send notifications (no status change)
POST   /api/campaigns/{id}/cancel      Cancel campaign
POST   /api/campaigns/{id}/join        Citizen joins campaign
GET    /api/campaigns/constituents/stats  Citizen stats for the dashboard
GET    /api/campaigns/citizen-count       Registered citizen count
GET    /api/campaigns/audience-wards      Distinct wards for audience targeting
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from bson import ObjectId
from campaigns.model import CampaignCreate, CampaignUpdate
from config.database import MongoDatabase
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from mla.sentiment_service import CATEGORY_META, _normalize_category_key
from utils.email_service import send_email
from utils.response import success_response
from utils.tenant import get_tenant_db, require_auth

# NOTE: CampaignCreate/CampaignUpdate used to be defined locally in this file
# with a completely different shape (title/description/start_date/end_date/
# target_audience: str/image_url) than campaigns/model.py's richer versions
# (name/type/message/targetAudience: list/coverImage/wardId/channels/
# startDate/repeat/reach/engagement/roi). Both frontend campaign-creation
# UIs (CommunicationCenter.jsx for reps, CampaignManagement.jsx for admins)
# have always sent the model.py shape via campaignService.js's createCampaign()
# (no field translation there) — so every POST /api/campaigns/ was failing
# Pydantic validation with a 422 for the missing required `title` field.
# Now importing the correct models directly instead of shadowing them.

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


def _email_citizens(citizens: list, subject: str, body: str):
    """Send `body` to every citizen dict that has an 'email' field. Used
    when a campaign's Delivery Channels include "Email" — mirrors the
    same pattern in events/routes.py's publish_event."""
    for cit in citizens:
        email = (cit.get("email") or "").strip()
        if not email:
            continue
        try:
            send_email(email, subject, body)
        except Exception as ex:
            logger.warning(f"Campaign email failed for citizen {cit.get('_id')}: {ex}")


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

    # "Verified Residents" — the frontend's Constituents dashboard has always
    # requested this as `verified` and describes it as "Address-confirmed
    # citizens," but nothing ever computed it, so it was permanently 0.
    # Address is the one identity field citizens explicitly fill in (name/
    # mobile are collected at OTP signup, not proof of anything beyond
    # contactability), so a non-empty address is used as the confirmation
    # signal here.
    verified = db.citizens.count_documents({**base, "address": {"$exists": True, "$nin": [None, ""]}})

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

    # Resident Groups — "who makes up your base", grouped by the kind of
    # issue they've reported. This used to try to group by ward instead,
    # but nothing ever populated a "wards" field here, so that card always
    # fell back to a hardcoded, permanently-0 placeholder. Grievance
    # category is always populated (unlike ward, which is sparse for MLA/MP
    # citizens — see the audience-wards fix), so it's a reliable, real
    # segmentation axis instead.
    cat_pipeline = [
        {"$match": base},
        {"$group": {
            "_id":      {"$ifNull": ["$categoryId", "$category"]},
            "citizens": {"$addToSet": "$citizen_id"},
        }},
    ]
    cat_citizen_sets: dict = {}
    for row in db.grievances.aggregate(cat_pipeline):
        raw_key = row["_id"]
        if not raw_key:
            continue
        cat_key = _normalize_category_key(raw_key)
        existing = cat_citizen_sets.setdefault(cat_key, set())
        existing.update(c for c in row.get("citizens", []) if c)

    resident_groups = []
    for cat_key, meta in CATEGORY_META.items():
        count = len(cat_citizen_sets.get(cat_key, ()))
        if count == 0:
            continue
        resident_groups.append({
            "key":   cat_key,
            "label": meta["label"],
            "icon":  meta["icon"],
            "count": count,
            "pct":   round(count / total * 100) if total else 0,
        })
    resident_groups.sort(key=lambda g: -g["count"])

    return success_response({
        "total": total, "new30d": new_30d, "newPct": new_pct,
        "active30d": active_30d, "genders": genders,
        "growth": growth, "topCitizens": top_citizens,
        "residentGroups": resident_groups,
        "verified": verified,
    }, "Constituent stats retrieved")


@router.get("/citizen-count")
async def citizen_count(db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Total registered citizens — used for reach estimate."""
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    count = db.citizens.count_documents({"is_deleted": {"$ne": True}})
    return success_response({"count": count}, "Citizen count retrieved")


# ── Audience targeting ──────────────────────────────────────────────────────
# Must be declared BEFORE the dynamic GET /{campaign_id} route below — FastAPI
# matches routes in declaration order, and without a dedicated route here,
# "audience-wards" was being captured by {campaign_id} and failing _oid()
# parsing with a 400.

@router.get("/audience-wards")
async def audience_wards(db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Distinct audience segments among THIS representative's own registered
    citizens, used to populate the audience-targeting dropdown when composing
    a broadcast/campaign. Only citizens who actually registered under this
    rep's tenant show up here — get_tenant_db already scopes `db` to this
    rep's own database, so there's no cross-tenant leakage.

    The segmentation field depends on the representative's own type (stored
    on their `users` doc as `title`): an MP's citizens are grouped by
    `parliamentary_name`, an MLA's by `assembly_name`, and a Councillor's by
    ward (ward_id, falling back to ward_number/area_name for legacy data) —
    each role only ever has one of those fields meaningfully populated on its
    citizens, since that's what the citizen-registration flow copies down
    from the rep's own record at signup time.
    """
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")

    rep_doc = db.users.find_one({"role": "REPRESENTATIVE"}, {"title": 1})
    rep_type = ((rep_doc or {}).get("title") or "").upper()

    if rep_type == "MP":
        group_field, scope, scope_label = "parliamentary_name", "parliamentary", "Parliamentary Constituency"
    elif rep_type == "MLA":
        group_field, scope, scope_label = "assembly_name", "assembly", "Assembly"
    else:
        group_field, scope, scope_label = None, "ward", "Ward"

    logger.info(
        f"audience_wards: tenant_db={db.name} rep_doc_found={rep_doc is not None} "
        f"rep_type={rep_type!r} group_field={group_field!r} "
        f"total_citizens={db.citizens.count_documents({'is_deleted': {'$ne': True}})}"
    )

    if group_field:
        # MLA / MP — single flat string field, no code→name lookup needed.
        sample = list(db.citizens.find({"is_deleted": {"$ne": True}}, {group_field: 1, "name": 1}).limit(5))
        logger.info(f"audience_wards: sample citizens for {group_field!r}: {sample}")
        pipeline = [
            {"$match": {"is_deleted": {"$ne": True}, group_field: {"$nin": [None, ""]}}},
            {"$group": {"_id": f"${group_field}", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}},
        ]
        rows = list(db.citizens.aggregate(pipeline))
        wards = [{"id": r["_id"], "name": r["_id"], "count": r["count"]} for r in rows]
        return success_response(
            {"wards": wards, "scope": scope, "scopeLabel": scope_label},
            f"{scope_label} list retrieved",
        )

    # Councillor (or unknown rep type) — ward-based, as before. A citizen's
    # `ward_id` (a Councillor ward code, e.g. "WARD-012") is the field
    # actually populated by the mobile app's profile form. Older/legacy data
    # may instead have ward_number or area_name set directly, so fall back to
    # those if ward_id is blank.
    pipeline = [
        {"$match": {"is_deleted": {"$ne": True}}},
        {"$project": {"ward": {"$ifNull": [
            {"$cond": [{"$eq": ["$ward_id", ""]}, None, "$ward_id"]},
            {"$ifNull": [
                {"$cond": [{"$eq": ["$ward_number", ""]}, None, "$ward_number"]},
                "$area_name",
            ]},
        ]}}},
        {"$match": {"ward": {"$nin": [None, ""]}}},
        {"$group": {"_id": "$ward", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    rows = list(db.citizens.aggregate(pipeline))
    if not rows:
        return success_response({"wards": [], "scope": scope, "scopeLabel": scope_label}, "Wards retrieved")

    # Resolve friendly display names: a citizen's `ward_id` is a Councillor
    # ward code, and only the Councillor's own representative record knows
    # its human-readable `ward_name` — look it up from the master
    # `representatives` collection.
    ward_ids = [r["_id"] for r in rows]
    master = MongoDatabase.get_db()
    name_by_id = {
        rep["ward_id"]: rep.get("ward_name")
        for rep in master.representatives.find(
            {"rep_type": "COUNCILLOR", "ward_id": {"$in": ward_ids}},
            {"ward_id": 1, "ward_name": 1},
        )
        if rep.get("ward_id")
    }
    wards = [
        {
            "id":    r["_id"],
            "name":  name_by_id.get(r["_id"]) or (f"Ward {r['_id']}" if str(r["_id"]).isdigit() else str(r["_id"])),
            "count": r["count"],
        }
        for r in rows
    ]
    return success_response({"wards": wards, "scope": scope, "scopeLabel": scope_label}, "Wards retrieved")


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
    items = list(db.campaigns.find(q).sort("createdAt", -1).skip(skip).limit(per_page))
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
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    now = datetime.now(timezone.utc)
    doc = {
        "name":           body.name,
        "type":           body.type or "Awareness",
        "message":        body.message or "",
        "status":         body.status or "DRAFT",
        "targetAudience": body.targetAudience or [],
        "coverImage":     body.coverImage,
        "wardId":         body.wardId,
        "channels":       body.channels or [],
        "startDate":      body.startDate,
        "repeat":         body.repeat or "One-time",
        "reach":          body.reach or 0,
        "engagement":     body.engagement or 0,
        "roi":            body.roi or 0,
        "participants":   [],
        "is_deleted":     False,
        "created_by":     user.get("user_id"),
        "createdAt":      now,
        "updatedAt":      now,
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
    update["updatedAt"] = datetime.now(timezone.utc)
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
        {"$set": {"is_deleted": True, "updatedAt": datetime.now(timezone.utc)}},
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
        {"$set": {"status": "ACTIVE", "launchedAt": now, "updatedAt": now}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    # Notify citizens — everyone by default, or just the targeted ward if
    # the campaign was created with a wardId (matches audience_wards' id,
    # which is a citizen's ward_id, falling back to ward_number/area_name
    # for legacy data).
    c = db.campaigns.find_one({"_id": _oid(campaign_id)})
    if c:
        cit_q: dict = {"is_deleted": {"$ne": True}}
        ward_id = c.get("wardId")
        if ward_id:
            # `wardId` on the campaign holds whatever segment value the audience
            # dropdown returned — a ward code/name for a Councillor, or an
            # assembly/parliamentary constituency name for an MLA/MP. Only one
            # of these fields is ever meaningfully populated on this tenant's
            # citizens, so matching all of them is safe and avoids re-deriving
            # rep_type here.
            cit_q["$or"] = [
                {"ward_id": ward_id}, {"ward_number": ward_id}, {"area_name": ward_id},
                {"assembly_name": ward_id}, {"parliamentary_name": ward_id},
            ]
        email_channel = "Email" in (c.get("channels") or [])
        projection = {"_id": 1, "email": 1} if email_channel else {"_id": 1}
        citizens = list(db.citizens.find(cit_q, projection))
        notifs = [{
            "user_id":      str(cit["_id"]),
            "title":        f"New Campaign: {c.get('name')}",
            "message":      c.get("message", ""),
            "type":         "Campaign",
            "reference_id": campaign_id,
            "is_read":      False,
            "created_at":   now,
        } for cit in citizens]
        if notifs:
            db.notifications.insert_many(notifs)
        db.campaigns.update_one({"_id": _oid(campaign_id)}, {"$set": {"reach": len(notifs)}})
        if email_channel:
            _email_citizens(
                citizens,
                f"New Campaign: {c.get('name')}",
                f"Hello,\n\nYour representative has launched a new campaign.\n\n"
                f"{c.get('name')}\n{c.get('message', '')}\n\nBest regards,\nN2N Team",
            )
    return success_response(None, "Campaign launched")


@router.post("/{campaign_id}/notify")
async def notify_campaign(campaign_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    """(Re)send notifications for an already-created campaign, without
    changing its status — used by the admin's "Notify" button, distinct
    from /launch which also flips status to ACTIVE."""
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    c = db.campaigns.find_one({"_id": _oid(campaign_id), "is_deleted": {"$ne": True}})
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    now = datetime.now(timezone.utc)
    cit_q: dict = {"is_deleted": {"$ne": True}}
    ward_id = c.get("wardId")
    if ward_id:
        cit_q["$or"] = [
            {"ward_id": ward_id}, {"ward_number": ward_id}, {"area_name": ward_id},
            {"assembly_name": ward_id}, {"parliamentary_name": ward_id},
        ]
    email_channel = "Email" in (c.get("channels") or [])
    projection = {"_id": 1, "email": 1} if email_channel else {"_id": 1}
    citizens = list(db.citizens.find(cit_q, projection))
    notifs = [{
        "user_id":      str(cit["_id"]),
        "title":        f"New Campaign: {c.get('name')}",
        "message":      c.get("message", ""),
        "type":         "Campaign",
        "reference_id": campaign_id,
        "is_read":      False,
        "created_at":   now,
    } for cit in citizens]
    if notifs:
        db.notifications.insert_many(notifs)
        db.campaigns.update_one({"_id": _oid(campaign_id)}, {"$set": {"reach": len(notifs), "updatedAt": now}})
    if email_channel:
        _email_citizens(
            citizens,
            f"New Campaign: {c.get('name')}",
            f"Hello,\n\nYour representative has an update on a campaign.\n\n"
            f"{c.get('name')}\n{c.get('message', '')}\n\nBest regards,\nN2N Team",
        )
    return success_response({"notified": len(notifs)}, "Notifications sent")


@router.post("/{campaign_id}/cancel")
async def cancel_campaign(campaign_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    result = db.campaigns.update_one(
        {"_id": _oid(campaign_id)},
        {"$set": {"status": "CANCELLED", "updatedAt": datetime.now(timezone.utc)}},
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

"""
Citizen Routes — Multi-Tenant

GET  /api/citizens/me                       Own profile
PUT  /api/citizens/me                       Update own profile
POST /api/citizens/me/upload-photo          Upload own profile photo
GET  /api/citizens/my-representative-type   This citizen's rep_type + constituency name
GET  /api/citizens/my-representatives       Councillor, MLA, MP lookup (from master DB)
GET  /api/citizens/{id}                 Rep/Staff: get citizen profile
GET  /api/citizens/                     Rep/Staff: list all citizens
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from citizens.model import CitizenProfileUpdate, CitizenRegisterDetails
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from utils.response import success_response
from utils.tenant import get_tenant_db, require_auth
router = APIRouter(prefix="/api/citizens", tags=["Citizen"])
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


# ── Citizen: register details (first-time profile completion) ─────────────────

@router.post("/register-details", summary="Complete citizen profile after OTP login")
async def register_citizen_details(
    body: CitizenRegisterDetails,
    db=Depends(get_tenant_db),
    user=Depends(require_auth),
):
    """
    **Called immediately after OTP verification.**

    Citizen fills in their personal details for the first time.
    Requires the Bearer token returned by `POST /api/auth/citizen/register`.

    All fields except `name` are optional and can be updated later via `PUT /me`.
    """
    citizen_id = user.get("user_id")
    update = body.model_dump(exclude_unset=True)
    if not update:
        raise HTTPException(status_code=400, detail="No fields provided")
    update["updated_at"] = datetime.now(timezone.utc)
    result = db.citizens.update_one({"_id": _oid(citizen_id)}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Citizen not found")
    citizen = db.citizens.find_one({"_id": _oid(citizen_id)})
    return success_response(_doc(citizen), "Profile saved successfully")


# ── Citizen: own profile ───────────────────────────────────────────────────────

@router.get("/me")
async def get_my_profile(db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Get the logged-in citizen's profile."""
    citizen_id = user.get("user_id")
    citizen = db.citizens.find_one({"_id": _oid(citizen_id)})
    if not citizen:
        raise HTTPException(status_code=404, detail="Profile not found")
    return success_response(_doc(citizen), "Profile retrieved")


@router.get("/my-representative-type")
async def my_representative_type(db=Depends(get_tenant_db), user=Depends(require_auth)):
    """
    Lightweight lookup for the citizen app's profile screen: which rep_type
    (MLA/MP/COUNCILLOR) and constituency name this citizen's tenant belongs
    to. A citizen's own record doesn't carry this (it's implicit in which
    tenant DB they live in) — used so a returning citizen's "Your
    Representative" section can be shown correctly pre-filled instead of
    blank, without needing the heavier /my-representatives lookup.
    """
    rep = db.users.find_one(
        {"role": "REPRESENTATIVE"},
        {"_id": 0, "title": 1, "assembly_name": 1, "parliamentary_name": 1,
         "ward_id": 1, "ward_name": 1},
    )
    if not rep:
        raise HTTPException(status_code=404, detail="Representative not found")

    rep_type = (rep.get("title") or "").upper()
    if rep_type == "MLA":
        area = rep.get("assembly_name") or ""
    elif rep_type == "MP":
        area = rep.get("parliamentary_name") or ""
    elif rep_type == "COUNCILLOR":
        area = rep.get("ward_name") or rep.get("ward_id") or ""
    else:
        area = ""

    return success_response({
        "rep_type": rep_type,
        "area":     area,
        "ward_id":  rep.get("ward_id") or "",
    }, "Representative type retrieved")


@router.put("/me")
async def update_my_profile(body: CitizenProfileUpdate, db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Update citizen profile."""
    citizen_id = user.get("user_id")
    update = body.model_dump(exclude_unset=True)
    if not update:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    update["updated_at"] = datetime.now(timezone.utc)
    result = db.citizens.update_one({"_id": _oid(citizen_id)}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Citizen not found")
    citizen = db.citizens.find_one({"_id": _oid(citizen_id)})
    return success_response(_doc(citizen), "Profile updated")


@router.post("/me/upload-photo")
async def upload_my_photo(
    file: UploadFile = File(...),
    db=Depends(get_tenant_db),
    user=Depends(require_auth),
):
    """
    Upload the logged-in citizen's own profile photo.

    This is the citizen-facing counterpart to
    POST /api/users/{id}/upload-profile-photo — that one writes to the
    `users` collection and is representative/staff-only, so it never actually
    saved anything for a citizen. This one writes to `db.citizens`, keyed off
    the citizen's own id from the token, matching GET/PUT /api/citizens/me.
    """
    citizen_id = user.get("user_id")
    if not citizen_id:
        raise HTTPException(status_code=401, detail="Invalid session")

    from utils.file_handler import upload_profile_image
    try:
        file_url = await upload_profile_image(file)
    except Exception as exc:
        logger.error(f"Citizen photo upload failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail="Upload failed")

    result = db.citizens.update_one(
        {"_id": _oid(citizen_id)},
        {"$set": {"profileImage": file_url, "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Citizen not found")

    return success_response({"profileImage": file_url}, "Profile photo updated")


@router.get("/my-representatives")
async def my_representatives(db=Depends(get_tenant_db), user=Depends(require_auth)):  # noqa: ARG001
    """
    Return the Councillor, MLA, and MP for this citizen.

    In the multi-tenant model, a citizen belongs to exactly one representative's
    DB. This endpoint returns that representative's profile and any linked higher-
    tier representatives stored in the master DB.
    """
    # Own tenant's representative
    rep = db.users.find_one({"role": "REPRESENTATIVE"}, {
        "_id": 1, "fullName": 1, "title": 1, "mobile": 1,
        "email": 1, "officeAddress": 1, "officePhone": 1,
        "profileImage": 1, "bio": 1,
    })

    result: dict = {"councillor": None, "mla": None, "mp": None}
    if rep:
        rep_doc = _doc(rep)
        title = (rep.get("title") or "").lower()
        if title == "councillor":
            result["councillor"] = rep_doc
        elif title == "mla":
            result["mla"] = rep_doc
        elif title == "mp":
            result["mp"] = rep_doc

    return success_response(result, "Representatives retrieved")


# ── Rep/Staff: citizen list and detail ────────────────────────────────────────

@router.get("/")
async def list_citizens(
    page:     int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search:   Optional[str] = None,
    db=Depends(get_tenant_db),
    user=Depends(require_auth),
):
    """Representative/Staff: list all registered citizens."""
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    q: dict = {"is_deleted": {"$ne": True}}
    if search:
        q["$or"] = [
            {"name":       {"$regex": search, "$options": "i"}},
            {"mobile":     {"$regex": search, "$options": "i"}},
            {"citizen_id": {"$regex": search, "$options": "i"}},
        ]
    skip  = (page - 1) * per_page
    items = list(db.citizens.find(q).sort("created_at", -1).skip(skip).limit(per_page))
    total = db.citizens.count_documents(q)
    raw_total = db.citizens.count_documents({})
    logger.info(
        f"list_citizens: tenant_db={db.name} user_db_name={user.get('db_name')} "
        f"filtered_total={total} raw_total(no filter)={raw_total}"
    )
    return success_response(
        {"items": [_doc(c) for c in items], "total": total, "page": page, "per_page": per_page},
        "Citizens retrieved",
    )


@router.get("/{citizen_id}")
async def get_citizen(citizen_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Rep/Staff: get a citizen's full profile including grievance count."""
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    citizen = db.citizens.find_one({"_id": _oid(citizen_id)})
    if not citizen:
        raise HTTPException(status_code=404, detail="Citizen not found")
    data = _doc(citizen)
    data["grievance_count"] = db.grievances.count_documents({"citizen_id": citizen_id})
    data["open_grievances"]  = db.grievances.count_documents({"citizen_id": citizen_id, "status": "Open"})
    return success_response(data, "Citizen retrieved")

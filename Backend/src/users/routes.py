"""
User Routes — Multi-Tenant

GET  /api/users/me                  Own profile (representative or staff)
PUT  /api/users/me                  Update own profile
GET  /api/users/                    List all users in this tenant (rep + staff)
GET  /api/users/{id}                Get user by ID
PUT  /api/users/{id}                Update user by ID  (rep only)
DELETE /api/users/{id}              Soft-delete user   (rep only)
POST /api/users/{id}/reset-password Reset password     (rep only)
POST /api/users/{id}/upload-profile-photo  Upload photo
GET  /api/users/citizens/search     Search citizens in tenant DB
"""
import logging
import random
import string
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from config.security import SecurityManager
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from users.model import UserUpdate
from utils.response import success_response
from utils.tenant import get_tenant_db, require_auth

router = APIRouter(prefix="/api/users", tags=["Users"])
logger = logging.getLogger(__name__)


def _doc(d: dict) -> dict:
    if not d:
        return {}
    d = dict(d)
    d["id"] = str(d.pop("_id", ""))
    for k, v in list(d.items()):
        if isinstance(v, ObjectId):
            d[k] = str(v)
        elif isinstance(v, datetime):
            d[k] = v.isoformat()
    d.pop("passwordHash", None)
    d.pop("password_hash", None)
    return d


def _oid(val: str) -> ObjectId:
    try:
        return ObjectId(val)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid ID: {val}")


def _rep_only(user: dict):
    if user.get("role") != "REPRESENTATIVE":
        raise HTTPException(status_code=403, detail="Only the representative can perform this action")


# ── /me must be before /{id} ──────────────────────────────────────────────────

@router.get("/me")
async def get_my_profile(db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Get the logged-in user's profile (representative or staff)."""
    uid = user.get("user_id")
    doc = db.users.find_one({"_id": _oid(uid), "isDeleted": {"$ne": True}})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return success_response(_doc(doc), "Profile retrieved")


@router.put("/me")
async def update_my_profile(
    body: UserUpdate,
    db=Depends(get_tenant_db),
    user=Depends(require_auth),
):
    """Update own profile."""
    uid    = user.get("user_id")
    update = body.model_dump(exclude_unset=True)
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    update["updatedAt"] = datetime.now(timezone.utc)
    result = db.users.update_one({"_id": _oid(uid)}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    doc = db.users.find_one({"_id": _oid(uid)})
    return success_response(_doc(doc), "Profile updated")


# ── Citizens search ────────────────────────────────────────────────────────────

@router.get("/citizens/search")
async def search_citizens(
    q: str = Query("", min_length=0),
    limit: int = Query(8, ge=1, le=50),
    db=Depends(get_tenant_db),
    user=Depends(require_auth),
):
    """Search citizens in this tenant's citizens collection."""
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    base: dict = {"is_deleted": {"$ne": True}}
    if q.strip():
        pattern = {"$regex": q.strip(), "$options": "i"}
        base["$or"] = [
            {"name":   pattern},
            {"mobile": pattern},
            {"ward_id": pattern},
            {"address": pattern},
        ]
    docs = list(db.citizens.find(base, {
        "_id": 1, "name": 1, "mobile": 1, "ward_id": 1, "gender": 1, "assembly_name": 1,
    }).limit(limit))
    results = [{
        "id":       str(d["_id"]),
        "name":     d.get("name") or "—",
        "mobile":   d.get("mobile", ""),
        "ward_id":  d.get("ward_id", ""),
        "gender":   d.get("gender", ""),
        "initials": "".join(w[0] for w in (d.get("name") or "R").split()[:2]).upper(),
    } for d in docs]
    return success_response({"results": results, "total": len(results)}, "Citizens found")


# ── List all users in tenant ───────────────────────────────────────────────────

@router.get("/")
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    role: Optional[str] = None,
    db=Depends(get_tenant_db),
    user=Depends(require_auth),
):
    """List representative + staff in this tenant."""
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    q: dict = {"isDeleted": {"$ne": True}}
    if role:
        q["role"] = role.upper()
    skip  = (page - 1) * per_page
    docs  = list(db.users.find(q).sort("createdAt", -1).skip(skip).limit(per_page))
    total = db.users.count_documents(q)
    return success_response(
        {"items": [_doc(d) for d in docs], "total": total, "page": page, "per_page": per_page},
        "Users retrieved",
    )


# ── Profile photo upload ───────────────────────────────────────────────────────

@router.post("/{user_id}/upload-profile-photo")
async def upload_profile_photo(
    user_id: str,
    file: UploadFile = File(...),
    db=Depends(get_tenant_db),
    _user=Depends(require_auth),
):
    """Upload profile photo for a user."""
    try:
        from utils.file_handler import upload_profile_image
        file_url = await upload_profile_image(file)
    except Exception as exc:
        logger.error(f"Photo upload failed: {exc}")
        raise HTTPException(status_code=500, detail="Upload failed")

    result = db.users.update_one(
        {"_id": _oid(user_id)},
        {"$set": {"profileImage": file_url, "updatedAt": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return success_response({"profileImage": file_url}, "Profile photo updated")


# ── Get / Update / Delete by ID ────────────────────────────────────────────────

@router.get("/{user_id}")
async def get_user(user_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Get user by ID."""
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    doc = db.users.find_one({"_id": _oid(user_id), "isDeleted": {"$ne": True}})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return success_response(_doc(doc), "User retrieved")


@router.put("/{user_id}")
async def update_user(
    user_id: str,
    body: UserUpdate,
    db=Depends(get_tenant_db),
    user=Depends(require_auth),
):
    """Update user by ID (representative only)."""
    _rep_only(user)
    update = body.model_dump(exclude_unset=True)
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    update["updatedAt"] = datetime.now(timezone.utc)
    result = db.users.update_one({"_id": _oid(user_id)}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    doc = db.users.find_one({"_id": _oid(user_id)})
    return success_response(_doc(doc), "User updated")


@router.delete("/{user_id}")
async def delete_user(user_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Soft-delete a user (representative only)."""
    _rep_only(user)
    result = db.users.update_one(
        {"_id": _oid(user_id)},
        {"$set": {"isDeleted": True, "updatedAt": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return success_response(None, "User deleted")


@router.post("/{user_id}/reset-password")
async def reset_password(user_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Generate a temporary password and reset (representative only)."""
    _rep_only(user)
    temp_password = "".join(random.choices(string.ascii_letters + string.digits, k=10))
    result = db.users.update_one(
        {"_id": _oid(user_id), "isDeleted": {"$ne": True}},
        {"$set": {
            "passwordHash": SecurityManager.hash_password(temp_password),
            "updatedAt": datetime.now(timezone.utc),
        }},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return success_response({"tempPassword": temp_password}, "Password reset successfully")

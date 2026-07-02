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
from config.database import MongoDatabase
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

def _staff_as_user_doc(s: dict) -> dict:
    """Map a tenant_db.staff doc (snake_case fields, own _id) onto the same
    shape /me returns for tenant_db.users (Field Officers/Managers live in
    `staff`, not `users` — see auth/service.py's login() for why)."""
    return {
        "id":        str(s["_id"]),
        "fullName":  s.get("name"),
        "mobile":    s.get("mobile"),
        "email":     s.get("email"),
        "role":      s.get("role") or "STAFF",
        "title":     s.get("designation"),
        "status":    s.get("status", "ACTIVE"),
        "createdAt": s["created_at"].isoformat() if isinstance(s.get("created_at"), datetime) else s.get("created_at"),
        "updatedAt": s["updated_at"].isoformat() if isinstance(s.get("updated_at"), datetime) else s.get("updated_at"),
    }


@router.get("/me")
async def get_my_profile(db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Get the logged-in user's profile (representative or staff)."""
    uid = user.get("user_id")
    doc = db.users.find_one({"_id": _oid(uid), "isDeleted": {"$ne": True}})
    if doc:
        return success_response(_doc(doc), "Profile retrieved")

    # Field Officers / Managers / PAs / Volunteers live in db.staff, not
    # db.users — this endpoint was documented as working for "representative
    # or staff" but only ever queried db.users, so every staff caller
    # (e.g. the Field Officer's "My Profile" page) 404'd here even with a
    # valid token. Fall back to db.staff and normalize field names to match
    # what UserResponse/the frontend profile pages expect.
    staff = db.staff.find_one({"_id": _oid(uid), "is_deleted": {"$ne": True}})
    if staff:
        out = _doc(staff)
        out.setdefault("fullName", out.get("name"))
        out.setdefault("createdAt", out.get("created_at"))
        return success_response(out, "Profile retrieved")

    raise HTTPException(status_code=404, detail="User not found")


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
    if result.matched_count > 0:
        doc = db.users.find_one({"_id": _oid(uid)})
        return success_response(_doc(doc), "Profile updated")

    staff_update: dict = {"updated_at": datetime.now(timezone.utc)}
    if "fullName" in update:
        staff_update["name"] = update["fullName"]
    if "mobile" in update:
        staff_update["mobile"] = update["mobile"]
    if "email" in update:
        staff_update["email"] = update["email"]
    staff_result = db.staff.update_one({"_id": _oid(uid)}, {"$set": staff_update})
    if staff_result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    staff_doc = db.staff.find_one({"_id": _oid(uid)})
    return success_response(_staff_as_user_doc(staff_doc), "Profile updated")


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

def _cross_tenant_citizens(master, per_page: int, only_db_name: Optional[str] = None) -> list[dict]:
    """
    ADMIN view of CITIZEN role: citizens don't live in `users` at all (they're
    in each representative's own tenant `citizens` collection). `only_db_name`
    restricts this to the ONE representative this admin registered — a scoped
    admin should only ever see their own team's data, never other admins'
    representatives. Looping "every tenant DB" only happens if only_db_name
    isn't given (kept for potential platform-wide/Super Admin use later).
    """
    items: list[dict] = []
    rep_query = {"db_name": only_db_name} if only_db_name else {}
    for rep in master.representatives.find(rep_query, {"db_name": 1, "name": 1}):
        db_name = rep.get("db_name")
        if not db_name:
            continue
        try:
            tenant_db = MongoDatabase.get_tenant_db(db_name)
            for c in tenant_db.citizens.find({"is_deleted": {"$ne": True}}).limit(per_page):
                doc = _doc(c)
                doc["fullName"] = doc.get("name") or doc.get("fullName")
                doc["citizenId"] = doc.get("citizen_id") or doc.get("id")
                doc["representative"] = rep.get("name")
                items.append(doc)
        except Exception as exc:
            logger.warning(f"Skipping tenant {db_name} in cross-tenant citizen list: {exc}")
    return items


def _cross_tenant_representatives(master, rep_type: Optional[str] = None, only_db_name: Optional[str] = None) -> list[dict]:
    """
    ADMIN view of REPRESENTATIVE role: representatives are indexed directly
    in the master `representatives` collection (one doc per tenant), so no
    need to open each tenant DB individually. `rep_type` optionally narrows
    to MLA / MP / COUNCILLOR only (sidebar's separate MP / Councillor lists).
    `only_db_name` restricts to the one representative this admin registered.
    """
    q: dict = {}
    if rep_type:
        q["rep_type"] = rep_type.upper()
    if only_db_name:
        q["db_name"] = only_db_name
    items = []
    for rep in master.representatives.find(q):
        doc = _doc(rep)
        doc["fullName"] = doc.get("name")
        doc["role"] = "REPRESENTATIVE"
        doc["constituencyId"] = doc.get("assembly_name") or doc.get("parliamentary_name") or doc.get("ward_id")
        doc["district"] = doc.get("district")
        items.append(doc)
    return items


@router.get("/")
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=1000),
    role: Optional[str] = None,
    rep_type: Optional[str] = None,
    db=Depends(get_tenant_db),
    user=Depends(require_auth),
):
    """
    List users. Representative/staff callers see their own tenant's users
    (unchanged). ADMIN callers get a cross-tenant view, since an admin's own
    "tenant" is the master DB, which doesn't hold citizens/representatives
    from any specific representative's database — those are scattered across
    every tenant DB (see _cross_tenant_citizens / _cross_tenant_representatives).
    `rep_type` (MLA | MP | COUNCILLOR) narrows the REPRESENTATIVE list for
    the sidebar's separate MP / Councillor pages.
    """
    # A scoped Admin whose login has been resolved to their managed tenant
    # (see utils/tenant.py's _resolve_admin_managed_tenant) shows up here as
    # role=REPRESENTATIVE with admin_user_id set — this endpoint still wants
    # its own ADMIN-specific cross-tenant/isolation view for them (citizens,
    # the representative record itself, and field officers/managers), not
    # the plain single-tenant REPRESENTATIVE branch below.
    is_resolved_admin = bool(user.get("admin_user_id"))
    caller_role = "ADMIN" if is_resolved_admin else user.get("role")
    if caller_role not in ("REPRESENTATIVE", "STAFF", "ADMIN"):
        raise HTTPException(status_code=403, detail="Unauthorized")

    role_filter = (role or "").upper()

    if caller_role == "ADMIN":
        master = MongoDatabase.get_db()

        # Every Admin is scoped to exactly one MLA/MP/Councillor they
        # registered (or none yet) — they should only ever see that one
        # representative's data, never another admin's. `db` (get_tenant_db)
        # already resolves to that one managed tenant once it's set (same
        # resolution this branch needs), so reuse it directly instead of
        # re-deriving managed_db_name from scratch.
        managed_db_name = user.get("db_name") if is_resolved_admin else None

        if role_filter == "CITIZEN":
            items = [_doc(c) for c in db.citizens.find({"is_deleted": {"$ne": True}})] if managed_db_name else []
        elif role_filter == "REPRESENTATIVE":
            items = _cross_tenant_representatives(master, rep_type, only_db_name=managed_db_name) if managed_db_name else []
        else:
            # Field Officers/Managers live in this tenant's `staff`
            # collection (not `users` — see staff/routes.py), matched by
            # designation rather than a `role` field.
            items = []
            if managed_db_name:
                designation_map = {"FIELD_OFFICER": "Field Officer", "CONSTITUENCY_MANAGER": "Manager"}
                sq: dict = {"is_deleted": {"$ne": True}}
                if role_filter in designation_map:
                    sq["designation"] = designation_map[role_filter]
                elif role_filter:
                    sq["designation"] = "__none__"  # unrecognized role filter -> no staff match
                items = [_doc(s) for s in db.staff.find(sq).sort("created_at", -1)]
            # No specific role filter ("All Roles") — this admin's own
            # registered representative (the MLA/MP/Councillor itself)
            # should show up here too.
            if not role_filter and managed_db_name:
                items = _cross_tenant_representatives(master, only_db_name=managed_db_name) + items
        total = len(items)
        skip  = (page - 1) * per_page
        return success_response(
            {"items": items[skip:skip + per_page], "total": total, "page": page, "per_page": per_page},
            "Users retrieved",
        )

    q: dict = {"isDeleted": {"$ne": True}}
    if role_filter:
        q["role"] = role_filter
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

    now = datetime.now(timezone.utc)
    result = db.users.update_one(
        {"_id": _oid(user_id)},
        {"$set": {"profileImage": file_url, "updatedAt": now}},
    )
    if result.matched_count == 0:
        # Staff (Field Officers / Managers / PAs / Volunteers) live in
        # db.staff, not db.users — same class of bug as get_my_profile
        # originally had. Fall back so a staff member's photo actually saves
        # instead of 404ing even though the upload itself succeeded.
        result = db.staff.update_one(
            {"_id": _oid(user_id)},
            {"$set": {"profileImage": file_url, "updated_at": now}},
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

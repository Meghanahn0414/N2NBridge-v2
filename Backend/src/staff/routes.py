"""
Staff Routes — Multi-Tenant

Staff are the people working inside the representative's office.
They are created by the representative and stored in the tenant DB's `staff` collection.

GET    /api/staff/               List all staff
POST   /api/staff/               Add a staff member
GET    /api/staff/{id}           Get staff detail
PUT    /api/staff/{id}           Update staff
DELETE /api/staff/{id}           Remove staff
GET    /api/staff/{id}/workload  Grievances assigned to this staff member
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from config.database import MongoDatabase
from config.security import SecurityManager
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from utils.response import success_response
from utils.tenant import get_tenant_db, require_auth


class StaffCreate(BaseModel):
    name:        str
    mobile:      str
    email:       EmailStr
    password:    str
    designation: Optional[str] = Field("Staff", description="PA | Field Officer | Manager | Volunteer")
    role:        Optional[str] = "STAFF"

class StaffUpdate(BaseModel):
    name:        Optional[str]      = None
    designation: Optional[str]      = None
    mobile:      Optional[str]      = None
    email:       Optional[EmailStr] = None
    status:      Optional[str]      = None
    password:    Optional[str]      = None

router = APIRouter(prefix="/api/staff", tags=["Staff"])
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


def _rep_only(user: dict):
    if user.get("role") != "REPRESENTATIVE":
        raise HTTPException(status_code=403, detail="Only the representative can manage staff")


# ── CRUD ──────────────────────────────────────────────────────────────────────

@router.get("/")
async def list_staff(db=Depends(get_tenant_db), user=Depends(require_auth)):
    """List all staff members in this representative's office."""
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    staff = list(db.staff.find({"is_deleted": {"$ne": True}}).sort("name", 1))
    return success_response([_doc(s) for s in staff], "Staff retrieved")


@router.post("/")
async def add_staff(body: StaffCreate, db=Depends(get_tenant_db), user=Depends(require_auth)):
    _rep_only(user)
    mobile = body.mobile.strip()
    email  = body.email.strip().lower()

    if db.staff.find_one({"mobile": mobile, "is_deleted": {"$ne": True}}):
        raise HTTPException(status_code=400, detail="Mobile already registered")
    if db.staff.find_one({"email": email, "is_deleted": {"$ne": True}}):
        raise HTTPException(status_code=400, detail="Email already registered")

    now = datetime.now(timezone.utc)
    doc = {
        "name":         body.name,
        "designation":  body.designation or "Staff",
        "mobile":       mobile,
        "email":        email,
        "password_hash": SecurityManager.hash_password(body.password),
        "role":         (body.role or "STAFF").upper(),
        "status":       "Active",
        "is_deleted":   False,
        "created_by":   user.get("user_id"),
        "created_at":   now,
        "updated_at":   now,
    }
    result = db.staff.insert_one(doc)
    staff_id = str(result.inserted_id)

    # Register in master user_registry so login resolves this tenant DB
    master   = MongoDatabase.get_db()
    db_name  = user.get("db_name", "")
    master.user_registry.update_one(
        {"mobile": mobile},
        {"$setOnInsert": {
            "mobile":  mobile,
            "email":   email,
            "db_name": db_name,
            "role":    "STAFF",
            "user_id": staff_id,
        }},
        upsert=True,
    )
    # Also add to tenant users collection so JWT-based auth works
    db.users.update_one(
        {"mobile": mobile},
        {"$setOnInsert": {
            "fullName":     name,
            "email":        email,
            "mobile":       mobile,
            "passwordHash": SecurityManager.hash_password(password),
            "role":         "STAFF",
            "designation":  doc["designation"],
            "status":       "ACTIVE",
            "isDeleted":    False,
            "createdAt":    now,
            "updatedAt":    now,
        }},
        upsert=True,
    )

    doc["_id"] = result.inserted_id
    return success_response(_doc(doc), "Staff added successfully")


@router.get("/{staff_id}")
async def get_staff(staff_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    s = db.staff.find_one({"_id": _oid(staff_id), "is_deleted": {"$ne": True}})
    if not s:
        raise HTTPException(status_code=404, detail="Staff not found")
    return success_response(_doc(s), "Staff retrieved")


@router.put("/{staff_id}")
async def update_staff(staff_id: str, body: StaffUpdate, db=Depends(get_tenant_db), user=Depends(require_auth)):
    _rep_only(user)
    update = body.model_dump(exclude_unset=True)
    if "password" in update:
        update["password_hash"] = SecurityManager.hash_password(update.pop("password"))
    if not update:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    update["updated_at"] = datetime.now(timezone.utc)
    result = db.staff.update_one({"_id": _oid(staff_id)}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Staff not found")
    s = db.staff.find_one({"_id": _oid(staff_id)})
    return success_response(_doc(s), "Staff updated")


@router.delete("/{staff_id}")
async def remove_staff(staff_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    _rep_only(user)
    result = db.staff.update_one(
        {"_id": _oid(staff_id)},
        {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Staff not found")
    return success_response(None, "Staff removed")


@router.get("/{staff_id}/workload")
async def staff_workload(staff_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Return grievances currently assigned to this staff member."""
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    s = db.staff.find_one({"_id": _oid(staff_id)}, {"name": 1})
    if not s:
        raise HTTPException(status_code=404, detail="Staff not found")

    grievances = list(db.grievances.find(
        {"assigned_to": staff_id, "is_deleted": {"$ne": True},
         "status": {"$nin": ["Resolved", "Closed", "Rejected"]}},
        {"grievance_no": 1, "title": 1, "status": 1, "priority": 1, "created_at": 1},
    ).sort("created_at", -1))

    return success_response({
        "staff_name":   s.get("name"),
        "open_count":   len(grievances),
        "grievances":   [_doc(g) for g in grievances],
    }, "Workload retrieved")

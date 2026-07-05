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
from utils.email_service import send_welcome_email
from utils.response import success_response
from utils.tenant import get_tenant_db, require_auth


class StaffCreate(BaseModel):
    name:        str
    mobile:      str
    email:       EmailStr
    password:    str
    designation: Optional[str] = Field("Staff", description="PA | Field Officer | Manager | Volunteer")
    role:        Optional[str] = "STAFF"
    profileImage: Optional[str] = Field(None, description="Photo URL, uploaded up front during registration")
    # Generated client-side on the registration form (MGR-xxxx / FO-xxxx) and
    # shown to the user as if it would be saved — it never was, because this
    # model had nowhere to put it, so every Manager/Field Officer list page
    # showed "—" for an ID the form had already displayed. Accept whichever
    # one the caller sends; unused one just stays None.
    managerId:      Optional[str] = None
    fieldOfficerId: Optional[str] = None
    address:        Optional[str] = None
    assignedArea:   Optional[str] = None

class StaffUpdate(BaseModel):
    name:        Optional[str]      = None
    designation: Optional[str]      = None
    mobile:      Optional[str]      = None
    email:       Optional[EmailStr] = None
    status:      Optional[str]      = None
    password:    Optional[str]      = None
    profileImage: Optional[str]     = None
    address:      Optional[str]     = None
    assignedArea: Optional[str]     = None

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
    logger.info(
        f"list_staff: tenant_db={db.name} caller_role={user.get('role')} "
        f"admin_user_id={user.get('admin_user_id')} count={len(staff)}"
    )
    return success_response([_doc(s) for s in staff], "Staff retrieved")


@router.post("/")
async def add_staff(body: StaffCreate, db=Depends(get_tenant_db), user=Depends(require_auth)):
    raw_user_id = user.get("admin_user_id") or user.get("user_id")
    admin_doc_check = None
    try:
        admin_doc_check = MongoDatabase.get_db().users.find_one({"_id": ObjectId(raw_user_id)})
    except Exception:
        pass
    logger.info(
        f"add_staff: tenant_db={db.name} caller_role={user.get('role')} "
        f"raw_user_id={raw_user_id} caller_email={(admin_doc_check or {}).get('email')} "
        f"caller_managedDbName={(admin_doc_check or {}).get('managedDbName')} "
        f"name={body.name!r} designation={body.designation!r}"
    )
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
        "profileImage": body.profileImage,
        "managerId":       body.managerId,
        "fieldOfficerId":  body.fieldOfficerId,
        "address":         body.address,
        "assignedArea":    body.assignedArea,
        "status":       "Active",
        "is_deleted":   False,
        "created_by":   user.get("user_id"),
        "created_at":   now,
        "updated_at":   now,
    }
    result = db.staff.insert_one(doc)
    staff_id = str(result.inserted_id)

    # Register in master user_registry so login resolves this tenant DB.
    # user_id here is the db.staff _id — AuthService.login() now checks
    # tenant_db.staff BEFORE tenant_db.users, so that's the id the citizen's
    # JWT ends up carrying too. (This used to ALSO write a duplicate doc
    # into db.users "so JWT-based auth works" — but db.users gets its own,
    # different auto-generated _id, which never matched what
    # assign_grievance stores in assigned_to. That meant an officer's JWT
    # and their assigned grievances pointed at two different ids, so their
    # own dashboard/grievance queries always came back empty. Removed —
    # login resolves correctly via .staff alone now.)
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

    # Created by the representative on this person's behalf — they never
    # typed this password themselves, so it needs to be emailed to them or
    # they have no way to log in.
    #
    # `body.role` is the backend permission level, which is always "STAFF"
    # regardless of job title — the actual title (Field Officer / Manager /
    # PA / Volunteer) is `body.designation`, which is what should show up
    # in the email, not the generic permission role.
    try:
        send_welcome_email(email, body.name, body.designation or "Staff", password=body.password)
    except Exception as e:
        logger.warning(f"Welcome email failed for staff {email}: {e}")

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

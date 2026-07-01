"""
Grievances Routes — Multi-Tenant

All endpoints use the caller's tenant database (resolved from JWT db_name).

Citizen endpoints  (role: CITIZEN)
  POST   /api/grievances/                      Submit a new grievance
  GET    /api/grievances/                      My grievances
  GET    /api/grievances/{id}                  Grievance detail
  POST   /api/grievances/{id}/feedback         Rate / comment after resolution
  GET    /api/grievances/{id}/history          Status timeline

Representative / Staff endpoints  (role: REPRESENTATIVE | STAFF)
  GET    /api/rep/grievances/                  All grievances queue
  GET    /api/rep/grievances/{id}              Detail + history
  PATCH  /api/rep/grievances/{id}/acknowledge
  PATCH  /api/rep/grievances/{id}/progress
  PATCH  /api/rep/grievances/{id}/resolve
  PATCH  /api/rep/grievances/{id}/close
  PATCH  /api/rep/grievances/{id}/reject
  POST   /api/rep/grievances/{id}/assign       Assign to staff
  GET    /api/rep/grievances/stats             KPI stats

Category management
  GET    /api/grievances/categories
  POST   /api/grievances/categories
  PUT    /api/grievances/categories/{id}
  DELETE /api/grievances/categories/{id}
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import APIRouter, Body, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field
from utils.response import success_response
from utils.tenant import get_tenant_db, require_auth


# ── Request schemas ────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name:        str
    sla_days:    int            = Field(7,  ge=1, description="Days to resolve this category")
    description: Optional[str] = ""

class CategoryUpdate(BaseModel):
    name:        Optional[str] = None
    sla_days:    Optional[int] = Field(None, ge=1)
    description: Optional[str] = None

class GrievanceCreate(BaseModel):
    title:       str
    description: str
    citizen_id:  Optional[str]            = ""
    category:    Optional[str]            = ""
    category_id: Optional[str]            = ""
    priority:    Optional[str]            = Field("Medium", description="Low | Medium | High | Critical")
    photos:      Optional[List[str]]      = []
    location:    Optional[Dict[str, Any]] = Field({}, description="{lat, lng}")
    address:     Optional[str]            = ""

class FeedbackCreate(BaseModel):
    rating:  Optional[int] = Field(None, ge=1, le=5, description="1 – 5 stars")
    comment: Optional[str] = ""

class RemarksBody(BaseModel):
    remarks: Optional[str] = None

class AssignRequest(BaseModel):
    staff_id: str   = Field(..., description="ObjectId of the staff member")
    notes:    Optional[str] = ""

logger = logging.getLogger(__name__)

router     = APIRouter(prefix="/api/grievances", tags=["Grievances"])
rep_router = APIRouter(prefix="/api/rep/grievances", tags=["Rep Grievances"])

# ── Helpers ────────────────────────────────────────────────────────────────────

def _oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid ID: {value}")


def _doc(d: dict) -> dict:
    """Serialize a MongoDB document for JSON response."""
    if d is None:
        return {}
    d = dict(d)
    d["id"] = str(d.pop("_id", ""))
    for k, v in d.items():
        if isinstance(v, ObjectId):
            d[k] = str(v)
        elif isinstance(v, datetime):
            d[k] = v.isoformat()
    return d


def _next_grievance_no(db) -> str:
    count = db.grievances.count_documents({})
    return f"GRV{count + 1:05d}"


def _add_history(db, grievance_id, status: str, remarks: str, updated_by: str):
    db.grievance_history.insert_one({
        "grievance_id": str(grievance_id),
        "status":       status,
        "remarks":      remarks,
        "updated_by":   updated_by,
        "created_at":   datetime.now(timezone.utc),
    })


# ── Category management ────────────────────────────────────────────────────────

@router.get("/categories")
async def list_categories(db=Depends(get_tenant_db)):
    """List all grievance categories for this representative."""
    cats = list(db.grievance_categories.find({}, {"_id": 1, "name": 1, "sla_days": 1, "description": 1}))
    return success_response([_doc(c) for c in cats], "Categories retrieved")


@router.post("/categories")
async def create_category(body: CategoryCreate, db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Only representatives or staff can manage categories")
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    if db.grievance_categories.find_one({"name": {"$regex": f"^{name}$", "$options": "i"}}):
        raise HTTPException(status_code=400, detail="Category already exists")
    doc = {
        "name":        name,
        "sla_days":    body.sla_days,
        "description": body.description or "",
        "created_at":  datetime.now(timezone.utc),
    }
    result = db.grievance_categories.insert_one(doc)
    doc["_id"] = result.inserted_id
    return success_response(_doc(doc), "Category created")


@router.put("/categories/{cat_id}")
async def update_category(cat_id: str, body: CategoryUpdate, db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    update = body.model_dump(exclude_unset=True)
    if not update:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    update["updated_at"] = datetime.now(timezone.utc)
    result = db.grievance_categories.update_one({"_id": _oid(cat_id)}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return success_response(None, "Category updated")


@router.delete("/categories/{cat_id}")
async def delete_category(cat_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    result = db.grievance_categories.delete_one({"_id": _oid(cat_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return success_response(None, "Category deleted")


# ── Citizen: submit grievance ──────────────────────────────────────────────────

@router.post("/")
async def submit_grievance(body: GrievanceCreate, db=Depends(get_tenant_db), user=Depends(require_auth)):
    """
    Citizen submits a grievance.

    Body:
      title        str   (required)
      description  str   (required)
      citizen_id   str   — registered citizen user ID (optional if auth is present)
      category     str   — free-text category name
      category_id  str   — ObjectId of grievance_categories document (optional)
      priority     str   — Low | Medium | High | Critical  (default Medium)
      photos       list  — list of uploaded photo URLs
      location     dict  — {lat, lng}
      address      str
    """
    citizen_id = body.citizen_id or user.get("user_id", "")

    # Resolve SLA from category
    sla_days = 7
    if body.category_id:
        try:
            cat = db.grievance_categories.find_one({"_id": _oid(body.category_id)})
            if cat:
                sla_days = cat.get("sla_days", 7)
        except Exception:
            pass

    now = datetime.now(timezone.utc)
    doc = {
        "grievance_no":  _next_grievance_no(db),
        "citizen_id":    citizen_id,
        "title":         body.title,
        "description":   body.description,
        "category":      body.category or "",
        "category_id":   body.category_id or "",
        "status":        "Open",
        "priority":      body.priority or "Medium",
        "assigned_to":   "",
        "photos":        body.photos or [],
        "location":      body.location or {},
        "address":       body.address or "",
        "sla_due":       now + timedelta(days=sla_days),
        "closed_at":     None,
        "is_deleted":    False,
        "created_at":    now,
        "updated_at":    now,
    }
    result = db.grievances.insert_one(doc)
    _add_history(db, result.inserted_id, "Open", "Grievance submitted", citizen_id)

    # Notification to rep
    rep = db.users.find_one({"role": "REPRESENTATIVE"}, {"_id": 1})
    if rep:
        db.notifications.insert_one({
            "user_id":      str(rep["_id"]),
            "title":        "New Grievance",
            "message":      f"New complaint: {body.title}",
            "type":         "Grievance",
            "reference_id": str(result.inserted_id),
            "is_read":      False,
            "created_at":   now,
        })

    doc["_id"] = result.inserted_id
    return success_response(_doc(doc), "Grievance submitted successfully")


@router.get("/")
async def my_grievances(
    page:     int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    status:   Optional[str] = None,
    db=Depends(get_tenant_db),
    user=Depends(require_auth),
):
    """Citizen: list own grievances."""
    citizen_id = user.get("user_id")
    q: dict = {"citizen_id": citizen_id, "is_deleted": {"$ne": True}}
    if status:
        q["status"] = status
    skip = (page - 1) * per_page
    items = list(db.grievances.find(q).sort("created_at", -1).skip(skip).limit(per_page))
    total = db.grievances.count_documents(q)
    return success_response(
        {"items": [_doc(g) for g in items], "total": total, "page": page, "per_page": per_page},
        "Grievances retrieved",
    )


@router.get("/{grievance_id}")
async def get_grievance(grievance_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Get a single grievance (citizen sees own; rep/staff sees any)."""
    g = db.grievances.find_one({"_id": _oid(grievance_id), "is_deleted": {"$ne": True}})
    if not g:
        raise HTTPException(status_code=404, detail="Grievance not found")
    if user.get("role") == "CITIZEN" and g.get("citizen_id") != user.get("user_id"):
        raise HTTPException(status_code=403, detail="Access denied")
    return success_response(_doc(g), "Grievance retrieved")


@router.get("/{grievance_id}/history")
async def grievance_history(grievance_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Status timeline for a grievance."""
    g = db.grievances.find_one({"_id": _oid(grievance_id)}, {"_id": 1, "citizen_id": 1})
    if not g:
        raise HTTPException(status_code=404, detail="Grievance not found")
    if user.get("role") == "CITIZEN" and g.get("citizen_id") != user.get("user_id"):
        raise HTTPException(status_code=403, detail="Access denied")
    events = list(db.grievance_history.find({"grievance_id": grievance_id}).sort("created_at", 1))
    return success_response([_doc(e) for e in events], "History retrieved")


@router.post("/{grievance_id}/feedback")
async def submit_feedback(grievance_id: str, body: FeedbackCreate, db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Citizen submits feedback after a grievance is resolved."""
    citizen_id = user.get("user_id")
    g = db.grievances.find_one({"_id": _oid(grievance_id)})
    if not g:
        raise HTTPException(status_code=404, detail="Grievance not found")
    if g.get("citizen_id") != citizen_id:
        raise HTTPException(status_code=403, detail="Access denied")
    doc = {
        "citizen_id":    citizen_id,
        "grievance_id":  grievance_id,
        "rating":        body.rating,
        "comment":       (body.comment or "").strip(),
        "created_at":    datetime.now(timezone.utc),
    }
    db.feedback.insert_one(doc)
    # Store on grievance too for quick access
    db.grievances.update_one(
        {"_id": _oid(grievance_id)},
        {"$set": {"feedback": {"rating": doc["rating"], "comments": doc["comment"]},
                  "updated_at": datetime.now(timezone.utc)}},
    )
    return success_response(None, "Feedback submitted")


# ── Representative/Staff: grievance queue ─────────────────────────────────────

@rep_router.get("/stats")
async def rep_stats(db=Depends(get_tenant_db), user=Depends(require_auth)):
    """KPI statistics for the representative dashboard."""
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    base: dict = {"is_deleted": {"$ne": True}}
    now = datetime.now(timezone.utc)
    thirty_ago = now - timedelta(days=30)

    total     = db.grievances.count_documents(base)
    open_c    = db.grievances.count_documents({**base, "status": "Open"})
    in_prog   = db.grievances.count_documents({**base, "status": "In Progress"})
    resolved  = db.grievances.count_documents({**base, "status": {"$in": ["Resolved", "Closed"]}})
    overdue   = db.grievances.count_documents({**base, "status": {"$nin": ["Resolved", "Closed", "Rejected"]},
                                               "sla_due": {"$lt": now}})
    new_30d   = db.grievances.count_documents({**base, "created_at": {"$gte": thirty_ago}})
    citizens  = db.citizens.count_documents({"is_deleted": {"$ne": True}})

    return success_response({
        "total": total, "open": open_c, "inProgress": in_prog,
        "resolved": resolved, "overdue": overdue,
        "new30d": new_30d, "totalCitizens": citizens,
    }, "Stats retrieved")


@rep_router.get("/")
async def rep_list_grievances(
    page:     int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status:   Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    search:   Optional[str] = None,
    db=Depends(get_tenant_db),
    user=Depends(require_auth),
):
    """Representative/Staff: full grievance queue with filters."""
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    q: dict = {"is_deleted": {"$ne": True}}
    if status:
        q["status"] = status
    if priority:
        q["priority"] = priority
    if category:
        q["category"] = {"$regex": category, "$options": "i"}
    if search:
        q["$or"] = [
            {"title":       {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"grievance_no": {"$regex": search, "$options": "i"}},
        ]
    skip  = (page - 1) * per_page
    items = list(db.grievances.find(q).sort("created_at", -1).skip(skip).limit(per_page))
    total = db.grievances.count_documents(q)
    return success_response(
        {"items": [_doc(g) for g in items], "total": total, "page": page, "per_page": per_page},
        "Grievances retrieved",
    )


@rep_router.get("/{grievance_id}")
async def rep_get_grievance(grievance_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Get grievance detail with full citizen info and history."""
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    g = db.grievances.find_one({"_id": _oid(grievance_id)})
    if not g:
        raise HTTPException(status_code=404, detail="Grievance not found")
    data = _doc(g)
    # Attach citizen profile
    try:
        c = db.citizens.find_one({"_id": _oid(g.get("citizen_id", ""))})
        if c:
            data["citizen"] = {"name": c.get("name"), "mobile": c.get("mobile"),
                               "address": c.get("address"), "citizen_id": c.get("citizen_id")}
    except Exception:
        pass
    # Attach history
    data["history"] = [_doc(e) for e in
                       db.grievance_history.find({"grievance_id": grievance_id}).sort("created_at", 1)]
    return success_response(data, "Grievance retrieved")


def _update_status(db, grievance_id: str, new_status: str, remarks: str, actor_id: str):
    now = datetime.now(timezone.utc)
    update: dict = {"$set": {"status": new_status, "updated_at": now}}
    if new_status in ("Resolved", "Closed", "Rejected"):
        update["$set"]["closed_at"] = now
    db.grievances.update_one({"_id": _oid(grievance_id)}, update)
    _add_history(db, grievance_id, new_status, remarks, actor_id)


@rep_router.patch("/{grievance_id}/acknowledge")
async def acknowledge(grievance_id: str, body: RemarksBody = Body(RemarksBody()), db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    _update_status(db, grievance_id, "Acknowledged", body.remarks or "Acknowledged", user["user_id"])
    return success_response(None, "Grievance acknowledged")


@rep_router.patch("/{grievance_id}/progress")
async def mark_progress(grievance_id: str, body: RemarksBody = Body(RemarksBody()), db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    _update_status(db, grievance_id, "In Progress", body.remarks or "Work started", user["user_id"])
    return success_response(None, "Status updated to In Progress")


@rep_router.patch("/{grievance_id}/resolve")
async def resolve_grievance(grievance_id: str, body: RemarksBody = Body(RemarksBody()), db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    _update_status(db, grievance_id, "Resolved", body.remarks or "Issue resolved", user["user_id"])
    # Notify citizen
    g = db.grievances.find_one({"_id": _oid(grievance_id)}, {"citizen_id": 1, "title": 1})
    if g:
        db.notifications.insert_one({
            "user_id":      g.get("citizen_id", ""),
            "title":        "Grievance Resolved",
            "message":      f"Your complaint '{g.get('title')}' has been resolved.",
            "type":         "Grievance",
            "reference_id": grievance_id,
            "is_read":      False,
            "created_at":   datetime.now(timezone.utc),
        })
    return success_response(None, "Grievance resolved")


@rep_router.patch("/{grievance_id}/close")
async def close_grievance(grievance_id: str, body: RemarksBody = Body(RemarksBody()), db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    _update_status(db, grievance_id, "Closed", body.remarks or "Closed", user["user_id"])
    return success_response(None, "Grievance closed")


@rep_router.patch("/{grievance_id}/reject")
async def reject_grievance(grievance_id: str, body: RemarksBody = Body(RemarksBody()), db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    _update_status(db, grievance_id, "Rejected", body.remarks or "Rejected", user["user_id"])
    return success_response(None, "Grievance rejected")


@rep_router.post("/{grievance_id}/assign")
async def assign_grievance(grievance_id: str, body: AssignRequest, db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Assign grievance to a staff member."""
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    staff_id = body.staff_id.strip()
    if not staff_id:
        raise HTTPException(status_code=400, detail="staff_id is required")
    staff = db.staff.find_one({"_id": _oid(staff_id)})
    staff_name = staff.get("name", "Staff") if staff else "Staff"
    now = datetime.now(timezone.utc)
    db.grievances.update_one(
        {"_id": _oid(grievance_id)},
        {"$set": {"assigned_to": staff_id, "status": "Acknowledged", "updated_at": now}},
    )
    _add_history(db, grievance_id, "Acknowledged", f"Assigned to {staff_name}", user["user_id"])
    # Notify staff
    db.notifications.insert_one({
        "user_id":      staff_id,
        "title":        "Complaint Assigned",
        "message":      "A new complaint has been assigned to you",
        "type":         "Grievance",
        "reference_id": grievance_id,
        "is_read":      False,
        "created_at":   now,
    })
    return success_response(None, f"Assigned to {staff_name}")


@router.post("/{grievance_id}/upload")
async def upload_photo(
    grievance_id: str,
    file: UploadFile = File(...),
    db=Depends(get_tenant_db),
    user=Depends(require_auth),
):
    """Upload an attachment photo for a grievance."""
    try:
        from utils.storage import upload_file
        file_url = await upload_file(file, folder="grievances")
        now = datetime.now(timezone.utc)
        db.attachments.insert_one({
            "grievance_id": grievance_id,
            "file_name":    file.filename,
            "file_url":     file_url,
            "file_type":    file.content_type,
            "uploaded_by":  user.get("user_id"),
            "created_at":   now,
        })
        db.grievances.update_one(
            {"_id": _oid(grievance_id)},
            {"$push": {"photos": file_url}, "$set": {"updated_at": now}},
        )
        return success_response({"file_url": file_url, "file_name": file.filename}, "Uploaded")
    except Exception as exc:
        logger.error(f"Upload failed: {exc}")
        raise HTTPException(status_code=500, detail="Upload failed")

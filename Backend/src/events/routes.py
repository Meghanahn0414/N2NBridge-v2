"""
Event Routes — Multi-Tenant

GET    /api/events/                  List events
POST   /api/events/                  Create event
GET    /api/events/{id}              Get event
PUT    /api/events/{id}              Update event
DELETE /api/events/{id}              Delete event
POST   /api/events/{id}/publish      Publish (notifies citizens)
POST   /api/events/{id}/cancel       Cancel (notifies citizens)
POST   /api/events/{id}/register     Citizen registers for event
GET    /api/events/{id}/registrations List registrations
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from utils.response import success_response
from utils.tenant import get_tenant_db, require_auth


class EventCreate(BaseModel):
    title:         str
    venue:         Optional[str] = ""
    date:          Optional[str] = ""
    description:   Optional[str] = ""
    status:        Optional[str] = "Upcoming"
    max_attendees: Optional[int] = None
    image_url:     Optional[str] = ""

class EventUpdate(BaseModel):
    title:         Optional[str] = None
    venue:         Optional[str] = None
    date:          Optional[str] = None
    description:   Optional[str] = None
    max_attendees: Optional[int] = None
    image_url:     Optional[str] = None

router = APIRouter(prefix="/api/events", tags=["Events"])
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


# ── CRUD ──────────────────────────────────────────────────────────────────────

@router.get("/")
async def list_events(
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
    items = list(db.events.find(q).sort("date", -1).skip(skip).limit(per_page))
    total = db.events.count_documents(q)
    return success_response(
        {"items": [_doc(e) for e in items], "total": total, "page": page, "per_page": per_page},
        "Events retrieved",
    )


@router.get("/{event_id}")
async def get_event(event_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    e = db.events.find_one({"_id": _oid(event_id), "is_deleted": {"$ne": True}})
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    data = _doc(e)
    data["registration_count"] = db.event_registrations.count_documents({"event_id": event_id})
    return success_response(data, "Event retrieved")


@router.post("/")
async def create_event(body: EventCreate, db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    now = datetime.now(timezone.utc)
    doc = {
        "title":         body.title,
        "venue":         body.venue or "",
        "date":          body.date or "",
        "description":   body.description or "",
        "status":        body.status or "Upcoming",
        "max_attendees": body.max_attendees,
        "image_url":     body.image_url or "",
        "is_deleted":    False,
        "created_by":    user.get("user_id"),
        "created_at":    now,
        "updated_at":    now,
    }
    result = db.events.insert_one(doc)
    doc["_id"] = result.inserted_id
    return success_response(_doc(doc), "Event created")


@router.put("/{event_id}")
async def update_event(event_id: str, body: EventUpdate, db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    update = body.model_dump(exclude_unset=True)
    if not update:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    update["updated_at"] = datetime.now(timezone.utc)
    result = db.events.update_one({"_id": _oid(event_id)}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    e = db.events.find_one({"_id": _oid(event_id)})
    return success_response(_doc(e), "Event updated")


@router.delete("/{event_id}")
async def delete_event(event_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    result = db.events.update_one(
        {"_id": _oid(event_id)},
        {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return success_response(None, "Event deleted")


@router.post("/{event_id}/publish")
async def publish_event(event_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    now = datetime.now(timezone.utc)
    result = db.events.update_one(
        {"_id": _oid(event_id)},
        {"$set": {"status": "Published", "published_at": now, "updated_at": now}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    # Notify all citizens
    e = db.events.find_one({"_id": _oid(event_id)})
    if e:
        citizens = list(db.citizens.find({"is_deleted": {"$ne": True}}, {"_id": 1}))
        notifs = [{
            "user_id":      str(cit["_id"]),
            "title":        f"New Event: {e.get('title')}",
            "message":      f"{e.get('venue', '')} — {e.get('date', '')}",
            "type":         "Event",
            "reference_id": event_id,
            "is_read":      False,
            "created_at":   now,
        } for cit in citizens]
        if notifs:
            db.notifications.insert_many(notifs)
    return success_response(None, "Event published")


@router.post("/{event_id}/cancel")
async def cancel_event(event_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    now = datetime.now(timezone.utc)
    e = db.events.find_one({"_id": _oid(event_id)})
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    db.events.update_one({"_id": _oid(event_id)}, {"$set": {"status": "Cancelled", "updated_at": now}})
    # Notify registered citizens
    regs = list(db.event_registrations.find({"event_id": event_id}, {"citizen_id": 1}))
    if regs:
        notifs = [{
            "user_id":      r["citizen_id"],
            "title":        "Event Cancelled",
            "message":      f"The event '{e.get('title')}' has been cancelled.",
            "type":         "Event",
            "reference_id": event_id,
            "is_read":      False,
            "created_at":   now,
        } for r in regs if r.get("citizen_id")]
        if notifs:
            db.notifications.insert_many(notifs)
    return success_response(None, "Event cancelled")


# ── Registrations ──────────────────────────────────────────────────────────────

@router.post("/{event_id}/register")
async def register_for_event(event_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Citizen registers for an event (idempotent)."""
    citizen_id = user.get("user_id")
    e = db.events.find_one({"_id": _oid(event_id), "is_deleted": {"$ne": True}})
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check capacity
    max_att = e.get("max_attendees")
    if max_att:
        count = db.event_registrations.count_documents({"event_id": event_id})
        if count >= max_att:
            raise HTTPException(status_code=400, detail="Event is full")

    existing = db.event_registrations.find_one({"event_id": event_id, "citizen_id": citizen_id})
    if existing:
        return success_response({"already_registered": True}, "Already registered")

    now = datetime.now(timezone.utc)
    db.event_registrations.insert_one({
        "event_id":   event_id,
        "citizen_id": citizen_id,
        "status":     "registered",
        "registered_at": now,
    })
    return success_response({"already_registered": False}, "Registered successfully")


@router.get("/{event_id}/registrations")
async def get_registrations(
    event_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db=Depends(get_tenant_db),
    user=Depends(require_auth),
):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    skip  = (page - 1) * per_page
    regs  = list(db.event_registrations.find({"event_id": event_id})
                 .sort("registered_at", -1).skip(skip).limit(per_page))
    total = db.event_registrations.count_documents({"event_id": event_id})

    # Enrich with citizen names
    items = []
    for r in regs:
        entry = _doc(r)
        try:
            c = db.citizens.find_one({"_id": _oid(r.get("citizen_id", ""))},
                                     {"name": 1, "mobile": 1})
            if c:
                entry["citizen_name"]   = c.get("name", "")
                entry["citizen_mobile"] = c.get("mobile", "")
        except Exception:
            pass
        items.append(entry)

    return success_response({"items": items, "total": total}, "Registrations retrieved")


@router.post("/registrations/{reg_id}/attend")
async def mark_attendance(reg_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    result = db.event_registrations.update_one(
        {"_id": _oid(reg_id)},
        {"$set": {"status": "attended", "attended_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Registration not found")
    return success_response(None, "Attendance marked")

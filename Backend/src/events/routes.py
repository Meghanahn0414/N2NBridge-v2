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
from events.model import EventCreate, EventUpdate
from fastapi import APIRouter, Depends, HTTPException, Query
from utils.email_service import send_email
from utils.response import success_response
from utils.tenant import get_tenant_db, require_auth

# NOTE: EventCreate/EventUpdate used to be defined locally here with a
# different shape (title/venue/date/description/max_attendees/image_url)
# than events/model.py's real ones (eventName/eventType/eventDate/capacity/
# organizerId/wardId/qrEnabled) — which is what EventManagement.jsx has
# always sent via features/events/eventService.js. Every event creation was
# failing Pydantic validation with a 422 for the missing required `title`
# field. Same bug class as campaigns/routes.py, fixed the same way: import
# the correct models instead of shadowing them. Docs still also store
# title/date/venue/location aliases so older read-only views (EventList.jsx,
# FieldOfficerEvents.jsx) that fall back to those field names keep working.

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
    items = list(db.events.find(q).sort("eventDate", -1).skip(skip).limit(per_page))
    total = db.events.count_documents(q)

    # For a citizen caller, tell the client which of these events they've
    # already registered for, so a "Join Event" button can render as
    # "Joined" right after a fresh page load / navigation — without this,
    # the frontend only knew about a registration for the lifetime of its
    # own in-memory state, so it reverted to "Join Event" on every remount
    # even though the registration was still there server-side.
    my_registered_ids: set = set()
    if user.get("role") == "CITIZEN" and user.get("user_id"):
        event_ids = [_doc(e)["id"] for e in items]
        my_registered_ids = {
            r["event_id"] for r in db.event_registrations.find(
                {"citizen_id": user["user_id"], "event_id": {"$in": event_ids}},
                {"event_id": 1},
            )
        }

    out = []
    for e in items:
        d = _doc(e)
        d["registrationCount"] = db.event_registrations.count_documents({"event_id": d["id"]})
        if user.get("role") == "CITIZEN":
            d["registered"] = d["id"] in my_registered_ids
        out.append(d)
    return success_response(
        {"items": out, "total": total, "page": page, "per_page": per_page},
        "Events retrieved",
    )


@router.get("/{event_id}")
async def get_event(event_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    e = db.events.find_one({"_id": _oid(event_id), "is_deleted": {"$ne": True}})
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    data = _doc(e)
    data["registrationCount"] = db.event_registrations.count_documents({"event_id": event_id})
    data["registration_count"] = data["registrationCount"]  # legacy alias
    return success_response(data, "Event retrieved")


@router.post("/")
async def create_event(body: EventCreate, db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    now = datetime.now(timezone.utc)
    doc = {
        "eventName":    body.eventName,
        "description":  body.description or "",
        "eventType":    body.eventType or "Other",
        "venue":        body.venue or "",
        "eventDate":    body.eventDate,
        "capacity":     body.capacity,
        "qrEnabled":    body.qrEnabled if body.qrEnabled is not None else True,
        "organizerId":  body.organizerId,
        "wardId":       body.wardId,
        "channels":     body.channels or [],
        "status":       "DRAFT",
        # Compat aliases for older read-only views (EventList.jsx,
        # FieldOfficerEvents.jsx) that still look for title/date/location.
        "title":        body.eventName,
        "date":         body.eventDate.isoformat() if body.eventDate else "",
        "location":     body.venue or "",
        "max_attendees": body.capacity,
        "is_deleted":   False,
        "created_by":   user.get("user_id"),
        "createdAt":    now,
        "updatedAt":    now,
    }
    result = db.events.insert_one(doc)
    doc["_id"] = result.inserted_id
    resp = _doc(doc)
    resp["registrationCount"] = 0
    return success_response(resp, "Event created")


@router.put("/{event_id}")
async def update_event(event_id: str, body: EventUpdate, db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    update = body.model_dump(exclude_unset=True)
    if not update:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    # Keep compat aliases in sync with whichever canonical fields changed.
    if "eventName" in update:
        update["title"] = update["eventName"]
    if "eventDate" in update:
        update["date"] = update["eventDate"].isoformat() if update["eventDate"] else ""
    if "venue" in update:
        update["location"] = update["venue"]
    if "capacity" in update:
        update["max_attendees"] = update["capacity"]
    update["updatedAt"] = datetime.now(timezone.utc)
    result = db.events.update_one({"_id": _oid(event_id)}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    e = db.events.find_one({"_id": _oid(event_id)})
    data = _doc(e)
    data["registrationCount"] = db.event_registrations.count_documents({"event_id": event_id})
    return success_response(data, "Event updated")


@router.delete("/{event_id}")
async def delete_event(event_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    result = db.events.update_one(
        {"_id": _oid(event_id)},
        {"$set": {"is_deleted": True, "updatedAt": datetime.now(timezone.utc)}},
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
        {"$set": {"status": "PUBLISHED", "publishedAt": now, "updatedAt": now}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    # Notify all citizens (or just the targeted ward, if set)
    e = db.events.find_one({"_id": _oid(event_id)})
    if e:
        cit_q: dict = {"is_deleted": {"$ne": True}}
        ward_id = e.get("wardId")
        if ward_id:
            # `wardId` may hold a Councillor ward code/name, or an MLA/MP's
            # assembly/parliamentary constituency name — see the matching
            # comment in campaigns/routes.py's launch_campaign.
            cit_q["$or"] = [
                {"ward_id": ward_id}, {"ward_number": ward_id}, {"area_name": ward_id},
                {"assembly_name": ward_id}, {"parliamentary_name": ward_id},
            ]
        # "Email" is one of the Delivery Channels checkboxes in the Broadcasts
        # composer — only fetch/send email when the rep actually selected it.
        email_channel = "Email" in (e.get("channels") or [])
        projection = {"_id": 1, "email": 1} if email_channel else {"_id": 1}
        citizens = list(db.citizens.find(cit_q, projection))
        event_name = e.get("eventName") or e.get("title", "")
        event_date = e.get("eventDate").isoformat() if e.get("eventDate") else e.get("date", "")
        venue = e.get("venue", "")
        notifs = [{
            "user_id":      str(cit["_id"]),
            "title":        f"New Event: {event_name}",
            "message":      f"{venue} — {event_date}",
            "type":         "Event",
            "reference_id": event_id,
            "is_read":      False,
            "created_at":   now,
        } for cit in citizens]
        if notifs:
            db.notifications.insert_many(notifs)

        if email_channel:
            subject = f"New Event: {event_name}"
            body = f"""
Hello,

Your representative has published a new event.

Event:  {event_name}
Venue:  {venue}
Date:   {event_date}

{e.get('description', '')}

Best regards,
N2N Team
            """
            for cit in citizens:
                email = (cit.get("email") or "").strip()
                if not email:
                    continue
                try:
                    send_email(email, subject, body)
                except Exception as ex:
                    logger.warning(f"Event email failed for citizen {cit.get('_id')}: {ex}")
    return success_response(None, "Event published")


@router.post("/{event_id}/cancel")
async def cancel_event(event_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    now = datetime.now(timezone.utc)
    e = db.events.find_one({"_id": _oid(event_id)})
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    db.events.update_one({"_id": _oid(event_id)}, {"$set": {"status": "CANCELLED", "updatedAt": now}})
    event_name = e.get("eventName") or e.get("title", "")
    # Notify registered citizens
    regs = list(db.event_registrations.find({"event_id": event_id}, {"citizen_id": 1}))
    if regs:
        notifs = [{
            "user_id":      r["citizen_id"],
            "title":        "Event Cancelled",
            "message":      f"The event '{event_name}' has been cancelled.",
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

"""
Notification Routes — Multi-Tenant

GET    /api/notifications/              My notifications (paginated)
GET    /api/notifications/unread        Unread list
PATCH  /api/notifications/{id}/read     Mark one as read
POST   /api/notifications/read-all      Mark all as read
DELETE /api/notifications/{id}          Delete notification
POST   /api/notifications/send          Rep sends to specific citizen
POST   /api/notifications/broadcast     Rep broadcasts to all citizens
"""
import logging
import os
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from utils.response import success_response
from utils.tenant import get_tenant_db, require_auth

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
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


# ── List & read ────────────────────────────────────────────────────────────────

@router.get("/")
async def list_notifications(
    page:     int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db=Depends(get_tenant_db),
    user=Depends(require_auth),
):
    user_id = user.get("user_id")
    q: dict = {"user_id": user_id}
    skip  = (page - 1) * per_page
    items = list(db.notifications.find(q).sort("created_at", -1).skip(skip).limit(per_page))
    total = db.notifications.count_documents(q)
    unread = db.notifications.count_documents({**q, "is_read": False})
    return success_response(
        {"items": [_doc(n) for n in items], "total": total, "unread": unread,
         "page": page, "per_page": per_page},
        "Notifications retrieved",
    )


@router.get("/unread")
async def unread_notifications(db=Depends(get_tenant_db), user=Depends(require_auth)):
    user_id = user.get("user_id")
    items = list(db.notifications.find({"user_id": user_id, "is_read": False}).sort("created_at", -1))
    return success_response([_doc(n) for n in items], f"{len(items)} unread notifications")


@router.get("/stats")
async def notification_stats(db=Depends(get_tenant_db), user=Depends(require_auth)):
    user_id = user.get("user_id")
    total  = db.notifications.count_documents({"user_id": user_id})
    unread = db.notifications.count_documents({"user_id": user_id, "is_read": False})
    return success_response({"total": total, "unread": unread}, "Stats retrieved")


@router.patch("/{notif_id}/read")
@router.put("/{notif_id}/read")
async def mark_read(notif_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    result = db.notifications.update_one(
        {"_id": _oid(notif_id), "user_id": user.get("user_id")},
        {"$set": {"is_read": True}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return success_response(None, "Marked as read")


@router.post("/read-all")
async def mark_all_read(db=Depends(get_tenant_db), user=Depends(require_auth)):
    result = db.notifications.update_many(
        {"user_id": user.get("user_id"), "is_read": False},
        {"$set": {"is_read": True}},
    )
    return success_response({"count": result.modified_count}, f"Marked {result.modified_count} as read")


@router.delete("/{notif_id}")
async def delete_notification(notif_id: str, db=Depends(get_tenant_db), user=Depends(require_auth)):
    result = db.notifications.delete_one(
        {"_id": _oid(notif_id), "user_id": user.get("user_id")},
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return success_response(None, "Notification deleted")


# ── Rep broadcast tools ────────────────────────────────────────────────────────

class SendRequest(BaseModel):
    citizen_id: str
    title: str
    message: str
    type: str = "Message"


class BroadcastRequest(BaseModel):
    title: str
    message: str
    type: str = "Broadcast"


@router.post("/send")
async def send_to_citizen(body: SendRequest, db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Send a direct in-app notification to a specific citizen."""
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    now = datetime.now(timezone.utc)
    doc = {
        "user_id":      body.citizen_id,
        "title":        body.title,
        "message":      body.message,
        "type":         body.type,
        "reference_id": "",
        "is_read":      False,
        "created_at":   now,
    }
    result = db.notifications.insert_one(doc)
    return success_response({"id": str(result.inserted_id)}, "Notification sent")


@router.post("/broadcast")
async def broadcast_all(body: BroadcastRequest, db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Broadcast an in-app notification to all registered citizens."""
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    citizens = list(db.citizens.find({"is_deleted": {"$ne": True}}, {"_id": 1}))
    if not citizens:
        return success_response({"sent": 0}, "No citizens to notify")
    now = datetime.now(timezone.utc)
    notifs = [{
        "user_id":      str(c["_id"]),
        "title":        body.title,
        "message":      body.message,
        "type":         body.type,
        "reference_id": "",
        "is_read":      False,
        "created_at":   now,
    } for c in citizens]
    db.notifications.insert_many(notifs)
    return success_response({"sent": len(notifs)}, f"Broadcast sent to {len(notifs)} citizens")


# ── SMS / Email service status (unchanged from original) ──────────────────────

@router.get("/sms/status")
async def sms_status():
    providers = {
        "fast2sms": bool(os.getenv("FAST2SMS_API_KEY")),
        "twilio":   bool(os.getenv("TWILIO_ACCOUNT_SID")),
        "custom":   bool(os.getenv("SMS_API_URL")),
    }
    active = next((k for k, v in providers.items() if v), "console_fallback")
    return success_response({"active_provider": active, "providers": providers,
                              "configured": active != "console_fallback"}, "SMS status")


@router.get("/email/status")
async def email_status():
    configured = bool(os.getenv("SMTP_USERNAME") or os.getenv("SENDER_EMAIL"))
    return success_response({"configured": configured,
                              "smtp_server": os.getenv("SMTP_SERVER", "smtp.gmail.com")}, "Email status")

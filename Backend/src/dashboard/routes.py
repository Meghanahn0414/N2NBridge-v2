"""
Dashboard Routes

Legacy, role-based dashboards (still used by the web frontend):
GET /api/dashboard/admin     Admin dashboard
GET /api/dashboard/mla       MLA / representative dashboard
GET /api/dashboard/officer   Field officer dashboard
GET /api/dashboard/citizen   Citizen dashboard

Multi-tenant dashboard (representative/staff, tenant-scoped):
GET /api/dashboard/          Main stats for the representative's dashboard
GET /api/dashboard/settings  CRM settings
PUT /api/dashboard/settings  Update CRM settings
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from bson import ObjectId
from dashboard.service import DashboardService
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool
from utils.response import success_response
from utils.tenant import get_tenant_db, require_auth

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])
logger = logging.getLogger(__name__)


class SettingsUpdate(BaseModel):
    default_sla_days:      Optional[int]  = None
    auto_assign:           Optional[bool] = None
    notification_enabled:  Optional[bool] = None
    office_hours:          Optional[str]  = None
    welcome_message:       Optional[str]  = None


def serialize_for_json(obj):
    """Convert MongoDB ObjectId and datetime to JSON serializable format"""
    if isinstance(obj, dict):
        return {key: serialize_for_json(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [serialize_for_json(item) for item in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, datetime):
        return obj.isoformat()
    return obj


def _oid(val: str) -> ObjectId:
    try:
        return ObjectId(val)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid ID: {val}")


# ═══════════════════════════════════════════════════════════════════════════════
# LEGACY ROLE-BASED DASHBOARDS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/admin")
async def get_admin_dashboard(db=Depends(get_tenant_db), current_user: dict = Depends(require_auth)):
    """Get admin dashboard — tenant-scoped to the calling Admin's own managed
    representative (via utils.tenant's Admin-to-tenant resolution)."""
    try:
        dashboard = await run_in_threadpool(DashboardService.get_admin_dashboard, db)
        dashboard = serialize_for_json(dashboard)
        return success_response(dashboard, "Admin dashboard retrieved")
    except Exception as e:
        logger.error(f"Error fetching admin dashboard: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": str(e),
                "statusCode": 500
            }
        )


@router.get("/mla")
async def get_mla_dashboard(db=Depends(get_tenant_db), current_user: dict = Depends(require_auth)):
    """Get MLA/representative dashboard — tenant-scoped to the caller's own db."""
    try:
        # Offload the blocking pymongo aggregation work to a thread so this
        # request doesn't hold up the event loop (and every other request
        # this worker is serving) for however long the query takes.
        dashboard = await run_in_threadpool(DashboardService.get_mla_dashboard, db)
        dashboard = serialize_for_json(dashboard)
        return success_response(dashboard, "MLA dashboard retrieved")
    except Exception as e:
        logger.error(f"Error fetching MLA dashboard: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": str(e),
                "statusCode": 500
            }
        )


@router.get("/officer")
async def get_officer_dashboard(db=Depends(get_tenant_db), current_user: dict = Depends(require_auth)):
    """Get officer dashboard — tenant-scoped to the calling officer's own db."""
    try:
        dashboard = DashboardService.get_officer_dashboard(current_user["user_id"], db=db)
        dashboard = serialize_for_json(dashboard)
        return success_response(dashboard, "Officer dashboard retrieved")
    except Exception as e:
        logger.error(f"Error fetching officer dashboard: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": str(e),
                "statusCode": 500
            }
        )


@router.get("/citizen")
async def get_citizen_dashboard():
    """Get citizen dashboard"""
    try:
        dashboard = DashboardService.get_citizen_dashboard(None)
        dashboard = serialize_for_json(dashboard)
        return success_response(dashboard, "Citizen dashboard retrieved")
    except Exception as e:
        logger.error(f"Error fetching citizen dashboard: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": str(e),
                "statusCode": 500
            }
        )


# ═══════════════════════════════════════════════════════════════════════════════
# MULTI-TENANT DASHBOARD (representative / staff, tenant-scoped)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/")
async def dashboard(db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Main dashboard statistics for the representative."""
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")

    now        = datetime.now(timezone.utc)
    thirty_ago = now - timedelta(days=30)
    seven_ago  = now - timedelta(days=7)
    base: dict = {"is_deleted": {"$ne": True}}

    # ── Grievance KPIs ─────────────────────────────────────────────────────────
    total_grievances = db.grievances.count_documents(base)
    open_grievances  = db.grievances.count_documents({**base, "status": "Open"})
    in_progress      = db.grievances.count_documents({**base, "status": "In Progress"})
    resolved         = db.grievances.count_documents({**base, "status": {"$in": ["Resolved", "Closed"]}})
    overdue          = db.grievances.count_documents({
        **base,
        "status": {"$nin": ["Resolved", "Closed", "Rejected"]},
        "sla_due": {"$lt": now},
    })
    new_this_week  = db.grievances.count_documents({**base, "created_at": {"$gte": seven_ago}})
    new_this_month = db.grievances.count_documents({**base, "created_at": {"$gte": thirty_ago}})
    resolution_rate = round(resolved / total_grievances * 100) if total_grievances else 0

    # ── Citizens ───────────────────────────────────────────────────────────────
    total_citizens   = db.citizens.count_documents({"is_deleted": {"$ne": True}})
    new_citizens_30d = db.citizens.count_documents({
        "is_deleted": {"$ne": True}, "created_at": {"$gte": thirty_ago},
    })

    # ── Staff ──────────────────────────────────────────────────────────────────
    total_staff  = db.staff.count_documents({"is_deleted": {"$ne": True}})
    active_staff = db.staff.count_documents({"is_deleted": {"$ne": True}, "status": "Active"})

    # ── Campaigns & events ─────────────────────────────────────────────────────
    active_campaigns = db.campaigns.count_documents({**base, "status": "Active"})
    upcoming_events  = db.events.count_documents({**base, "status": {"$in": ["Upcoming", "Published"]}})

    # ── Category breakdown (top 5) ─────────────────────────────────────────────
    cat_pipeline = [
        {"$match": base},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
    ]
    category_breakdown = [
        {"category": c["_id"] or "Uncategorized", "count": c["count"]}
        for c in db.grievances.aggregate(cat_pipeline)
    ]

    # ── Status breakdown ───────────────────────────────────────────────────────
    status_pipeline = [
        {"$match": base},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]
    status_breakdown = {s["_id"]: s["count"] for s in db.grievances.aggregate(status_pipeline)}

    # ── Monthly trend (last 6 months) ──────────────────────────────────────────
    trend_points = []
    for i in range(5, -1, -1):
        target  = now - timedelta(days=30 * i)
        m_start = target.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if m_start.month < 12:
            m_end = m_start.replace(month=m_start.month + 1)
        else:
            m_end = m_start.replace(year=m_start.year + 1, month=1)
        submitted  = db.grievances.count_documents({**base, "created_at": {"$gte": m_start, "$lt": m_end}})
        resolved_m = db.grievances.count_documents({
            **base,
            "status": {"$in": ["Resolved", "Closed"]},
            "updated_at": {"$gte": m_start, "$lt": m_end},
        })
        trend_points.append({
            "month":     m_start.strftime("%b %Y"),
            "submitted": submitted,
            "resolved":  resolved_m,
        })

    # ── Recent grievances ──────────────────────────────────────────────────────
    recent_raw = list(db.grievances.find(base, {
        "grievance_no": 1, "title": 1, "status": 1, "priority": 1,
        "category": 1, "citizen_id": 1, "created_at": 1,
    }).sort("created_at", -1).limit(5))
    recent = []
    for g in recent_raw:
        entry = {
            "id":           str(g["_id"]),
            "grievance_no": g.get("grievance_no", ""),
            "title":        g.get("title", ""),
            "status":       g.get("status", ""),
            "priority":     g.get("priority", ""),
            "category":     g.get("category", ""),
            "created_at":   g["created_at"].isoformat() if g.get("created_at") else None,
        }
        try:
            c = db.citizens.find_one({"_id": _oid(g.get("citizen_id", ""))}, {"name": 1, "mobile": 1})
            if c:
                entry["citizen_name"]   = c.get("name", "")
                entry["citizen_mobile"] = c.get("mobile", "")
        except Exception:
            pass
        recent.append(entry)

    # ── Top staff by resolved grievances ───────────────────────────────────────
    staff_pipeline = [
        {"$match": {**base, "status": {"$in": ["Resolved", "Closed"]},
                    "assigned_to": {"$nin": [None, ""]}}},
        {"$group": {"_id": "$assigned_to", "resolved": {"$sum": 1}}},
        {"$sort": {"resolved": -1}},
        {"$limit": 3},
    ]
    top_staff = []
    for entry in db.grievances.aggregate(staff_pipeline):
        sid = entry["_id"]
        try:
            s = db.staff.find_one({"_id": _oid(sid)}, {"name": 1, "designation": 1})
            if s:
                top_staff.append({
                    "name":        s.get("name", ""),
                    "designation": s.get("designation", ""),
                    "resolved":    entry["resolved"],
                })
        except Exception:
            pass

    return success_response({
        "grievances": {
            "total":          total_grievances,
            "open":           open_grievances,
            "inProgress":     in_progress,
            "resolved":       resolved,
            "overdue":        overdue,
            "newThisWeek":    new_this_week,
            "newThisMonth":   new_this_month,
            "resolutionRate": resolution_rate,
        },
        "citizens":  {"total": total_citizens, "new30d": new_citizens_30d},
        "staff":     {"total": total_staff,    "active": active_staff},
        "campaigns": {"active": active_campaigns},
        "events":    {"upcoming": upcoming_events},
        "categoryBreakdown": category_breakdown,
        "statusBreakdown":   status_breakdown,
        "monthlyTrend":      trend_points,
        "recentGrievances":  recent,
        "topStaff":          top_staff,
    }, "Dashboard data retrieved")


@router.get("/settings")
async def get_settings(db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Get representative's CRM settings."""
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    s = db.settings.find_one({}) or {}
    rep = db.users.find_one({"role": "REPRESENTATIVE"}, {
        "fullName": 1, "title": 1, "mobile": 1, "email": 1,
        "officeAddress": 1, "bio": 1, "profileImage": 1,
    }) or {}
    rep_clean = {k: (str(v) if isinstance(v, ObjectId) else v)
                 for k, v in rep.items() if k != "_id"}
    return success_response({
        "repProfile":          rep_clean,
        "defaultSlaDays":      s.get("default_sla_days", 7),
        "autoAssign":          s.get("auto_assign", False),
        "notificationEnabled": s.get("notification_enabled", True),
        "officeHours":         s.get("office_hours", ""),
        "welcomeMessage":      s.get("welcome_message", ""),
    }, "Settings retrieved")


@router.put("/settings")
async def update_settings(body: SettingsUpdate, db=Depends(get_tenant_db), user=Depends(require_auth)):
    """Update CRM settings (representative only)."""
    if user.get("role") != "REPRESENTATIVE":
        raise HTTPException(status_code=403, detail="Only representative can update settings")
    update = body.model_dump(exclude_unset=True)
    update["updated_at"] = datetime.now(timezone.utc)
    db.settings.update_one({}, {"$set": update}, upsert=True)
    return success_response(None, "Settings updated")

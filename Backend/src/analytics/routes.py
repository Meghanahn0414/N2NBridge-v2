"""
Analytics Routes
"""
from fastapi import APIRouter, Depends, HTTPException
from starlette.concurrency import run_in_threadpool

from analytics.service import AnalyticsService
from utils.response import success_response
from utils.tenant import get_tenant_db, require_auth
import logging

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])
logger = logging.getLogger(__name__)


async def _run(fn, label):
    try:
        # These are all blocking pymongo calls. Running them directly inside an
        # `async def` route blocks the event loop for the whole request —
        # meaning every other request this worker is handling (including
        # unrelated things like notification polling) has to wait for this one
        # analytics query to finish first. run_in_threadpool offloads it to a
        # worker thread so the event loop stays free; result and error
        # handling are unchanged.
        return await run_in_threadpool(fn)
    except Exception as exc:
        logger.error(f"Analytics {label} error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analytics error ({label}): {exc}")


# Every endpoint below is tenant-scoped to the caller's own db (Representative,
# Staff, or an Admin resolved to their managed tenant — see utils/tenant.py).
# These used to take no auth/tenant dependency at all and query the master
# DB internally, where none of this data lives.

@router.get("/grievances")
async def get_grievance_stats(db=Depends(get_tenant_db), current_user: dict = Depends(require_auth)):
    return success_response(await _run(lambda: AnalyticsService.get_grievance_stats(db), "grievances"))


@router.get("/alerts")
async def get_alert_stats(db=Depends(get_tenant_db), current_user: dict = Depends(require_auth)):
    return success_response(await _run(lambda: AnalyticsService.get_alert_stats(db), "alerts"))


@router.get("/users")
async def get_user_stats(db=Depends(get_tenant_db), current_user: dict = Depends(require_auth)):
    return success_response(await _run(lambda: AnalyticsService.get_user_stats(db), "users"))


@router.get("/events")
async def get_event_stats(db=Depends(get_tenant_db), current_user: dict = Depends(require_auth)):
    return success_response(await _run(lambda: AnalyticsService.get_event_stats(db), "events"))


@router.get("/resolution-time")
async def get_resolution_time(db=Depends(get_tenant_db), current_user: dict = Depends(require_auth)):
    return success_response(await _run(lambda: AnalyticsService.get_resolution_time_stats(db), "resolution-time"))


@router.get("/dashboard")
async def get_dashboard_metrics(days: int = 365, db=Depends(get_tenant_db), current_user: dict = Depends(require_auth)):
    return success_response(await _run(lambda: AnalyticsService.get_performance_metrics(db, days=days), "dashboard"))

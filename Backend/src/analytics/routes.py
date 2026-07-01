"""
Analytics Routes
"""
from fastapi import APIRouter, HTTPException
from starlette.concurrency import run_in_threadpool

from analytics.service import AnalyticsService
from utils.response import success_response
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


@router.get("/grievances")
async def get_grievance_stats():
    return success_response(await _run(AnalyticsService.get_grievance_stats, "grievances"))


@router.get("/alerts")
async def get_alert_stats():
    return success_response(await _run(AnalyticsService.get_alert_stats, "alerts"))


@router.get("/users")
async def get_user_stats():
    return success_response(await _run(AnalyticsService.get_user_stats, "users"))


@router.get("/events")
async def get_event_stats():
    return success_response(await _run(AnalyticsService.get_event_stats, "events"))


@router.get("/resolution-time")
async def get_resolution_time():
    return success_response(await _run(AnalyticsService.get_resolution_time_stats, "resolution-time"))


@router.get("/dashboard")
async def get_dashboard_metrics(days: int = 365):
    return success_response(await _run(lambda: AnalyticsService.get_performance_metrics(days=days), "dashboard"))

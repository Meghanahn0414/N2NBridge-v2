"""
Analytics Routes
"""
from fastapi import APIRouter, HTTPException

from analytics.service import AnalyticsService
from utils.response import success_response
import logging

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])
logger = logging.getLogger(__name__)


def _run(fn, label):
    try:
        return fn()
    except Exception as exc:
        logger.error(f"Analytics {label} error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analytics error ({label}): {exc}")


@router.get("/grievances")
async def get_grievance_stats():
    return success_response(_run(AnalyticsService.get_grievance_stats, "grievances"))


@router.get("/alerts")
async def get_alert_stats():
    return success_response(_run(AnalyticsService.get_alert_stats, "alerts"))


@router.get("/users")
async def get_user_stats():
    return success_response(_run(AnalyticsService.get_user_stats, "users"))


@router.get("/events")
async def get_event_stats():
    return success_response(_run(AnalyticsService.get_event_stats, "events"))


@router.get("/resolution-time")
async def get_resolution_time():
    return success_response(_run(AnalyticsService.get_resolution_time_stats, "resolution-time"))


@router.get("/dashboard")
async def get_dashboard_metrics(days: int = 365):
    return success_response(_run(lambda: AnalyticsService.get_performance_metrics(days=days), "dashboard"))

"""
Analytics Routes
"""
from fastapi import APIRouter

from analytics.service import AnalyticsService
from utils.response import success_response
import logging

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])
logger = logging.getLogger(__name__)


@router.get("/grievances")
async def get_grievance_stats():
    """Get grievance statistics"""
    stats = AnalyticsService.get_grievance_stats()
    return success_response(stats, "Grievance statistics retrieved")


@router.get("/alerts")
async def get_alert_stats():
    """Get alert statistics"""
    stats = AnalyticsService.get_alert_stats()
    return success_response(stats, "Alert statistics retrieved")


@router.get("/users")
async def get_user_stats():
    """Get user statistics"""
    stats = AnalyticsService.get_user_stats()
    return success_response(stats, "User statistics retrieved")


@router.get("/events")
async def get_event_stats():
    """Get event statistics"""
    stats = AnalyticsService.get_event_stats()
    return success_response(stats, "Event statistics retrieved")


@router.get("/resolution-time")
async def get_resolution_time():
    """Get resolution time statistics"""
    stats = AnalyticsService.get_resolution_time_stats()
    return success_response(stats, "Resolution time statistics retrieved")


@router.get("/dashboard")
async def get_dashboard_metrics():
    """Get all dashboard metrics"""
    metrics = AnalyticsService.get_performance_metrics()
    return success_response(metrics, "Dashboard metrics retrieved")

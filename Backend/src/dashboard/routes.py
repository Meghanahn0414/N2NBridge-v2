"""
Dashboard Routes
"""
from fastapi import APIRouter, Depends
from auth.routes import get_current_user
from dashboard.service import DashboardService
from utils.response import success_response
import logging

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])
logger = logging.getLogger(__name__)


@router.get("/admin")
async def get_admin_dashboard(current_user: dict = Depends(get_current_user)):
    """Get admin dashboard"""
    dashboard = DashboardService.get_admin_dashboard()
    return success_response(dashboard, "Admin dashboard retrieved")


@router.get("/officer")
async def get_officer_dashboard(current_user: dict = Depends(get_current_user)):
    """Get officer dashboard"""
    dashboard = DashboardService.get_officer_dashboard(current_user["user_id"])
    return success_response(dashboard, "Officer dashboard retrieved")


@router.get("/citizen")
async def get_citizen_dashboard(current_user: dict = Depends(get_current_user)):
    """Get citizen dashboard"""
    dashboard = DashboardService.get_citizen_dashboard(current_user["user_id"])
    return success_response(dashboard, "Citizen dashboard retrieved")

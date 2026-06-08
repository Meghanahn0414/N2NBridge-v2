"""
Dashboard Routes
"""
from fastapi import APIRouter

from dashboard.service import DashboardService
from utils.response import success_response
import logging

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])
logger = logging.getLogger(__name__)


@router.get("/admin")
async def get_admin_dashboard():
    """Get admin dashboard"""
    dashboard = DashboardService.get_admin_dashboard()
    return success_response(dashboard, "Admin dashboard retrieved")

@router.get("/mla")
async def get_mla_dashboard():
    dashboard = DashboardService.get_mla_dashboard()
    return success_response(dashboard,"MLA dashboard retrieved")

@router.get("/officer")
async def get_officer_dashboard():
    """Get officer dashboard"""
    dashboard = DashboardService.get_officer_dashboard(None)
    return success_response(dashboard, "Officer dashboard retrieved")


@router.get("/citizen")
async def get_citizen_dashboard():
    """Get citizen dashboard"""
    dashboard = DashboardService.get_citizen_dashboard(None)
    return success_response(dashboard, "Citizen dashboard retrieved")

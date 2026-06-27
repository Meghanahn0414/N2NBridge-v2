"""
Dashboard Routes
"""
import logging
from datetime import datetime

from bson import ObjectId
from dashboard.service import DashboardService
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from utils.response import success_response
from auth.routes import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])
logger = logging.getLogger(__name__)


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


@router.get("/admin")
async def get_admin_dashboard():
    """Get admin dashboard"""
    try:
        dashboard = DashboardService.get_admin_dashboard()
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
async def get_mla_dashboard():
    try:
        dashboard = DashboardService.get_mla_dashboard()
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
async def get_officer_dashboard(current_user: dict = Depends(get_current_user)):
    """Get officer dashboard"""
    try:
        dashboard = DashboardService.get_officer_dashboard(current_user["user_id"])
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

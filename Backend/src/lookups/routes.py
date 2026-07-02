from fastapi import APIRouter, HTTPException
from lookups.service import (get_alert_priorities, get_alert_statuses,
                             get_alert_types, get_audience_segments,
                             get_communication_channels, get_countries,
                             get_event_statuses, get_event_types,
                             get_grievance_categories,
                             get_grievance_priorities, get_grievance_statuses,
                             get_representative_responsibilities,
                             get_user_roles, get_user_statuses)
from utils.response import success_response

router = APIRouter(prefix="/api/lookups", tags=["Lookups"])

@router.get("/countries")
async def list_countries():
    return success_response(get_countries())

@router.get("/user-roles")
async def list_user_roles():
    return success_response(get_user_roles())

@router.get("/user-statuses")
async def list_user_statuses():
    return success_response(get_user_statuses())

@router.get("/grievance-statuses")
async def list_grievance_statuses():
    return success_response(get_grievance_statuses())

@router.get("/grievance-priorities")
async def list_grievance_priorities():
    return success_response(get_grievance_priorities())

@router.get("/grievance-categories")
async def list_grievance_categories(rep_type: str = None):
    try:
        return success_response(get_grievance_categories(rep_type))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/representative-responsibilities")
async def list_representative_responsibilities(rep_type: str = None):
    try:
        return success_response(get_representative_responsibilities(rep_type))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/alert-priorities")
async def list_alert_priorities():
    return success_response(get_alert_priorities())

@router.get("/alert-statuses")
async def list_alert_statuses():
    return success_response(get_alert_statuses())

@router.get("/alert-types")
async def list_alert_types():
    return success_response(get_alert_types())

@router.get("/event-statuses")
async def list_event_statuses():
    return success_response(get_event_statuses())

@router.get("/event-types")
async def list_event_types():
    return success_response(get_event_types())

@router.get("/communication-channels")
async def list_communication_channels():
    return success_response(get_communication_channels())

@router.get("/audience-segments")
async def list_audience_segments():
    return success_response(get_audience_segments())

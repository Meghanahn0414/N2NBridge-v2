"""
Emergency SOS Routes
"""
import logging
from typing import Optional

from auth.service import AuthService
from emergency.model import (EmergencySOSCreate, EmergencySOSResponse,
                             EmergencySOSUpdate)
from emergency.service import EmergencySOSService
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from utils.helper import Helper
from utils.response import success_response

router = APIRouter(prefix="/api/emergency", tags=["Emergency SOS"])
logger = logging.getLogger(__name__)


def get_current_user(authorization: Optional[str] = Header(None, alias="Authorization")):
    """Get current user from token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    token = authorization.replace("Bearer ", "")
    payload = AuthService.verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return payload


@router.post("/send-alert", response_model=dict)
async def send_sos_alert(
    sos_data: EmergencySOSCreate,
    token_data: dict = Depends(get_current_user)
):
    """Send emergency SOS alert"""
    try:
        # Verify the citizenId in the request matches the authenticated user
        token_user_id = token_data.get("user_id") or token_data.get("citizenId") or token_data.get("sub")
        if token_user_id and sos_data.citizenId not in (token_user_id, token_data.get("citizenId", "")):
            raise HTTPException(status_code=403, detail="Unauthorized citizen")
        
        # Create SOS alert
        sos_id = EmergencySOSService.create_sos_alert(sos_data.dict())
        
        # Fetch the created SOS alert
        sos = EmergencySOSService.get_sos_by_id(sos_id)
        
        if not sos:
            raise HTTPException(status_code=500, detail="Failed to create SOS alert")
        
        sos = Helper.convert_mongo_doc(sos)
        
        return success_response(
            data={
                "sosTicketId": sos.get("sosTicketId"),
                "_id": sos.get("_id"),
                "message": "Emergency SOS alert sent successfully to nearby officers"
            },
            message="SOS alert sent successfully"
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error sending SOS alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{sos_ticket_id}", response_model=dict)
async def get_sos_alert(
    sos_ticket_id: str,
    token_data: dict = Depends(get_current_user)
):
    """Get SOS alert details"""
    try:
        sos = EmergencySOSService.get_sos_by_ticket_id(sos_ticket_id)
        
        if not sos:
            raise HTTPException(status_code=404, detail="SOS alert not found")
        
        # Check authorization
        if sos.get("citizenId") != token_data.get("citizenId") and token_data.get("role") not in ["ADMIN", "FIELD_OFFICER"]:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        sos = Helper.convert_mongo_doc(sos)
        
        return success_response(
            data=sos,
            message="SOS alert retrieved successfully"
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching SOS alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=dict)
async def list_sos_alerts(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    token_data: dict = Depends(get_current_user)
):
    """List SOS alerts"""
    try:
        skip, limit = Helper.paginate(page, per_page)
        
        # Citizen can only see their own alerts
        if token_data.get("role") == "CITIZEN":
            alerts = EmergencySOSService.get_citizen_sos_alerts(
                token_data.get("citizenId"),
                skip=skip,
                limit=limit
            )
        else:
            # Officers/Admins can see active alerts
            alerts = EmergencySOSService.get_active_sos_alerts(skip=skip, limit=limit)
        
        alerts = [Helper.convert_mongo_doc(a) for a in alerts]
        
        return success_response(
            data={
                "alerts": alerts,
                "page": page,
                "per_page": per_page,
                "total": len(alerts)
            },
            message="SOS alerts retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Error listing SOS alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{sos_ticket_id}/acknowledge", response_model=dict)
async def acknowledge_sos(
    sos_ticket_id: str,
    token_data: dict = Depends(get_current_user)
):
    """Acknowledge SOS alert (for officers)"""
    try:
        # Only field officers and admins can acknowledge
        if token_data.get("role") not in ["FIELD_OFFICER", "ADMIN"]:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        sos = EmergencySOSService.get_sos_by_ticket_id(sos_ticket_id)
        if not sos:
            raise HTTPException(status_code=404, detail="SOS alert not found")
        
        success = EmergencySOSService.acknowledge_sos(sos["_id"], token_data.get("userId"))
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to acknowledge SOS alert")
        
        # Fetch updated SOS
        sos = EmergencySOSService.get_sos_by_ticket_id(sos_ticket_id)
        sos = Helper.convert_mongo_doc(sos)
        
        return success_response(
            data=sos,
            message="SOS alert acknowledged successfully"
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error acknowledging SOS alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{sos_ticket_id}/resolve", response_model=dict)
async def resolve_sos(
    sos_ticket_id: str,
    token_data: dict = Depends(get_current_user)
):
    """Mark SOS alert as resolved (for officers)"""
    try:
        # Only field officers and admins can resolve
        if token_data.get("role") not in ["FIELD_OFFICER", "ADMIN"]:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        sos = EmergencySOSService.get_sos_by_ticket_id(sos_ticket_id)
        if not sos:
            raise HTTPException(status_code=404, detail="SOS alert not found")
        
        success = EmergencySOSService.resolve_sos(sos["_id"], token_data.get("userId"))
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to resolve SOS alert")
        
        # Fetch updated SOS
        sos = EmergencySOSService.get_sos_by_ticket_id(sos_ticket_id)
        sos = Helper.convert_mongo_doc(sos)
        
        return success_response(
            data=sos,
            message="SOS alert resolved successfully"
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error resolving SOS alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/summary", response_model=dict)
async def get_sos_stats(
    token_data: dict = Depends(get_current_user)
):
    """Get SOS statistics"""
    try:
        # Only admins and managers can access stats
        if token_data.get("role") not in ["ADMIN", "MANAGER"]:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        stats = EmergencySOSService.get_sos_stats()
        
        return success_response(
            data=stats,
            message="SOS stats retrieved successfully"
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching SOS stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

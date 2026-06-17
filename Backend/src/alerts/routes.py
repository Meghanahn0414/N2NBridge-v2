"""
Alert Routes
"""
import logging
from typing import Optional

from alerts.model import AlertCreate, AlertResponse, AlertUpdate
from alerts.service import AlertService
from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from utils.helper import Helper
from utils.response import success_response

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=AlertResponse)
async def create_alert(
    alert_data: AlertCreate
):
    """Create alert"""
    alert_id = AlertService.create_alert(
        alert_data.dict(),
        None
    )

    alert = AlertService.get_alert_by_id(alert_id)
    return AlertResponse(**Helper.convert_mongo_doc(alert))


@router.get("/", response_model=list[AlertResponse])
async def list_alerts(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    priority: Optional[str] = None
):
    """List alerts"""
    skip, limit = Helper.paginate(page, per_page)
    filters = {}

    if status:
        filters["status"] = status
    if priority:
        filters["priority"] = priority

    alerts = AlertService.list_alerts(skip, limit, filters)
    return [AlertResponse(**Helper.convert_mongo_doc(a)) for a in alerts]


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: str
):
    """Get alert by ID"""
    alert = AlertService.get_alert_by_id(alert_id)

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    return AlertResponse(**Helper.convert_mongo_doc(alert))


@router.put("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: str,
    update_data: AlertUpdate
):
    """Update alert"""
    success = AlertService.update_alert(
        alert_id,
        update_data.dict(exclude_unset=True),
        None
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update alert")
    
    alert = AlertService.get_alert_by_id(alert_id)
    return AlertResponse(**Helper.convert_mongo_doc(alert))


@router.post("/{alert_id}/assign/{officer_id}")
async def assign_alert(
    alert_id: str,
    officer_id: str
):
    """Assign alert to officer"""
    success = AlertService.assign_alert(alert_id, officer_id, None)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to assign alert")
    
    return success_response(None, "Alert assigned successfully")


# Media Upload for Alerts
@router.post("/{alert_id}/upload-media")
async def upload_alert_media(
    alert_id: str,
    file: UploadFile = File(...)
):
    """Upload media attachment to alert"""
    try:
        from utils.storage import upload_file

        # Validate alert exists
        alert = AlertService.get_alert_by_id(alert_id)
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")

        # Upload file (S3 or local depending on config)
        file_url = await upload_file(file, folder="alerts")
        
        # Add to alert media attachments
        success = AlertService.add_media_attachment(alert_id, file_url)
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to save media attachment")
        
        return success_response(
            {"mediaUrl": file_url},
            "Media uploaded successfully"
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Upload failed")


@router.post("/broadcast", response_model=AlertResponse)
async def broadcast_alert(alert_data: AlertCreate):
    """Broadcast alert to all users"""
    try:
        # Create broadcast alert
        alert_dict = alert_data.dict()
        alert_dict["isBroadcast"] = True
        alert_id = AlertService.create_alert(alert_dict, None)
        
        if not alert_id:
            raise HTTPException(status_code=400, detail="Failed to broadcast alert")
        
        alert = AlertService.get_alert_by_id(alert_id)
        return AlertResponse(**Helper.convert_mongo_doc(alert))
    except Exception as e:
        logger.error(f"Broadcast alert error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to broadcast alert: {str(e)}")



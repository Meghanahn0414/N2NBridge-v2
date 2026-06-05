"""
Notification Routes
"""
from fastapi import APIRouter, HTTPException, Query

from notifications.service import NotificationService
from notifications.model import  NotificationResponse
from utils.response import success_response
from utils.helper import Helper
import logging

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
logger = logging.getLogger(__name__)


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: str
):
    """Get notification"""
    notification = NotificationService.get_notification_by_id(notification_id)
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return NotificationResponse(**Helper.convert_mongo_doc(notification))


@router.get("/", response_model=list[NotificationResponse])
async def list_notifications(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100)
):
    """List user notifications"""
    skip, limit = Helper.paginate(page, per_page)
    notifications = NotificationService.get_user_notifications(
        None,
        skip,
        limit
    )
    
    return [NotificationResponse(**Helper.convert_mongo_doc(n)) for n in notifications]


@router.get("/unread")
async def get_unread_notifications():
    """Get unread notifications"""
    notifications = NotificationService.get_unread_notifications(None)
    
    return success_response(
        [NotificationResponse(**n) for n in notifications],
        f"Retrieved {len(notifications)} unread notifications"
    )


@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_as_read(
    notification_id: str
):
    """Mark notification as read"""
    success = NotificationService.mark_as_read(notification_id)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to mark notification as read")
    
    notification = NotificationService.get_notification_by_id(notification_id)
    return NotificationResponse(**Helper.convert_mongo_doc(notification))


@router.post("/mark-all-read")
async def mark_all_as_read():
    """Mark all notifications as read"""
    count = NotificationService.mark_all_as_read(None)
    
    return success_response({"count": count}, f"Marked {count} notifications as read")


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str
):
    """Delete notification"""
    success = NotificationService.delete_notification(notification_id)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete notification")
    
    return success_response(None, "Notification deleted successfully")



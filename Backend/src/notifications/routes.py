"""
Notification Routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from auth.routes import get_current_user
from notifications.service import NotificationService
from notifications.model import NotificationCreate, NotificationResponse, NotificationUpdate
from utils.response import success_response, error_response
from utils.helper import Helper
import traceback
import logging

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
logger = logging.getLogger(__name__)
@router.get("/", response_model=list[NotificationResponse])
async def list_notifications(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """List user notifications"""
    skip, limit = Helper.paginate(page, per_page)
    notifications = NotificationService.get_user_notifications(
        current_user["user_id"],
        skip,
        limit
    )

    Helper.prepare_response_list(notifications)
    return [NotificationResponse(**n) for n in notifications]


@router.get("/unread")
async def get_unread_notifications(current_user: dict = Depends(get_current_user)):
    """Get unread notifications"""
    try:
        notifications = NotificationService.get_unread_notifications(current_user["user_id"])

        Helper.prepare_response_list(notifications)
        return success_response(
            [NotificationResponse(**n) for n in notifications],
            f"Retrieved {len(notifications)} unread notifications"
        )
    except Exception as e:
        # Development-time enhanced error response to aid debugging
        logger.error(f"Error in get_unread_notifications: {e}\n{traceback.format_exc()}")
        return error_response(message=f"{e}", status_code=500)


@router.post("/mark-all-read")
async def mark_all_as_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    count = NotificationService.mark_all_as_read(current_user["user_id"])

    return success_response({"count": count}, f"Marked {count} notifications as read")


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get notification"""
    notification = NotificationService.get_notification_by_id(notification_id)

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    Helper.prepare_response_data(notification)
    return NotificationResponse(**notification)


@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark notification as read"""
    success = NotificationService.mark_as_read(notification_id)

    if not success:
        raise HTTPException(status_code=400, detail="Failed to mark notification as read")

    notification = NotificationService.get_notification_by_id(notification_id)
    Helper.prepare_response_data(notification)
    return NotificationResponse(**notification)


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete notification"""
    success = NotificationService.delete_notification(notification_id)

    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete notification")

    return success_response(None, "Notification deleted successfully")

"""
Notification Routes
"""
import logging
import os
from typing import Optional

from auth.service import AuthService
from config.database import MongoDatabase
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from notifications.model import NotificationResponse
from notifications.service import NotificationService
from pydantic import BaseModel, EmailStr
from utils.email_service import send_otp_via_email
from utils.helper import Helper
from utils.jwt import TokenManager
from utils.response import success_response
from utils.sms_service import send_otp_via_sms

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
logger = logging.getLogger(__name__)


def get_current_user_optional(authorization: Optional[str] = Header(None, alias="Authorization")):
    """Get current user from token (optional - returns None if not authenticated)"""
    if not authorization:
        return None
    
    token = TokenManager.extract_token_from_header(authorization)
    if not token:
        return None
    
    payload = AuthService.verify_token(token)
    if not payload:
        return None
    
    return payload


# ======================== LIST & GET ENDPOINTS (MUST BE BEFORE PARAMETRIZED ROUTES) ========================

@router.get("/", response_model=list[NotificationResponse])
async def list_notifications(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=1000),
    current_user: dict = Depends(get_current_user_optional)
):
    """List user notifications"""
    skip, limit = Helper.paginate(page, per_page)
    user_id = current_user.get("user_id") if current_user else None
    notifications = NotificationService.get_user_notifications(
        user_id,
        skip,
        limit
    )
    
    return [NotificationResponse(**Helper.convert_mongo_doc(n)) for n in notifications]


@router.get("/unread")
async def get_unread_notifications(
    current_user: dict = Depends(get_current_user_optional)
):
    """Get unread notifications"""
    user_id = current_user.get("user_id") if current_user else None
    notifications = NotificationService.get_unread_notifications(user_id)
    
    return success_response(
        [NotificationResponse(**Helper.convert_mongo_doc(n)) for n in notifications],
        f"Retrieved {len(notifications)} unread notifications"
    )


# ======================== SPECIFIC NOTIFICATION ENDPOINTS (AFTER NON-PARAMETRIZED ROUTES) ========================

@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user_optional)
):
    """Get notification"""
    notification = NotificationService.get_notification_by_id(notification_id)
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return NotificationResponse(**Helper.convert_mongo_doc(notification))


@router.put("/{notification_id}/read", response_model=NotificationResponse)
@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user_optional)
):
    """Mark notification as read (supports both PUT and PATCH)"""
    success = NotificationService.mark_as_read(notification_id)

    if not success:
        raise HTTPException(status_code=400, detail="Failed to mark notification as read")

    notification = NotificationService.get_notification_by_id(notification_id)
    return NotificationResponse(**Helper.convert_mongo_doc(notification))


@router.post("/mark-all-read")
async def mark_all_as_read(
    current_user: dict = Depends(get_current_user_optional)
):
    """Mark all notifications as read"""
    user_id = current_user.get("user_id") if current_user else None
    count = NotificationService.mark_all_as_read(user_id)
    
    return success_response({"count": count}, f"Marked {count} notifications as read")


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user_optional)
):
    """Delete notification"""
    success = NotificationService.delete_notification(notification_id)

    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete notification")

    return success_response(None, "Notification deleted successfully")


@router.get("/stats/stats")
async def get_notification_stats(
    current_user: dict = Depends(get_current_user_optional)
):
    """Get notification statistics"""
    try:
        user_id = current_user.get("user_id") if current_user else None
        db = MongoDatabase.get_db()
        
        # Count unread and total notifications for user
        unread_count = db.notifications.count_documents({
            "recipientId": user_id,
            "isRead": False
        }) if user_id else 0
        
        total_count = db.notifications.count_documents({
            "recipientId": user_id
        }) if user_id else 0
        
        stats = {
            "unread": unread_count,
            "total": total_count
        }
        
        return success_response(stats, "Notification statistics retrieved")
    except Exception as e:
        logger.error(f"Error retrieving notification stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve statistics")


# ======================== SMS & Email Service Testing ========================

# Request Models
class SendSMSRequest(BaseModel):
    phone_number: str
    otp: str
    message: str = None


class SendEmailRequest(BaseModel):
    email: EmailStr
    otp: str


class TestSMSRequest(BaseModel):
    phone_number: str


class TestEmailRequest(BaseModel):
    email: EmailStr


# ======================== SMS Endpoints ========================

@router.post("/sms/send")
async def send_sms(request: SendSMSRequest):
    """
    Send OTP via SMS
    
    Args:
        phone_number: Phone number (10 digits or +91XXXXXXXXXX)
        otp: 4-digit OTP code
        message: Custom message (optional)
    
    Returns:
        Success/failure response
    """
    try:
        # Validate phone number
        if len(request.phone_number.replace("+", "").replace(" ", "")) < 10:
            raise HTTPException(
                status_code=400,
                detail="Phone number must be at least 10 digits"
            )
        
        result = send_otp_via_sms(request.phone_number, request.otp, request.message)
        
        if result:
            return success_response(
                {"phone_number": request.phone_number, "otp": request.otp},
                "SMS sent successfully"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to send SMS. Check your provider configuration."
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending SMS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending SMS: {str(e)}")


@router.post("/sms/test")
async def test_sms(request: TestSMSRequest):
    """
    Test SMS service with a test OTP (1234)
    
    Args:
        phone_number: Phone number to test
    
    Returns:
        Success/failure response
    """
    try:
        if len(request.phone_number.replace("+", "").replace(" ", "")) < 10:
            raise HTTPException(
                status_code=400,
                detail="Phone number must be at least 10 digits"
            )
        
        result = send_otp_via_sms(
            request.phone_number,
            "1234",
            "Test OTP from CRM: 1234"
        )
        
        if result:
            return success_response(
                {"phone_number": request.phone_number, "test_otp": "1234"},
                "Test SMS sent successfully"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to send test SMS. Check your SMS provider configuration."
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending test SMS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending test SMS: {str(e)}")


@router.get("/sms/status")
async def check_sms_status():
    """
    Check SMS service status
    
    Returns:
        Status information
    """
    providers = {
        "twilio": bool(os.getenv("TWILIO_ACCOUNT_SID")),
        "aws_sns": bool(os.getenv("AWS_ACCESS_KEY_ID")),
        "custom_api": bool(os.getenv("SMS_API_URL")),
    }
    
    active_provider = next((k for k, v in providers.items() if v), "console_fallback")
    
    return success_response(
        {
            "active_provider": active_provider,
            "providers": providers,
            "configured": active_provider != "console_fallback"
        },
        "SMS service status retrieved"
    )


# ======================== Email Endpoints ========================

@router.post("/email/send")
async def send_email(request: SendEmailRequest):
    """
    Send OTP via Email
    
    Args:
        email: Email address
        otp: 4-digit OTP code
    
    Returns:
        Success/failure response
    """
    try:
        result = send_otp_via_email(request.email, request.otp)
        
        if result:
            return success_response(
                {"email": request.email, "otp": request.otp},
                "Email sent successfully"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to send email. Check your SMTP configuration."
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending email: {str(e)}")


@router.post("/email/test")
async def test_email(request: TestEmailRequest):
    """
    Test Email service with a test OTP (1234)
    
    Args:
        email: Email address to test
    
    Returns:
        Success/failure response
    """
    try:
        result = send_otp_via_email(request.email, "1234")
        
        if result:
            return success_response(
                {"email": request.email, "test_otp": "1234"},
                "Test email sent successfully"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to send test email. Check your SMTP configuration."
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending test email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending test email: {str(e)}")


@router.get("/email/status")
async def check_email_status():
    """
    Check Email service status
    
    Returns:
        Status information
    """
    configured = bool(os.getenv("SMTP_EMAIL"))
    
    return success_response(
        {
            "configured": configured,
            "smtp_server": os.getenv("SMTP_SERVER", "smtp.gmail.com"),
            "smtp_email": os.getenv("SMTP_EMAIL", "not_configured")
        },
        "Email service status retrieved"
    )


@router.get("/stats", response_model=dict)
async def get_notification_stats(
    current_user: dict = Depends(get_current_user_optional)
):
    """Get notification statistics"""
    try:
        user_id = current_user.get("user_id") if current_user else None
        
        if user_id:
            # Get user-specific stats
            unread_count = len(NotificationService.get_unread_notifications(user_id))
            total_count = len(NotificationService.get_user_notifications(user_id, 0, 10000))
        else:
            # Get global stats
            db = MongoDatabase.get_db()
            unread_count = db["notifications"].count_documents({"is_read": False})
            total_count = db["notifications"].count_documents({})
        
        return success_response(
            data={
                "unread": unread_count,
                "total": total_count
            },
            message="Notification stats retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Error fetching notification stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


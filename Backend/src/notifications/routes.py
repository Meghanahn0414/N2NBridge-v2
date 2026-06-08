"""
Notification Routes
"""
<<<<<<< HEAD
from fastapi import APIRouter, Depends, HTTPException, Query
from auth.routes import get_current_user
from notifications.service import NotificationService
from notifications.model import NotificationCreate, NotificationResponse, NotificationUpdate
from utils.response import success_response, error_response
from utils.helper import Helper
import traceback
=======
>>>>>>> edad0dcb7e287f8a594e1b1c4fb576de75e28fee
import logging
import os

from fastapi import APIRouter, HTTPException, Query
from notifications.model import NotificationResponse
from notifications.service import NotificationService
from pydantic import BaseModel, EmailStr
from utils.email_service import send_otp_via_email
from utils.helper import Helper
from utils.response import success_response
from utils.sms_service import send_otp_via_sms

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
logger = logging.getLogger(__name__)
<<<<<<< HEAD
=======


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: str
):
    """Get notification"""
    notification = NotificationService.get_notification_by_id(notification_id)
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return NotificationResponse(**Helper.convert_mongo_doc(notification))


>>>>>>> edad0dcb7e287f8a594e1b1c4fb576de75e28fee
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
<<<<<<< HEAD

    Helper.prepare_response_list(notifications)
    return [NotificationResponse(**n) for n in notifications]
=======
    
    return [NotificationResponse(**Helper.convert_mongo_doc(n)) for n in notifications]
>>>>>>> edad0dcb7e287f8a594e1b1c4fb576de75e28fee


@router.get("/unread")
async def get_unread_notifications():
    """Get unread notifications"""
<<<<<<< HEAD
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
=======
    notifications = NotificationService.get_unread_notifications(None)
    
    return success_response(
        [NotificationResponse(**n) for n in notifications],
        f"Retrieved {len(notifications)} unread notifications"
    )
>>>>>>> edad0dcb7e287f8a594e1b1c4fb576de75e28fee


@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_as_read(
    notification_id: str
):
    """Mark notification as read"""
    success = NotificationService.mark_as_read(notification_id)

    if not success:
        raise HTTPException(status_code=400, detail="Failed to mark notification as read")

    notification = NotificationService.get_notification_by_id(notification_id)
<<<<<<< HEAD
    Helper.prepare_response_data(notification)
    return NotificationResponse(**notification)
=======
    return NotificationResponse(**Helper.convert_mongo_doc(notification))


@router.post("/mark-all-read")
async def mark_all_as_read():
    """Mark all notifications as read"""
    count = NotificationService.mark_all_as_read(None)
    
    return success_response({"count": count}, f"Marked {count} notifications as read")
>>>>>>> edad0dcb7e287f8a594e1b1c4fb576de75e28fee


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str
):
    """Delete notification"""
    success = NotificationService.delete_notification(notification_id)

    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete notification")

    return success_response(None, "Notification deleted successfully")


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


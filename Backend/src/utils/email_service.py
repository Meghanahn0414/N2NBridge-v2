# Email Service for sending OTP
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from config.settings import settings


def send_otp_via_email(email: str, otp: str) -> bool:
    """
    Send OTP via Email

    Args:
        email: Email address to send OTP to
        otp: 4-digit OTP code

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        sender_email = (
            getattr(settings, "SENDER_EMAIL", None)
            or getattr(settings, "SMTP_USERNAME", None)
            or os.getenv("SENDER_EMAIL")
            or os.getenv("SMTP_EMAIL")
            or os.getenv("SMTP_USERNAME")
            or ""
        ).strip()
        sender_password = (
            getattr(settings, "SMTP_PASSWORD", None)
            or os.getenv("SMTP_PASSWORD")
            or ""
        ).strip().replace(" ", "")
        smtp_server = (
            getattr(settings, "SMTP_SERVER", None)
            or os.getenv("SMTP_SERVER")
            or "smtp.gmail.com"
        ).strip()
        smtp_port = int(getattr(settings, "SMTP_PORT", None) or os.getenv("SMTP_PORT", "587"))

        if not sender_email or not sender_password:
            print("❌ SMTP credentials are not configured")
            return False

        # Create message
        message = MIMEMultipart()
        message["From"] = sender_email
        message["To"] = email
        message["Subject"] = "Your CRM Login OTP"

        body = f"""
Hello,

Your OTP for CRM login is: {otp}

This OTP is valid for 5 minutes only.

If you didn't request this, please ignore this email.

Best regards,
CRM Team
        """

        message.attach(MIMEText(body, "plain"))

        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(message)

        print(f"✅ OTP sent to email: {email}")
        return True

    except Exception as e:
        print(f"❌ Error sending OTP email: {str(e)}")
        return False

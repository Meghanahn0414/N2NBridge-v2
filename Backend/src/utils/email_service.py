# Email Service for sending OTP
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from config.settings import settings


def send_email(email: str, subject: str, body: str) -> bool:
    """
    Send a plain text email.

    Args:
        email: Email address to send to
        subject: Email subject line
        body: Plain text email body

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

        message = MIMEMultipart()
        message["From"] = f"N2N Team <{sender_email}>"
        message["To"] = email
        message["Reply-To"] = sender_email
        message["Subject"] = subject

        message.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(message)

        print(f"✅ Email sent to: {email}")
        return True

    except Exception as e:
        print(f"❌ Error sending email to {email}: {str(e)}")
        return False


ROLE_DISPLAY_NAMES = {
    "MLA": "MLA (Member of Legislative Assembly)",
    "MP": "MP (Member of Parliament)",
    "COUNCILLOR": "Councillor",
    "ADMIN": "Admin",
    "FIELD_OFFICER": "Field Officer",
    "CONSTITUENCY_MANAGER": "Constituency Manager",
    "STAFF": "Staff",
}


def send_welcome_email(email: str, name: str, role: str, password: str = None) -> bool:
    """
    Sent once, right after a new account is created, for every registration
    path: representative self-registration (MLA/MP/Councillor), admin self-
    registration, and Field Officer / Constituency Manager accounts created
    on someone's behalf by a Rep or Admin.

    `password` is only included for the two roles that don't set their own
    password (Field Officer / Constituency Manager, created by someone
    else) — MLA/MP/Councillor/Admin registrants typed their own password
    during signup and already know it, so it's left out for them.
    """
    role_label = ROLE_DISPLAY_NAMES.get((role or "").upper(), role or "User")
    subject = f"Welcome to N2N — Your {role_label} account is ready"

    credentials_block = f"""
Your login details:
  Role:     {role_label}
  Email:    {email}
"""
    if password:
        credentials_block += f"  Password: {password}\n\nFor security, please log in and change your password as soon as possible.\n"

    body = f"""
Hello {name or ''},

Your {role_label} account has been created on N2N.
{credentials_block}
If you didn't expect this email or believe it was sent in error, please contact your administrator.

Best regards,
N2N Team
    """
    return send_email(email, subject, body)


def send_otp_via_email(email: str, otp: str) -> bool:
    """
    Send OTP via Email

    Args:
        email: Email address to send OTP to
        otp: 4-digit OTP code

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    subject = "Your N2N Login OTP"
    body = f"""
Hello,

Your OTP for N2N login is: {otp}

This OTP is valid for 5 minutes only.

If you didn't request this, please ignore this email.

Best regards,
N2N Team
    """
    return send_email(email, subject, body)

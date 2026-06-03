# Authentication Service
from src.config.database import get_database
from src.config.security import verify_password, create_access_token
from datetime import timedelta, datetime
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

def generate_otp():
    """Generate a 4-digit OTP"""
    return str(random.randint(1000, 9999))

def store_otp(contact: str, otp: str, contact_type: str):
    """Store OTP in database with expiration"""
    db = get_database()
    otp_data = {
        "contact": contact,
        "contact_type": contact_type,
        "otp": otp,
        "createdAt": datetime.utcnow(),
        "expiresAt": datetime.utcnow() + timedelta(minutes=5)  # OTP expires in 5 minutes
    }
    db.otp_verification.update_one(
        {"contact": contact, "contact_type": contact_type},
        {"$set": otp_data},
        upsert=True
    )

def verify_otp(contact: str, otp: str, contact_type: str):
    """Verify OTP from database"""
    db = get_database()
    otp_record = db.otp_verification.find_one({
        "contact": contact,
        "contact_type": contact_type,
        "otp": otp,
        "expiresAt": {"$gt": datetime.utcnow()}
    })
    
    if otp_record:
        # Mark OTP as verified
        db.otp_verification.delete_one({"_id": otp_record["_id"]})
        return True
    return False

def send_otp_email(email: str, otp: str):
    """Send OTP via email"""
    try:
        sender_email = os.getenv("SMTP_EMAIL", "your_email@gmail.com")
        sender_password = os.getenv("SMTP_PASSWORD", "your_app_password")
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        
        message = MIMEMultipart()
        message["From"] = sender_email
        message["To"] = email
        message["Subject"] = "Your OTP for CRM Login"
        
        body = f"""
        Hello,
        
        Your OTP for login is: {otp}
        
        This OTP is valid for 5 minutes only.
        
        If you didn't request this, please ignore this email.
        
        Best regards,
        CRM Team
        """
        
        message.attach(MIMEText(body, "plain"))
        
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(message)
        
        print(f"✅ OTP sent to email: {email}")
        return True
    except Exception as e:
        print(f"❌ Error sending OTP email: {str(e)}")
        return False

def send_otp_sms(phone: str, otp: str):
    """Send OTP via SMS (placeholder - integrate with actual SMS service)"""
    try:
        # This is a placeholder - integrate with Twilio or another SMS service
        print(f"✅ OTP sent to phone: {phone} - OTP: {otp}")
        return True
    except Exception as e:
        print(f"❌ Error sending OTP SMS: {str(e)}")
        return False

def get_voter_by_email(email: str):
    """Get voter by email"""
    db = get_database()
    return db.voters.find_one({"email": email})

def get_voter_by_phone(phone: str):
    """Get voter by phone number"""
    db = get_database()
    return db.voters.find_one({"mobile": int(phone)})

def authenticate_voter(email: str, password: str):
    """Authenticate voter by email and password"""
    db = get_database()
    voter = db.voters.find_one({"email": email})
    
    if not voter:
        return None
    
    if not verify_password(password, voter.get("passwordHash", "")):
        return None
    
    return voter

def create_voter_token(voter_id: str, full_name: str):
    """Create access token for voter"""
    access_token_expires = timedelta(minutes=30)
    token = create_access_token(
        data={"sub": voter_id, "fullName": full_name},
        expires_delta=access_token_expires
    )
    return token

def authenticate_user(email: str, password: str):
    """Legacy function - redirects to authenticate_voter"""
    return authenticate_voter(email, password)

def create_user_token(user_id: str, full_name: str):
    """Legacy function - redirects to create_voter_token"""
    return create_voter_token(user_id, full_name)


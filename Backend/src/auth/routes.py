"""
Authentication Routes
"""
from fastapi import APIRouter, Header, HTTPException, status, Request
from typing import Optional
from auth.service import AuthService
from auth.otp_service import OTPService
from users.model import UserLoginRequest, TokenResponse, UserCreate,  SendOtpRequest, VerifyOtpRequest, OtpResponse
from users.service import UserService
from config.database import MongoDatabase
# from utils.response import success_response
from utils.jwt import TokenManager
import logging

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)


def get_current_user(authorization: Optional[str] = Header(None)):
    """Get current user from token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    token = TokenManager.extract_token_from_header(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    payload = AuthService.verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return payload


@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLoginRequest):
    """User login"""
    result = AuthService.login(login_data)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    return result


@router.post("/login-admin", response_model=TokenResponse)
async def login_admin(request: Request):
    """Admin login using email/password (debug-friendly)"""
    try:
        raw = await request.body()
        logger.debug(f"/login-admin raw body: {raw}")
    except Exception as e:
        logger.error(f"Failed reading raw body: {e}")

    data = None
    try:
        data = await request.json()
    except Exception as e:
        logger.error(f"JSON parse error in /login-admin: {e}")
        # Fallback: try to parse urlencoded form data from raw body
        try:
            raw_text = raw.decode("utf-8") if isinstance(raw, (bytes, bytearray)) else str(raw)
            from urllib.parse import parse_qs
            parsed = parse_qs(raw_text)
            # parse_qs returns lists for each key
            data = {k: v[0] for k, v in parsed.items()}
            logger.debug(f"Parsed urlencoded body for /login-admin: {data}")
        except Exception as e2:
            logger.error(f"Fallback parse error in /login-admin: {e2}")
            raise HTTPException(status_code=422, detail=f"Invalid JSON and fallback parse failed: {e}")

    # Validate required fields
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        raise HTTPException(status_code=422, detail="'email' and 'password' are required")

    # Create a simple object compatible with AuthService.login
    class SimpleLogin:
        def __init__(self, email, password):
            self.email = email
            self.password = password

    login_obj = SimpleLogin(email, password)

    result = AuthService.login(login_obj)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Ensure the user has admin role
    user_role = None
    try:
        user_role = result.user.role if hasattr(result, 'user') and result.user else None
    except Exception:
        user_role = None

    if user_role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized as admin")

    return result


@router.post("/register")
async def register(user_data: UserCreate):
    """Register new user (public endpoint)"""
    try:
        user_id = AuthService.register_user(user_data.dict(), None)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to register user"
            )
        
        # Create token for newly registered user
        token = TokenManager.create_token(user_id, user_data.role)
        
        # Return simple response with token
        return {
            "accessToken": token,
            "user": {
                "id": str(user_id),
                "email": user_data.email,
                "fullName": user_data.fullName,
                "role": user_data.role
            }
        }
    except Exception as e:
        logger.error(f"Registration error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Registration failed")


@router.get("/verify")
async def verify_token():
    """Verify token"""
    user = UserService.get_user_by_id(None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # return success_response({"user_id": None, "role": current_user["role"]})


@router.post("/send-otp")
async def send_otp(request: SendOtpRequest):
    """Send OTP to phone or email"""
    try:
        if request.type not in ["phone", "email"]:
            raise HTTPException(status_code=400, detail="Type must be 'phone' or 'email'")
        
        if not request.value:
            raise HTTPException(status_code=400, detail="Phone number or email required")
        
        # Send OTP
        success = OTPService.send_otp(request.type, request.value)
        
        if success:
            return {
                "success": True,
                "message": f"OTP sent to {request.type}",
                "statusCode": 200
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to send OTP")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Send OTP error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/verify-otp", response_model=OtpResponse)
async def verify_otp(request: VerifyOtpRequest):
    """Verify OTP and return JWT token"""
    try:
        # Verify OTP
        if not OTPService.verify_otp(request.value, request.otp):
            raise HTTPException(status_code=401, detail="Invalid or expired OTP")
        
        # Get or create user
        user = UserService.get_user_by_email(request.value) or UserService.get_user_by_mobile(request.value)
        
        if not user:
            # Auto-create user on first OTP verification (OTP users don't have password)
            db = MongoDatabase.get_db()
            from datetime import datetime
            import uuid
            
            is_email = "@" in request.value
            is_mobile = request.value.isdigit()
            
            # Generate unique mobile/email if not provided
            user_data = {
                "fullName": request.value,
                "mobile": request.value if is_mobile else f"otp-{uuid.uuid4().hex[:8]}",  # Unique ID if email login
                "email": request.value if is_email else f"otp-{uuid.uuid4().hex[:8]}@otp.local",   # Unique email if phone login
                "passwordHash": "",  # OTP login users have no password
                "role": "CITIZEN",  # Default role
                "status": "ACTIVE",
                "isDeleted": False,
                "lastLoginAt": None,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
                "createdBy": "system",
                "updatedBy": "system"
            }
            result = db.users.insert_one(user_data)
            user = db.users.find_one({"_id": result.inserted_id})
            logger.info(f"OTP user auto-created: {result.inserted_id}")
        
        # Create JWT token
        token = TokenManager.create_token(str(user["_id"]), user["role"])
        
        logger.info(f"OTP verified and user logged in: {user['_id']}")
        
        return OtpResponse(
            success=True,
            message="OTP verified successfully",
            token=token,
            role=user["role"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OTP verification error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="OTP verification failed")


@router.get("/debug/otp-storage")
async def debug_otp_storage():
    """DEBUG ENDPOINT - Returns current OTP storage (remove in production)"""
    from auth.otp_service import OTP_STORAGE
    return {
        "otp_storage": {
            key: {
                "otp": data["otp"],
                "attempts": data["attempts"],
                "type": data["type"],
                # Don't expose timestamp for security
            }
            for key, data in OTP_STORAGE.items()
        }
    }


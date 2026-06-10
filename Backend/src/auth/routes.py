"""
Authentication Routes
"""
import logging
from typing import Optional

from auth.otp_service import OTP_STORAGE, OTPService
from auth.service import AuthService
from config.database import MongoDatabase
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from users.model import (OtpResponse, SendOtpRequest, TokenResponse,
                         UserCreate, UserLoginRequest, UserResponse,
                         VerifyOtpRequest)
from users.service import UserService
from utils.jwt import TokenManager
from utils.response import ResponseMessage, error_response, success_response

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)


def get_current_user(authorization: Optional[str] = Header(None, alias="Authorization")):
    """Get current user from token"""
    logger.info(f"[AUTH] Authorization header present: {bool(authorization)}")
    
    if not authorization:
        logger.error("[AUTH] Missing authorization header - 401 response")
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    token = TokenManager.extract_token_from_header(authorization)
    logger.info(f"[AUTH] Token extracted: {bool(token)}, length: {len(token) if token else 0}")
    
    if not token:
        logger.error("[AUTH] Invalid authorization header format - 401 response")
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    payload = AuthService.verify_token(token)
    logger.info(f"[AUTH] Token verified, payload present: {bool(payload)}")
    
    if not payload:
        logger.error("[AUTH] Invalid or expired token - 401 response")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    logger.info(f"[AUTH] ✅ User authenticated: user_id={payload.get('user_id')}, role={payload.get('role')}")
    return payload


def get_current_user_optional(authorization: Optional[str] = Header(None, alias="Authorization")):
    """Get current user from token (optional - returns None if not authenticated)"""
    logger.info(f"[AUTH_OPT] Authorization header present: {bool(authorization)}")
    
    if not authorization:
        logger.info("[AUTH_OPT] No authorization header - proceeding without auth")
        return None
    
    token = TokenManager.extract_token_from_header(authorization)
    logger.info(f"[AUTH_OPT] Token extracted: {bool(token)}")
    
    if not token:
        logger.info("[AUTH_OPT] Invalid authorization header format - proceeding without auth")
        return None
    
    payload = AuthService.verify_token(token)
    logger.info(f"[AUTH_OPT] Token verified: {bool(payload)}")
    
    if not payload:
        logger.info("[AUTH_OPT] Invalid or expired token - proceeding without auth")
        return None
    
    logger.info(f"[AUTH_OPT] ✅ User authenticated: user_id={payload.get('user_id')}, role={payload.get('role')}")
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
    """Admin/Staff login using email/password (ADMIN, REPRESENTATIVE, CONSTITUENCY_MANAGER, FIELD_OFFICER)"""
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

    # Ensure the user has an allowed role (not a citizen)
    user_role = None
    try:
        user_role = result.user.role if hasattr(result, 'user') and result.user else None
    except Exception:
        user_role = None

    # Allow staff roles (admin, representative/MLA, manager, field officer) but not citizens
    # Note: Support both "MANAGER" (legacy) and "CONSTITUENCY_MANAGER" (new standard)
    allowed_roles = ["ADMIN", "REPRESENTATIVE", "CONSTITUENCY_MANAGER", "FIELD_OFFICER", "MANAGER"]
    if user_role not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized. Citizens must use citizen login.")

    return result


@router.post("/register")
async def register(user_data: UserCreate):
    """Register new user (public endpoint)"""
    try:
        logger.info(f"[REGISTER] Received registration request: {user_data.fullName}, {user_data.email}, mobile: {user_data.mobile}, role={user_data.role}")
        user_id = AuthService.register_user(user_data.dict(), None)
        if not user_id:
            logger.error("[REGISTER] register_user returned None - likely email or mobile already exists")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to register user - Email or mobile number may already be registered"
            )
        
        logger.info(f"[REGISTER] User registered successfully: {user_id}")
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
    except HTTPException as he:
        logger.error(f"[REGISTER] HTTP Exception: {he.detail}")
        raise
    except Exception as e:
        logger.error(f"[REGISTER] Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Registration failed")


@router.get("/verify")
async def verify_token(current_user: dict = Depends(get_current_user)):
    """Verify token"""
    user = UserService.get_user_by_id(current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return success_response({"user_id": current_user["user_id"], "role": current_user["role"]})


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
            # Get the OTP from storage for debugging
            otp_data = OTP_STORAGE.get(request.value, {})
            return {
                "success": True,
                "message": f"OTP sent to {request.type}",
                "statusCode": 200,
                "debug_otp": otp_data.get("otp", "")  # Development only - remove in production
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
            import uuid
            from datetime import datetime
            
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
            try:
                result = db.users.insert_one(user_data)
                user = db.users.find_one({"_id": result.inserted_id})
                logger.info(f"OTP user auto-created: {result.inserted_id}")
            except Exception as e:
                # If duplicate key error, try to find existing user by mobile/email
                logger.warning(f"Insert failed (likely duplicate): {e}. Trying to fetch existing user...")
                user = UserService.get_user_by_mobile(request.value) if is_mobile else UserService.get_user_by_email(request.value)
                if not user:
                    # If still no user found, re-raise the error
                    raise HTTPException(status_code=500, detail="Failed to create or find user")
        
        # Create JWT token
        token = TokenManager.create_token(str(user["_id"]), user["role"])
        
        logger.info(f"OTP verified and user logged in: {user['_id']}")
        
        # Normalize user payload for response
        user_payload = { **user, "_id": str(user["_id"]) }
        return OtpResponse(
            success=True,
            message="OTP verified successfully",
            token=token,
            role=user["role"],
            user=UserResponse(**user_payload)
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

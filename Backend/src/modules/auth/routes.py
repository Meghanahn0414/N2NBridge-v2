# Authentication Routes
from fastapi import APIRouter, HTTPException, status
from src.modules.auth.model import (
    LoginRequest, TokenResponse, OTPRequest, OTPResponse, 
    OTPVerifyRequest, PasswordLoginRequest
)
from src.modules.auth.service import (
    authenticate_voter, create_voter_token, generate_otp, 
    store_otp, verify_otp, send_otp_email, send_otp_sms,
    get_voter_by_email, get_voter_by_phone
)
from src.modules.roles.service import get_all_roles

router = APIRouter()

# ============== OTP-BASED LOGIN FLOW ==============

@router.post("/request-otp", response_model=OTPResponse)
def request_otp(request: OTPRequest):
    """Request OTP for login via email or phone"""
    try:
        contact = request.contact
        contact_type = request.contact_type
        
        # Check if voter exists
        if contact_type == "email":
            voter = get_voter_by_email(contact)
            if not voter:
                raise HTTPException(status_code=404, detail="❌ Email not registered")
        else:  # phone
            voter = get_voter_by_phone(contact)
            if not voter:
                raise HTTPException(status_code=404, detail="❌ Phone number not registered")
        
        # Generate OTP
        otp = generate_otp()
        store_otp(contact, otp, contact_type)
        
        # Send OTP
        if contact_type == "email":
            success = send_otp_email(contact, otp)
            if not success:
                raise HTTPException(status_code=500, detail="❌ Failed to send OTP email")
        else:  # phone
            success = send_otp_sms(contact, otp)
            if not success:
                raise HTTPException(status_code=500, detail="❌ Failed to send OTP SMS")
        
        return {
            "success": True,
            "message": f"✅ OTP sent to your {contact_type}",
            "contact": contact,
            "contact_type": contact_type
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"❌ Error requesting OTP: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/verify-otp", response_model=OTPResponse)
def verify_otp_endpoint(request: OTPVerifyRequest):
    """Verify OTP"""
    try:
        contact = request.contact
        otp = request.otp
        contact_type = request.contact_type
        
        # Verify OTP
        if verify_otp(contact, otp, contact_type):
            return {
                "success": True,
                "message": "✅ OTP verified successfully",
                "contact": contact,
                "contact_type": contact_type
            }
        else:
            raise HTTPException(status_code=400, detail="❌ Invalid or expired OTP")
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"❌ Error verifying OTP: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/login-with-password", response_model=TokenResponse)
def login_with_password(request: PasswordLoginRequest):
    """Login with password after OTP verification"""
    try:
        contact = request.contact
        password = request.password
        contact_type = request.contact_type
        
        # Get voter
        if contact_type == "email":
            voter = get_voter_by_email(contact)
        else:  # phone
            voter = get_voter_by_phone(contact)
        
        if not voter:
            raise HTTPException(status_code=404, detail="❌ Voter not found")
        
        # Authenticate with password
        if not authenticate_voter(voter["email"], password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="❌ Invalid password"
            )
        
        # Create token
        token = create_voter_token(str(voter["_id"]), voter["fullName"])
        return {
            "access_token": token,
            "token_type": "bearer",
            "success": True,
            "message": "✅ Login successful"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"❌ Error during login: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# ============== LEGACY LOGIN (for backward compatibility) ==============

@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest):
    """User login endpoint (legacy)"""
    voter = authenticate_voter(credentials.email, credentials.password)
    if not voter:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="❌ Invalid email or password"
        )
    
    token = create_voter_token(str(voter["_id"]), voter["fullName"])
    return {"access_token": token, "token_type": "bearer", "success": True}

@router.post("/logout")
def logout():
    """User logout endpoint"""
    return {"message": "✅ Logged out successfully"}

@router.get("/roles/list")
def list_roles():
    """Get all available roles"""
    try:
        roles = get_all_roles()
        return {
            "success": True,
            "message": "✅ Available roles",
            "roles": roles
        }
    except Exception as e:
        print(f"❌ Error fetching roles: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
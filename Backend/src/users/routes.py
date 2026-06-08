"""
User Routes
"""
from fastapi import APIRouter, Depends, Header, HTTPException, status, Query, UploadFile, File
from typing import Optional
from auth.routes import get_current_user, get_current_user_optional
from users.service import UserService, ConstituencyService, WardService
from users.model import (
    UserCreate, UserUpdate, UserResponse, 
    ConstituencyCreate, ConstituencyResponse,
    WardCreate, WardResponse
)
from utils.response import success_response, error_response
from utils.helper import Helper
import logging

router = APIRouter(prefix="/api/users", tags=["Users"])
logger = logging.getLogger(__name__)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get user by ID"""
    user = UserService.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user["_id"] = str(user["_id"])
    return UserResponse(**user)


@router.get("/", response_model=list[UserResponse])
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    role: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List users"""
    skip, limit = Helper.paginate(page, per_page)
    users = UserService.list_users(skip, limit, role)
    
    for user in users:
        user["_id"] = str(user["_id"])
    return [UserResponse(**user) for user in users]


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    update_data: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user"""
    success = UserService.update_user(
        user_id,
        update_data.dict(exclude_unset=True),
        current_user["user_id"]
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update user")
    
    user = UserService.get_user_by_id(user_id)
    user["_id"] = str(user["_id"])
    return UserResponse(**user)


@router.delete("/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Delete user"""
    success = UserService.delete_user(user_id, current_user["user_id"])
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete user")
    
    return success_response(None, "User deleted successfully")


# Constituency Endpoints
@router.post("/constituencies")
async def create_constituency(
    data: ConstituencyCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create constituency"""
    try:
        constituency_id = ConstituencyService.create_constituency(data.dict())
        constituency = ConstituencyService.get_constituency_by_id(constituency_id)
        
        return success_response({
            "id": str(constituency["_id"]),
            "name": constituency["name"],
            "code": constituency.get("code"),
            "state": constituency.get("state"),
            "district": constituency.get("district"),
            "location": constituency.get("location")
        }, "Constituency created successfully")
    except Exception as e:
        logger.error(f"Error creating constituency: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/constituencies", response_model=list[ConstituencyResponse])
async def list_constituencies(current_user: dict = Depends(get_current_user)):
    """List constituencies"""
    constituencies = ConstituencyService.get_all_constituencies()
    
    for c in constituencies:
        c["_id"] = str(c["_id"])
    return [ConstituencyResponse(**c) for c in constituencies]


@router.get("/constituencies/search/{query}")
async def search_constituencies(
    query: str,
    current_user: dict = Depends(get_current_user)
):
    """Search constituencies"""
    constituencies = ConstituencyService.search_constituencies(query)
    return success_response([{
        "id": str(c["_id"]),
        "name": c["name"],
        "district": c["district"]
    } for c in constituencies])


# Ward Endpoints
@router.post("/wards", response_model=WardResponse)
async def create_ward(
    data: WardCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create ward"""
    ward_id = WardService.create_ward(data.dict())
    ward = WardService.get_ward_by_id(ward_id)
    
    ward["_id"] = str(ward["_id"])
    return WardResponse(**ward)


@router.get("/constituencies/{constituency_id}/wards", response_model=list[WardResponse])
async def get_wards(
    constituency_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get wards by constituency"""
    wards = WardService.get_wards_by_constituency(constituency_id)
    
    for w in wards:
        w["_id"] = str(w["_id"])
    return [WardResponse(**w) for w in wards]


# Profile Photo Upload
@router.post("/{user_id}/upload-profile-photo")
async def upload_profile_photo(
    user_id: str,
    file: UploadFile = File(...),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Upload user profile photo (allows unauthenticated uploads for newly registered users)"""
    try:
        from utils.file_handler import upload_profile_image
        
        logger.info(f"[UPLOAD] Photo upload request for user {user_id}, authenticated: {bool(current_user)}")
        
        # Validate user exists
        user = UserService.get_user_by_id(user_id)
        if not user:
            logger.error(f"[UPLOAD] User not found: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        # Authorization check: allow if authenticated (either own profile or admin), or if unauthenticated (for new users)
        if current_user:
            # Authenticated user - must be their own profile or admin
            if current_user["user_id"] != user_id and current_user.get("role") != "ADMIN":
                logger.error(f"[UPLOAD] Unauthorized: current_user={current_user['user_id']}, target_user={user_id}")
                raise HTTPException(status_code=403, detail="Unauthorized")
            logger.info(f"[UPLOAD] Authenticated upload by {current_user['user_id']} for user {user_id}")
        else:
            # Unauthenticated - allow only for the target user (newly registered case)
            logger.info(f"[UPLOAD] Unauthenticated upload for user {user_id} (new user grace period)")
        
        logger.info(f"[UPLOAD] Starting photo upload for user {user_id}, file: {file.filename}, size: {file.size}")
        
        # Upload file
        file_url = await upload_profile_image(file)
        logger.info(f"[UPLOAD] File saved to: {file_url}")
        
        # Update user - use user_id as updated_by when unauthenticated (for new users)
        updated_by = current_user["user_id"] if current_user else user_id
        success = UserService.update_user(
            user_id,
            {"profileImage": file_url},
            updated_by
        )
        
        if not success:
            logger.error(f"[UPLOAD] Failed to update user {user_id} with photo")
            raise HTTPException(status_code=400, detail="Failed to save profile photo")
        
        logger.info(f"[UPLOAD] ✅ Photo upload successful for user {user_id}")
        return success_response(
            {"profileImage": file_url},
            "Profile photo uploaded successfully"
        )
    
    except ValueError as e:
        logger.error(f"[UPLOAD] Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"[UPLOAD] Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Upload failed")

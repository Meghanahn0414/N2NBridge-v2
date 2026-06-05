"""
User Routes
"""
from fastapi import APIRouter,  HTTPException,  Query, UploadFile, File
from typing import Optional
from users.service import UserService, ConstituencyService, WardService
from users.model import (
    UserCreate, UserUpdate, UserResponse, 
    ConstituencyCreate, ConstituencyResponse,
    WardCreate, WardResponse
)
from utils.response import success_response
from utils.helper import Helper
import logging

router = APIRouter(prefix="/api/users", tags=["Users"])
logger = logging.getLogger(__name__)


# USER ENDPOINTS - Create
@router.post("/", response_model=UserResponse)
async def create_user(user_data: UserCreate):
    """Create a new user"""
    try:
        user_id = UserService.create_user(user_data.dict(), None)
        if not user_id:
            raise HTTPException(status_code=400, detail="Failed to create user")
        
        user = UserService.get_user_by_id(user_id)
        return UserResponse(**Helper.convert_mongo_doc(user))
    except Exception as e:
        logger.error(f"Error creating user: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))


# USER ENDPOINTS - List
@router.get("/", response_model=list[UserResponse])
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    role: Optional[str] = None
):
    """List users"""
    skip, limit = Helper.paginate(page, per_page)
    users = UserService.list_users(skip, limit, role)
    
    return [UserResponse(**Helper.convert_mongo_doc(u)) for u in users]


# CONSTITUENCY ENDPOINTS - Must come before /{user_id}
@router.post("/constituencies")
async def create_constituency(
    data: ConstituencyCreate
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
async def list_constituencies():
    """List constituencies"""
    constituencies = ConstituencyService.get_all_constituencies()
    
    return [ConstituencyResponse(**Helper.convert_mongo_doc(c)) for c in constituencies]


@router.get("/constituencies/search/{query}")
async def search_constituencies(
    query: str
):
    """Search constituencies"""
    constituencies = ConstituencyService.search_constituencies(query)
    return success_response([{
        "id": str(c["_id"]),
        "name": c["name"],
        "district": c["district"]
    } for c in constituencies])


# WARD ENDPOINTS - Must come before /{user_id}
@router.post("/wards", response_model=WardResponse)
async def create_ward(
    data: WardCreate
):
    """Create ward"""
    ward_id = WardService.create_ward(data.dict())
    ward = WardService.get_ward_by_id(ward_id)
    
    return WardResponse(**Helper.convert_mongo_doc(ward))


@router.get("/constituencies/{constituency_id}/wards", response_model=list[WardResponse])
async def get_wards(
    constituency_id: str
):
    """Get wards by constituency"""
    wards = WardService.get_wards_by_constituency(constituency_id)
    
    return [WardResponse(**Helper.convert_mongo_doc(w)) for w in wards]


# PROFILE PHOTO UPLOAD - Must come before /{user_id}
@router.post("/{user_id}/upload-profile-photo")
async def upload_profile_photo(
    user_id: str,
    file: UploadFile = File(...)
):
    """Upload user profile photo"""
    try:
        from utils.file_handler import upload_profile_image
        
        # Validate user exists
        user = UserService.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Upload file
        file_url = await upload_profile_image(file)
        
        # Update user
        success = UserService.update_user(
            user_id,
            {"profileImage": file_url},
            None
        )
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to save profile photo")
        
        return success_response(
            {"profileImage": file_url},
            "Profile photo uploaded successfully"
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Upload failed")


# USER ID-BASED ENDPOINTS - Must come last!
@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """Get user by ID"""
    user = UserService.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(**Helper.convert_mongo_doc(user))


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    update_data: UserUpdate
):
    """Update user"""
    success = UserService.update_user(
        user_id,
        update_data.dict(exclude_unset=True),
        None
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update user")
    
    user = UserService.get_user_by_id(user_id)
    return UserResponse(**Helper.convert_mongo_doc(user))


@router.delete("/{user_id}")
async def delete_user(user_id: str):
    """Delete user"""
    success = UserService.delete_user(user_id, None)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete user")
    
    return success_response(None, "User deleted successfully")

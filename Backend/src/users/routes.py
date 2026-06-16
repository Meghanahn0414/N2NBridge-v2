"""
User Routes
"""
import logging
from typing import Optional

from pymongo.errors import DuplicateKeyError
from auth.service import AuthService
from config.security import SecurityManager
from bson import ObjectId
from config.database import MongoDatabase
from fastapi import (APIRouter, Depends, File, Header, HTTPException, Query,
                     UploadFile)
from users.model import (ConstituencyCreate, ConstituencyResponse, ConstituencyUpdate,
                         UserCreate, UserResponse, UserUpdate, WardCreate, WardResponse)
from users.service import ConstituencyService, UserService, WardService
from utils.helper import Helper
from utils.id_generator import IDGenerator
from utils.jwt import TokenManager
from utils.response import success_response

router = APIRouter(prefix="/api/users", tags=["Users"])
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


def get_current_user(authorization: Optional[str] = Header(None, alias="Authorization")):
    """Get current user from token (required)"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    token = TokenManager.extract_token_from_header(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    payload = AuthService.verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return payload


# USER ENDPOINTS - Create
@router.post("/", response_model=UserResponse)
async def create_user(user_data: UserCreate):
    """Create a new user"""
    try:
        user_id = UserService.create_user(user_data.model_dump(), None)
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
    per_page: int = Query(10, ge=1, le=1000),
    role: Optional[str] = None,
):
    """List users"""
    skip, limit = Helper.paginate(page, per_page)
    users = UserService.list_users(skip, limit, role)

    result = []
    for u in users:
        try:
            result.append(UserResponse(**Helper.convert_mongo_doc(u)))
        except Exception as e:
            logger.warning(f"Skipping malformed user document {u.get('_id')}: {e}")
    return result


# /me must be declared before /{user_id} so FastAPI doesn't swallow it
@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get the profile of the currently authenticated user"""
    user = UserService.get_user_by_id(current_user["user_id"])

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(**Helper.convert_mongo_doc(user))


# CONSTITUENCY ENDPOINTS - Must come before /{user_id}
@router.post("/constituencies")
async def create_constituency(
    data: ConstituencyCreate
):
    """Create constituency"""
    try:
        constituency_id = ConstituencyService.create_constituency(data.model_dump())
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
    db = MongoDatabase.get_db()
    result = []
    for c in constituencies:
        doc = Helper.convert_mongo_doc(c)
        doc["wardCount"] = db.wards.count_documents({"constituencyId": doc["_id"]})
        result.append(ConstituencyResponse(**doc))
    return result


@router.put("/constituencies/{constituency_id}", response_model=ConstituencyResponse)
async def update_constituency(constituency_id: str, data: ConstituencyUpdate):
    """Update constituency"""
    update_data = data.model_dump(exclude_unset=True)
    success = ConstituencyService.update_constituency(constituency_id, update_data)
    if not success:
        raise HTTPException(status_code=404, detail="Constituency not found")
    constituency = ConstituencyService.get_constituency_by_id(constituency_id)
    return ConstituencyResponse(**Helper.convert_mongo_doc(constituency))


@router.delete("/constituencies/{constituency_id}")
async def delete_constituency(constituency_id: str):
    """Delete constituency"""
    success = ConstituencyService.delete_constituency(constituency_id)
    if not success:
        raise HTTPException(status_code=404, detail="Constituency not found")
    return success_response(None, "Constituency deleted successfully")


@router.get("/wards", response_model=list[WardResponse])
async def list_all_wards():
    """List all wards"""
    wards = WardService.get_all_wards()
    result = []
    for w in wards:
        try:
            result.append(WardResponse(**Helper.convert_mongo_doc(w)))
        except Exception as e:
            logger.warning(f"Skipping malformed ward {w.get('_id')}: {e}")
    return result


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
    ward_id = WardService.create_ward(data.model_dump())
    ward = WardService.get_ward_by_id(ward_id)
    
    return WardResponse(**Helper.convert_mongo_doc(ward))


@router.get("/constituencies/{constituency_id}/wards", response_model=list[WardResponse])
async def get_wards(constituency_id: str):
    """Get wards by constituency"""
    wards = WardService.get_wards_by_constituency(constituency_id)
    result = []
    for w in wards:
        try:
            result.append(WardResponse(**Helper.convert_mongo_doc(w)))
        except Exception as e:
            logger.warning(f"Skipping malformed ward {w.get('_id')}: {e}")
    return result


# PROFILE PHOTO UPLOAD - Must come before /{user_id}
@router.post("/{user_id}/upload-profile-photo")
async def upload_profile_photo(
    user_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user_optional)
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
        
        # Upload file
        file_url = await upload_profile_image(file)
        logger.info(f"[UPLOAD] File saved to: {file_url}")
        
        # Update user - use user_id as updated_by when unauthenticated (for new users)
        updated_by = current_user["user_id"] if current_user else user_id
        success = UserService.update_user(
            user_id,
            {"profileImage": file_url},
            None
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


# USER ID-BASED ENDPOINTS - Must come last!
@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """Get user by ID"""
    user = UserService.get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Auto-generate citizenId for existing CITIZEN users who don't have one yet
    if user.get("role") == "CITIZEN" and not user.get("citizenId"):
        try:
            new_citizen_id = IDGenerator.generate_citizen_id()
            db = MongoDatabase.get_db()
            db.users.update_one(
                {"_id": ObjectId(user_id), "isDeleted": False},
                {"$set": {"citizenId": new_citizen_id}}
            )
            user = dict(user)
            user["citizenId"] = new_citizen_id
            logger.info(f"Auto-generated citizenId {new_citizen_id} for user {user_id}")
        except Exception as e:
            logger.warning(f"Could not auto-generate citizenId for {user_id}: {e}")

    return UserResponse(**Helper.convert_mongo_doc(user))


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    update_data: UserUpdate
):
    """Update user"""
    try:
        success = UserService.update_user(
            user_id,
            update_data.model_dump(exclude_unset=True),
            None
        )
    except DuplicateKeyError as e:
        field = "email" if "email" in str(e) else "mobile" if "mobile" in str(e) else "field"
        raise HTTPException(status_code=422, detail=f"A user with that {field} already exists")

    if not success:
        raise HTTPException(status_code=400, detail="Failed to update user")
    
    user = UserService.get_user_by_id(user_id)
    return UserResponse(**Helper.convert_mongo_doc(user))


@router.post("/{user_id}/reset-password")
async def reset_user_password(user_id: str):
    """Reset user password to a temporary one"""
    import random, string
    temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
    db = MongoDatabase.get_db()
    hashed = SecurityManager.hash_password(temp_password)
    result = db.users.update_one(
        {"_id": ObjectId(user_id), "isDeleted": False},
        {"$set": {"passwordHash": hashed}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return success_response({"tempPassword": temp_password}, "Password reset successfully")


@router.delete("/{user_id}")
async def delete_user(user_id: str):
    """Delete user"""
    success = UserService.delete_user(user_id, None)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete user")
    
    return success_response(None, "User deleted successfully")

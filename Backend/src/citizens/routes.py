"""
Citizen Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from citizens.service import CitizenService
from citizens.model import CitizenProfileUpdate, CitizenProfileResponse
from auth.routes import get_current_user
from users.service import UserService
from utils.response import success_response
import logging

router = APIRouter(prefix="/api/citizen", tags=["Citizen"])
logger = logging.getLogger(__name__)


@router.get("/profile", response_model=CitizenProfileResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get citizen profile"""
    try:
        user_id = current_user.get("user_id")
        profile = CitizenService.get_citizen_profile(user_id)
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Citizen profile not found"
            )
        
        # Convert ObjectId to string
        profile["_id"] = str(profile["_id"])
        return profile
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching citizen profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch profile")


@router.put("/profile", response_model=dict)
async def update_profile(
    update_data: CitizenProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update citizen profile"""
    try:
        user_id = current_user.get("user_id")
        
        # Verify user is a citizen
        user = UserService.get_user_by_id(user_id)
        if not user or user.get("role") != "CITIZEN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only citizens can update citizen profiles"
            )
        
        # Update profile
        success = CitizenService.update_citizen_profile(user_id, update_data.dict(exclude_unset=True))
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update profile"
            )
        
        # Return updated profile
        profile = CitizenService.get_citizen_profile(user_id)
        profile["_id"] = str(profile["_id"])
        
        return success_response({
            "message": "Profile updated successfully",
            "profile": profile
        }).model_dump()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating citizen profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

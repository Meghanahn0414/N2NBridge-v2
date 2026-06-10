"""
Complaint Routes
"""
import logging
from typing import Optional

from auth.service import AuthService
from complaints.model import (ComplaintCreate, ComplaintResponse,
                              ComplaintUpdate)
from complaints.service import ComplaintService
from config.database import MongoDatabase
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from utils.helper import Helper
from utils.response import success_response

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])
logger = logging.getLogger(__name__)


def get_current_user(authorization: Optional[str] = Header(None, alias="Authorization")):
    """Get current user from token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    token = authorization.replace("Bearer ", "")
    payload = AuthService.verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return payload


@router.post("/create", response_model=dict)
async def create_complaint(
    complaint_data: ComplaintCreate,
    token_data: dict = Depends(get_current_user)
):
    """Create a new complaint"""
    try:
        # Ensure citizen ID matches token
        if complaint_data.citizenId != token_data.get("citizenId"):
            raise HTTPException(status_code=403, detail="Unauthorized citizen")
        
        # Create complaint
        complaint_id = ComplaintService.create_complaint(complaint_data.dict())
        
        # Fetch the created complaint
        complaint = ComplaintService.get_complaint_by_id(complaint_id)
        
        if not complaint:
            raise HTTPException(status_code=500, detail="Failed to create complaint")
        
        complaint = Helper.convert_mongo_doc(complaint)
        
        return success_response(
            data={
                "complaintId": complaint.get("complaintId"),
                "_id": complaint.get("_id"),
                "message": "Complaint filed successfully"
            },
            message="Complaint created successfully",
            statusCode=201
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error creating complaint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{complaint_id}", response_model=dict)
async def get_complaint(
    complaint_id: str,
    token_data: dict = Depends(get_current_user)
):
    """Get complaint details"""
    try:
        complaint = ComplaintService.get_complaint_by_complaint_id(complaint_id)
        
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        # Check authorization
        if complaint.get("citizenId") != token_data.get("citizenId") and token_data.get("role") not in ["ADMIN", "FIELD_OFFICER"]:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        complaint = Helper.convert_mongo_doc(complaint)
        
        return success_response(
            data=complaint,
            message="Complaint retrieved successfully"
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching complaint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=dict)
async def list_complaints(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    token_data: dict = Depends(get_current_user)
):
    """List complaints"""
    try:
        skip, limit = Helper.paginate(page, per_page)
        
        # Citizen can only see their own complaints
        if token_data.get("role") == "CITIZEN":
            complaints = ComplaintService.get_citizen_complaints(
                token_data.get("citizenId"),
                skip=skip,
                limit=limit
            )
        else:
            # Officers/Admins can see all complaints in their ward
            # For now, return all complaints (can be enhanced with ward filtering)
            complaints = list(
                MongoDatabase.get_db()[ComplaintService.COLLECTION]
                .find({})
                .sort("createdAt", -1)
                .skip(skip)
                .limit(limit)
            )
        
        complaints = [Helper.convert_mongo_doc(c) for c in complaints]
        
        return success_response(
            data={
                "complaints": complaints,
                "page": page,
                "per_page": per_page,
                "total": len(complaints)
            },
            message="Complaints retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Error listing complaints: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ward/{ward}", response_model=dict)
async def get_ward_complaints(
    ward: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    token_data: dict = Depends(get_current_user)
):
    """Get complaints for a ward (for field officers)"""
    try:
        # Only field officers and admins can access ward complaints
        if token_data.get("role") not in ["FIELD_OFFICER", "ADMIN"]:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        skip, limit = Helper.paginate(page, per_page)
        complaints = ComplaintService.get_ward_complaints(ward, skip=skip, limit=limit)
        complaints = [Helper.convert_mongo_doc(c) for c in complaints]
        
        return success_response(
            data={
                "complaints": complaints,
                "ward": ward,
                "page": page,
                "per_page": per_page
            },
            message="Ward complaints retrieved successfully"
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching ward complaints: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/summary", response_model=dict)
async def get_complaint_stats(
    token_data: dict = Depends(get_current_user)
):
    """Get complaint statistics"""
    try:
        # Allow all authenticated users to get stats
        stats = ComplaintService.get_complaint_stats()
        
        return success_response(
            data=stats,
            message="Complaint stats retrieved successfully"
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching complaint stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{complaint_id}", response_model=dict)
async def update_complaint(
    complaint_id: str,
    update_data: ComplaintUpdate,
    token_data: dict = Depends(get_current_user)
):
    """Update complaint (for officers/admins)"""
    try:
        # Only officers and admins can update
        if token_data.get("role") not in ["FIELD_OFFICER", "ADMIN"]:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        success = ComplaintService.update_complaint(complaint_id, update_data.dict(exclude_unset=True))
        
        if not success:
            raise HTTPException(status_code=404, detail="Complaint not found or update failed")
        
        # Fetch updated complaint
        complaint = ComplaintService.get_complaint_by_complaint_id(complaint_id)
        complaint = Helper.convert_mongo_doc(complaint)
        
        return success_response(
            data=complaint,
            message="Complaint updated successfully"
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error updating complaint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

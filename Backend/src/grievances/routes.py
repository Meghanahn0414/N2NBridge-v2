"""
Grievance Routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from typing import Optional
from auth.routes import get_current_user
from grievances.service import GrievanceService, GrievanceCategoryService
from grievances.model import (
    GrievanceCreate, GrievanceUpdate, GrievanceResponse,
    GrievanceCategoryCreate, GrievanceCategoryResponse,
    GrievanceFeedbackCreate
)
from utils.response import success_response, error_response
from utils.helper import Helper
import logging

router = APIRouter(prefix="/api/grievances", tags=["Grievances"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=GrievanceResponse)
async def create_grievance(
    grievance_data: GrievanceCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create grievance"""
    grievance_id = GrievanceService.create_grievance(
        grievance_data.dict(),
        current_user["user_id"]
    )
    
    grievance = GrievanceService.get_grievance_by_id(grievance_id)
    Helper.prepare_response_data(grievance)
    return GrievanceResponse(**grievance)


@router.get("/", response_model=list[GrievanceResponse])
async def list_grievances(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List grievances"""
    skip, limit = Helper.paginate(page, per_page)
    filters = {}
    
    if status:
        filters["status"] = status
    if priority:
        filters["priority"] = priority
    
    grievances = GrievanceService.list_grievances(skip, limit, filters)
    Helper.prepare_response_list(grievances)
    return [GrievanceResponse(**g) for g in grievances]


# Category Endpoints - Must be before /{grievance_id} routes
@router.post("/categories", response_model=GrievanceCategoryResponse)
async def create_category(
    data: GrievanceCategoryCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create grievance category"""
    category_id = GrievanceCategoryService.create_category(data.dict())
    category = GrievanceCategoryService.get_category_by_id(category_id)
    
    Helper.prepare_response_data(category)
    return GrievanceCategoryResponse(**category)


@router.get("/categories", response_model=list[GrievanceCategoryResponse])
async def list_categories(current_user: dict = Depends(get_current_user)):
    """List grievance categories"""
    categories = GrievanceCategoryService.get_all_categories()
    
    Helper.prepare_response_list(categories)
    return [GrievanceCategoryResponse(**c) for c in categories]


@router.get("/citizen/{citizen_id}", response_model=list[GrievanceResponse])
async def get_citizen_grievances(
    citizen_id: str,
    page: int = Query(1, ge=1),
    current_user: dict = Depends(get_current_user)
):
    """Get grievances by citizen"""
    skip, limit = Helper.paginate(page, 10)
    grievances = GrievanceService.get_grievances_by_citizen(citizen_id, skip, limit)
    
    Helper.prepare_response_list(grievances)
    return [GrievanceResponse(**g) for g in grievances]


# Parameterized routes - Must come after specific routes
@router.get("/{grievance_id}", response_model=GrievanceResponse)
async def get_grievance(
    grievance_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get grievance by ID"""
    grievance = GrievanceService.get_grievance_by_id(grievance_id)
    
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")
    
    Helper.prepare_response_data(grievance)
    return GrievanceResponse(**grievance)


@router.put("/{grievance_id}", response_model=GrievanceResponse)
async def update_grievance(
    grievance_id: str,
    update_data: GrievanceUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update grievance"""
    if update_data.status:
        GrievanceService.update_grievance_status(
            grievance_id,
            update_data.status,
            current_user["user_id"],
            update_data.remarks
        )
    
    grievance = GrievanceService.get_grievance_by_id(grievance_id)
    Helper.prepare_response_data(grievance)
    return GrievanceResponse(**grievance)


@router.post("/{grievance_id}/assign/{officer_id}")
async def assign_grievance(
    grievance_id: str,
    officer_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Assign grievance to officer"""
    success = GrievanceService.assign_grievance(
        grievance_id,
        officer_id,
        current_user["user_id"]
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to assign grievance")
    
    return success_response(None, "Grievance assigned successfully")


@router.post("/{grievance_id}/feedback")
async def add_feedback(
    grievance_id: str,
    feedback: GrievanceFeedbackCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add feedback to grievance"""
    success = GrievanceService.add_grievance_feedback(
        grievance_id,
        feedback.dict()
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to add feedback")
    
    return success_response(None, "Feedback added successfully")


# File Upload Endpoints
@router.post("/{grievance_id}/upload")
async def upload_grievance_attachment(
    grievance_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload attachment to grievance"""
    try:
        from utils.file_handler import upload_profile_image
        
        # Validate grievance exists
        grievance = GrievanceService.get_grievance_by_id(grievance_id)
        if not grievance:
            raise HTTPException(status_code=404, detail="Grievance not found")
        
        # Upload file
        file_url = await upload_profile_image(file)
        
        # Add to grievance
        success = GrievanceService.add_attachment(
            grievance_id,
            file.filename,
            file_url
        )
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to save attachment")
        
        return success_response(
            {"fileName": file.filename, "fileUrl": file_url},
            "File uploaded successfully"
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Upload failed")

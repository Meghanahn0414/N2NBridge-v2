"""
Grievance Routes
"""
import logging
from typing import Optional

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from grievances.model import (GrievanceCategoryCreate,
                              GrievanceCategoryResponse, GrievanceCreate,
                              GrievanceFeedbackCreate, GrievanceResponse,
                              GrievanceUpdate)
from grievances.service import GrievanceCategoryService, GrievanceService
from utils.helper import Helper
from utils.response import success_response

router = APIRouter(prefix="/api/grievances", tags=["Grievances"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=GrievanceResponse)
async def create_grievance(
    grievance_data: GrievanceCreate
):
    """Create grievance"""
    grievance_id = GrievanceService.create_grievance(
        grievance_data.model_dump(),
        None
    )
    
    grievance = GrievanceService.get_grievance_by_id(grievance_id)
    grievance = Helper.convert_mongo_doc(grievance)
    return GrievanceResponse(**grievance)


@router.get("/", response_model=list[GrievanceResponse])
async def list_grievances(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_officer_id: Optional[str] = None,
):
    """List grievances"""
    try:
        skip, limit = Helper.paginate(page, per_page)
        filters = {}
        if status:
            filters["status"] = status
        if priority:
            filters["priority"] = priority
        if assigned_officer_id:
            filters["assignedOfficerId"] = assigned_officer_id

        grievances = GrievanceService.list_grievances(skip, limit, filters)
        result = []
        for g in grievances:
            try:
                result.append(GrievanceResponse(**Helper.convert_mongo_doc(g)))
            except Exception as e:
                logger.warning(f"Skipping malformed grievance {g.get('_id')}: {e}")
        return result
    except Exception as e:
        logger.error(f"list_grievances failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# Category Endpoints - Must be before /{grievance_id} routes
@router.post("/categories", response_model=GrievanceCategoryResponse)
async def create_category(
    data: GrievanceCategoryCreate
):
    """Create grievance category"""
    category_id = GrievanceCategoryService.create_category(data.model_dump())
    category = GrievanceCategoryService.get_category_by_id(category_id)
    
    category = Helper.convert_mongo_doc(category)
    return GrievanceCategoryResponse(**category)


@router.get("/categories", response_model=list[GrievanceCategoryResponse])
async def list_categories():
    """List grievance categories"""
    categories = GrievanceCategoryService.get_all_categories()
    
    return [GrievanceCategoryResponse(**Helper.convert_mongo_doc(c)) for c in categories]


@router.get("/citizen/{citizen_id}", response_model=list[GrievanceResponse])
async def get_citizen_grievances(
    citizen_id: str,
    page: int = Query(1, ge=1)
):
    """Get grievances by citizen"""
    skip, limit = Helper.paginate(page, 10)
    grievances = GrievanceService.get_grievances_by_citizen(citizen_id, skip, limit)
    
    return [GrievanceResponse(**Helper.convert_mongo_doc(g)) for g in grievances]


# Parameterized routes - Must come after specific routes
@router.get("/{grievance_id}", response_model=GrievanceResponse)
async def get_grievance(
    grievance_id: str
):
    """Get grievance by ID"""
    try:
        grievance = GrievanceService.get_grievance_by_id(grievance_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Grievance not found")

    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")

    grievance = Helper.convert_mongo_doc(grievance)
    return GrievanceResponse(**grievance)


@router.put("/{grievance_id}", response_model=GrievanceResponse)
async def update_grievance(
    grievance_id: str,
    update_data: GrievanceUpdate
):
    """Update grievance"""
    if update_data.status:
        GrievanceService.update_grievance_status(
            grievance_id,
            update_data.status,
            None,
            update_data.remarks
        )
    
    grievance = GrievanceService.get_grievance_by_id(grievance_id)
    grievance = Helper.convert_mongo_doc(grievance)
    return GrievanceResponse(**grievance)


@router.post("/{grievance_id}/assign/{officer_id}")
async def assign_grievance(
    grievance_id: str,
    officer_id: str
):
    """Assign grievance to officer"""
    success = GrievanceService.assign_grievance(
        grievance_id,
        officer_id,
        None
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to assign grievance")
    
    return success_response(None, "Grievance assigned successfully")


@router.post("/{grievance_id}/feedback")
async def add_feedback(
    grievance_id: str,
    feedback: GrievanceFeedbackCreate
):
    """Add feedback to grievance"""
    success = GrievanceService.add_grievance_feedback(
        grievance_id,
        feedback.model_dump()
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to add feedback")
    
    return success_response(None, "Feedback added successfully")


# Statistics Endpoints - Must come before /{grievance_id} routes
@router.get("/stats/summary")
async def get_grievance_stats():
    """Get grievance statistics summary"""
    try:
        status_counts = GrievanceService.count_grievances_by_status()
        total_grievances = sum(status_counts.values())

        stats = {
            "total": total_grievances,
            "open": status_counts.get("NEW", 0),
            "assigned": status_counts.get("ASSIGNED", 0),
            "inProgress": status_counts.get("IN_PROGRESS", 0),
            "resolved": status_counts.get("RESOLVED", 0),
            "closed": status_counts.get("CLOSED", 0),
            "byStatus": status_counts
        }

        return success_response(stats, "Grievance statistics retrieved")
    except Exception as e:
        logger.error(f"Error retrieving stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve statistics")


@router.get("/stats/citizen/{citizen_id}")
async def get_citizen_grievance_stats(citizen_id: str):
    """Get grievance statistics for a specific citizen"""
    try:
        status_counts = GrievanceService.count_grievances_by_citizen_and_status(citizen_id)
        total = sum(status_counts.values())

        stats = {
            "total": total,
            "open": status_counts.get("NEW", 0),
            "assigned": status_counts.get("ASSIGNED", 0),
            "inProgress": status_counts.get("IN_PROGRESS", 0),
            "resolved": status_counts.get("RESOLVED", 0),
            "closed": status_counts.get("CLOSED", 0),
            "byStatus": status_counts
        }

        return success_response(stats, "Citizen grievance statistics retrieved")
    except Exception as e:
        logger.error(f"Error retrieving citizen stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve statistics")


# File Upload Endpoints
@router.post("/{grievance_id}/upload")
async def upload_grievance_attachment(
    grievance_id: str,
    file: UploadFile = File(...)
):
    """Upload attachment to grievance"""
    try:
        from utils.storage import upload_file

        # Validate grievance exists
        grievance = GrievanceService.get_grievance_by_id(grievance_id)
        if not grievance:
            raise HTTPException(status_code=404, detail="Grievance not found")

        # Upload file (S3 or local depending on config)
        file_url = await upload_file(file, folder="grievances")

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

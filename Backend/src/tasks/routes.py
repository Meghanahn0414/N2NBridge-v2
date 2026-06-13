"""
Task Routes
"""
import logging

from fastapi import APIRouter, HTTPException, Query
from tasks.model import (FieldReportCreate, FieldReportResponse, TaskCreate,
                         TaskResponse, TaskUpdate)
from tasks.service import FieldReportService, TaskService
from utils.helper import Helper
from utils.response import success_response

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate
):
    """Create task"""
    task_id = TaskService.create_task(task_data.dict(), None)
    task = TaskService.get_task_by_id(task_id)
    
    return TaskResponse(**Helper.convert_mongo_doc(task))


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str
):
    """Get task by ID"""
    task = TaskService.get_task_by_id(task_id)
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return TaskResponse(**Helper.convert_mongo_doc(task))


@router.get("/", response_model=list[TaskResponse])
async def list_tasks(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=1000),
    status: str = None,
    assigned_to: str = None,
):
    """List tasks"""
    skip, limit = Helper.paginate(page, per_page)
    filters = {}

    if status:
        filters["status"] = status
    if assigned_to:
        filters["assignedTo"] = assigned_to

    tasks = TaskService.list_tasks(skip, limit, filters)
    return [TaskResponse(**Helper.convert_mongo_doc(t)) for t in tasks]


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    update_data: TaskUpdate
):
    """Update task"""
    success = TaskService.update_task(
        task_id,
        update_data.dict(exclude_unset=True),
        None
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update task")
    
    task = TaskService.get_task_by_id(task_id)
    return TaskResponse(**Helper.convert_mongo_doc(task))


@router.get("/officer/{officer_id}", response_model=list[TaskResponse])
async def get_officer_tasks(
    officer_id: str,
    page: int = Query(1, ge=1)
):
    """Get tasks assigned to officer"""
    skip, limit = Helper.paginate(page, 10)
    tasks = TaskService.get_tasks_by_officer(officer_id, skip, limit)
    
    return [TaskResponse(**Helper.convert_mongo_doc(t)) for t in tasks]


# Field Report Endpoints
@router.post("/reports", response_model=FieldReportResponse)
async def create_field_report(
    report_data: FieldReportCreate
):
    """Create field report"""
    # report_id = FieldReportService.create_report(report_data.dict())
    report = FieldReportService.get_report_by_task(report_data.taskId)
    
    if report:
        return FieldReportResponse(**Helper.convert_mongo_doc(report))
    
    raise HTTPException(status_code=400, detail="Failed to create field report")


@router.get("/officer/{officer_id}/reports")
async def get_officer_reports(
    officer_id: str,
    page: int = Query(1, ge=1)
):
    """Get officer field reports"""
    skip, limit = Helper.paginate(page, 10)
    reports = FieldReportService.get_reports_by_officer(officer_id, skip, limit)
    
    return success_response([FieldReportResponse(**r) for r in reports])


@router.post("/{task_id}/assign/{officer_id}", response_model=TaskResponse)
async def assign_task(
    task_id: str,
    officer_id: str
):
    """Assign task to officer"""
    try:
        success = TaskService.assign_task(task_id, officer_id, None)
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to assign task")
        
        task = TaskService.get_task_by_id(task_id)
        return TaskResponse(**Helper.convert_mongo_doc(task))
    except Exception as e:
        logger.error(f"Error assigning task: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to assign task: {str(e)}")



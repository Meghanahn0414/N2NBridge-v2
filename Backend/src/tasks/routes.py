"""
Task Routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from auth.routes import get_current_user
from tasks.service import TaskService, FieldReportService
from tasks.model import (
    TaskCreate, TaskUpdate, TaskResponse,
    FieldReportCreate, FieldReportResponse
)
from utils.response import success_response
from utils.helper import Helper
import logging

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create task"""
    task_id = TaskService.create_task(task_data.dict(), current_user["user_id"])
    task = TaskService.get_task_by_id(task_id)
    
    Helper.prepare_response_data(task)
    return TaskResponse(**task)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get task by ID"""
    task = TaskService.get_task_by_id(task_id)
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    Helper.prepare_response_data(task)
    return TaskResponse(**task)


@router.get("/", response_model=list[TaskResponse])
async def list_tasks(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    status: str = None,
    current_user: dict = Depends(get_current_user)
):
    """List tasks"""
    skip, limit = Helper.paginate(page, per_page)
    filters = {}
    
    if status:
        filters["status"] = status
    
    tasks = TaskService.list_tasks(skip, limit, filters)
    Helper.prepare_response_list(tasks)
    return [TaskResponse(**t) for t in tasks]


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    update_data: TaskUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update task"""
    success = TaskService.update_task(
        task_id,
        update_data.dict(exclude_unset=True),
        current_user["user_id"]
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update task")
    
    task = TaskService.get_task_by_id(task_id)
    Helper.prepare_response_data(task)
    return TaskResponse(**task)


@router.get("/officer/{officer_id}", response_model=list[TaskResponse])
async def get_officer_tasks(
    officer_id: str,
    page: int = Query(1, ge=1),
    current_user: dict = Depends(get_current_user)
):
    """Get tasks assigned to officer"""
    skip, limit = Helper.paginate(page, 10)
    tasks = TaskService.get_tasks_by_officer(officer_id, skip, limit)
    
    Helper.prepare_response_list(tasks)
    return [TaskResponse(**t) for t in tasks]


# Field Report Endpoints
@router.post("/reports", response_model=FieldReportResponse)
async def create_field_report(
    report_data: FieldReportCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create field report"""
    report_id = FieldReportService.create_report(report_data.dict())
    report = FieldReportService.get_report_by_task(report_data.taskId)
    
    if report:
        Helper.prepare_response_data(report)
        return FieldReportResponse(**report)
    
    raise HTTPException(status_code=400, detail="Failed to create field report")


@router.get("/officer/{officer_id}/reports")
async def get_officer_reports(
    officer_id: str,
    page: int = Query(1, ge=1),
    current_user: dict = Depends(get_current_user)
):
    """Get officer field reports"""
    skip, limit = Helper.paginate(page, 10)
    reports = FieldReportService.get_reports_by_officer(officer_id, skip, limit)
    
    Helper.prepare_response_list(reports)
    return success_response([FieldReportResponse(**r) for r in reports])

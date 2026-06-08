"""
Event Routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from auth.routes import get_current_user
from events.service import EventService, EventRegistrationService
from events.model import (
    EventCreate, EventUpdate, EventResponse,
    EventRegistrationCreate, EventRegistrationResponse
)
from utils.response import success_response
from utils.helper import Helper
import logging

router = APIRouter(prefix="/api/events", tags=["Events"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=EventResponse)
async def create_event(
    event_data: EventCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create event"""
    event_id = EventService.create_event(event_data.dict(), current_user["user_id"])
    event = EventService.get_event_by_id(event_id)
    
    Helper.prepare_response_data(event)
    return EventResponse(**event)


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get event by ID"""
    event = EventService.get_event_by_id(event_id)
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    Helper.prepare_response_data(event)
    return EventResponse(**event)


@router.get("/", response_model=list[EventResponse])
async def list_events(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """List events"""
    skip, limit = Helper.paginate(page, per_page)
    events = EventService.list_events(skip, limit)
    
    Helper.prepare_response_list(events)
    return [EventResponse(**e) for e in events]


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    update_data: EventUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update event"""
    success = EventService.update_event(
        event_id,
        update_data.dict(exclude_unset=True),
        current_user["user_id"]
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update event")
    
    event = EventService.get_event_by_id(event_id)
    Helper.prepare_response_data(event)
    return EventResponse(**event)


@router.post("/{event_id}/publish")
async def publish_event(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Publish event"""
    success = EventService.publish_event(event_id, current_user["user_id"])
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to publish event")
    
    return success_response(None, "Event published successfully")


# Registration Endpoints
@router.post("/{event_id}/register", response_model=EventRegistrationResponse)
async def register_for_event(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Register for event"""
    registration_id = EventRegistrationService.register_citizen({
        "eventId": event_id,
        "citizenId": current_user["user_id"]
    })
    
    registration = EventRegistrationService.get_registration(event_id, current_user["user_id"])
    Helper.prepare_response_data(registration)
    return EventRegistrationResponse(**registration)


@router.get("/{event_id}/registrations", response_model=list[EventRegistrationResponse])
async def get_registrations(
    event_id: str,
    page: int = Query(1, ge=1),
    current_user: dict = Depends(get_current_user)
):
    """Get event registrations"""
    skip, limit = Helper.paginate(page, 10)
    registrations = EventRegistrationService.get_event_registrations(event_id, skip, limit)
    
    Helper.prepare_response_list(registrations)
    return [EventRegistrationResponse(**r) for r in registrations]


@router.post("/registrations/{registration_id}/attend")
async def mark_attendance(
    registration_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark attendance"""
    success = EventRegistrationService.mark_attendance(registration_id)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to mark attendance")
    
    return success_response(None, "Attendance marked successfully")

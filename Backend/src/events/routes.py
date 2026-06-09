"""
Event Routes
"""
import logging

from events.model import (EventCreate, EventRegistrationCreate,
                          EventRegistrationResponse, EventResponse,
                          EventUpdate)
from events.service import EventRegistrationService, EventService
from fastapi import APIRouter, HTTPException, Query
from utils.helper import Helper
from utils.response import success_response

router = APIRouter(prefix="/api/events", tags=["Events"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=EventResponse)
async def create_event(
    event_data: EventCreate
):
    """Create event"""
    event_id = EventService.create_event(event_data.dict(), None)
    event = EventService.get_event_by_id(event_id)
    
    return EventResponse(**Helper.convert_mongo_doc(event))


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str
):
    """Get event by ID"""
    event = EventService.get_event_by_id(event_id)
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return EventResponse(**Helper.convert_mongo_doc(event))


@router.get("/", response_model=list[EventResponse])
async def list_events(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=1000)
):
    """List events"""
    skip, limit = Helper.paginate(page, per_page)
    events = EventService.list_events(skip, limit)
    
    return [EventResponse(**Helper.convert_mongo_doc(e)) for e in events]


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    update_data: EventUpdate
):
    """Update event"""
    success = EventService.update_event(
        event_id,
        update_data.dict(exclude_unset=True),
        "system"
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update event")
    
    event = EventService.get_event_by_id(event_id)
    return EventResponse(**Helper.convert_mongo_doc(event))


@router.post("/{event_id}/publish")
async def publish_event(
    event_id: str
):
    """Publish event"""
    success = EventService.publish_event(event_id, "system")
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to publish event")
    
    return success_response(None, "Event published successfully")


# Registration Endpoints
@router.post("/{event_id}/register", response_model=EventRegistrationResponse)
async def register_for_event(
    event_id: str,
    registration_data: EventRegistrationCreate
):
    """Register for event"""
    registration_data_dict = registration_data.dict()
    registration_data_dict["eventId"] = event_id
    # registration_id = EventRegistrationService.register_citizen(registration_data_dict)
    
    registration = EventRegistrationService.get_registration(event_id, registration_data.citizenId)
    return EventRegistrationResponse(**Helper.convert_mongo_doc(registration))


@router.get("/{event_id}/registrations", response_model=list[EventRegistrationResponse])
async def get_registrations(
    event_id: str,
    page: int = Query(1, ge=1)
):
    """Get event registrations"""
    skip, limit = Helper.paginate(page, 10)
    registrations = EventRegistrationService.get_event_registrations(event_id, skip, limit)
    
    # Filter out registrations with missing citizenId
    valid_registrations = [
        Helper.convert_mongo_doc(r) for r in registrations 
        if r.get("citizenId")
    ]
    
    return [EventRegistrationResponse(**reg) for reg in valid_registrations]


@router.post("/registrations/{registration_id}/attend")
async def mark_attendance(
    registration_id: str
):
    """Mark attendance"""
    success = EventRegistrationService.mark_attendance(registration_id)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to mark attendance")
    
    return success_response(None, "Attendance marked successfully")



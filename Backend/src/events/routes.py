"""
Event Routes
"""
import logging

from config.database import MongoDatabase
from events.model import (EventCreate, EventRegistrationCreate,
                          EventRegistrationResponse, EventResponse,
                          EventUpdate)
from events.service import EventRegistrationService, EventService
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from tasks.background import notify_all_citizens, notify_ward_citizens
from utils.helper import Helper
from utils.response import success_response

router = APIRouter(prefix="/api/events", tags=["Events"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=EventResponse)
async def create_event(
    event_data: EventCreate
):
    """Create event — notifies ward citizens (or all citizens) on creation."""
    event_id = EventService.create_event(event_data.model_dump(), None)
    event = EventService.get_event_by_id(event_id)

    title = f"📅 New Event: {event.get('eventName', 'Upcoming Event')}"
    body = (
        f"{event.get('description', '')} — "
        f"{event.get('venue', '')} on "
        f"{event.get('eventDate', '').strftime('%d %b %Y') if event.get('eventDate') else 'TBD'}"
    )
    ward_id = event.get("wardId")
    extra = {"eventId": event_id, "wardId": ward_id}
    try:
        if ward_id:
            notify_ward_citizens.delay(ward_id, title, body, "EVENT", extra)
        else:
            notify_all_citizens.delay(title, body, "EVENT", extra)
        from tasks.background import notify_staff_users
        notify_staff_users.delay(title, body, "EVENT", extra)
    except Exception as exc:
        logger.warning(f"Event notification dispatch failed (non-fatal): {exc}")

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
    per_page: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
):
    """List events with optional status filter"""
    skip, limit = Helper.paginate(page, per_page)
    filters = {}
    if status:
        filters["status"] = status
    events = EventService.list_events(skip, limit, filters)
    return [EventResponse(**Helper.convert_mongo_doc(e)) for e in events]


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    update_data: EventUpdate
):
    """Update event"""
    success = EventService.update_event(
        event_id,
        update_data.model_dump(exclude_unset=True),
        "system"
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update event")
    
    event = EventService.get_event_by_id(event_id)
    return EventResponse(**Helper.convert_mongo_doc(event))


@router.delete("/{event_id}")
async def delete_event(
    event_id: str
):
    """Delete event"""
    success = EventService.delete_event(event_id)

    if not success:
        raise HTTPException(status_code=404, detail="Event not found")

    return success_response(None, "Event deleted successfully")


@router.post("/{event_id}/cancel")
async def cancel_event(event_id: str):
    """Cancel event — keeps it in DB with status CANCELLED"""
    success = EventService.cancel_event(event_id, "system")
    if not success:
        raise HTTPException(status_code=404, detail="Event not found")

    event = EventService.get_event_by_id(event_id)
    if event:
        from tasks.background import notify_ward_citizens, notify_all_citizens
        title = f"❌ Event Cancelled: {event.get('eventName', 'Event')}"
        body = f"The event '{event.get('eventName', '')}' at {event.get('venue', '')} has been cancelled."
        ward_id = event.get("wardId")
        extra = {"eventId": event_id}
        try:
            if ward_id:
                notify_ward_citizens.delay(ward_id, title, body, "EVENT", extra)
            else:
                notify_all_citizens.delay(title, body, "EVENT", extra)
        except Exception as exc:
            logger.warning(f"Cancel notification dispatch failed (non-fatal): {exc}")

    return success_response(None, "Event cancelled successfully")


@router.post("/{event_id}/publish")
async def publish_event(
    event_id: str
):
    """Publish event — re-notifies ward citizens (or all) that the event is now live."""
    success = EventService.publish_event(event_id, "system")

    if not success:
        raise HTTPException(status_code=400, detail="Failed to publish event")

    event = EventService.get_event_by_id(event_id)
    if event:
        title = f"🎉 Event Published: {event.get('eventName', 'Event')}"
        body = (
            f"Register now for {event.get('eventName', 'this event')} "
            f"at {event.get('venue', '')} on "
            f"{event.get('eventDate', '').strftime('%d %b %Y') if event.get('eventDate') else 'TBD'}."
        )
        ward_id = event.get("wardId")
        extra = {"eventId": event_id, "wardId": ward_id}
        try:
            if ward_id:
                notify_ward_citizens.delay(ward_id, title, body, "EVENT", extra)
            else:
                notify_all_citizens.delay(title, body, "EVENT", extra)
        except Exception as exc:
            logger.warning(f"Publish notification dispatch failed (non-fatal): {exc}")

    event = EventService.get_event_by_id(event_id)
    if event:
        from tasks.background import notify_staff_users
        staff_title = f"📅 Event Published: {event.get('eventName', 'Event')}"
        staff_body = (
            f"{event.get('eventName', 'An event')} is now live at "
            f"{event.get('venue', '')} on "
            f"{event.get('eventDate', '').strftime('%d %b %Y') if event.get('eventDate') else 'TBD'}."
        )
        extra = {"eventId": event_id}
        try:
            notify_staff_users.delay(staff_title, staff_body, "EVENT", extra)
        except Exception as exc:
            logger.warning(f"Staff event notification dispatch failed (non-fatal): {exc}")

    return success_response(None, "Event published successfully")


# Registration Endpoints
@router.post("/{event_id}/register")
async def register_for_event(
    event_id: str,
    registration_data: EventRegistrationCreate
):
    """Register for event"""
    try:
        citizen_id = registration_data.citizenId

        # Already registered? Return success (idempotent)
        existing = EventRegistrationService.get_registration(event_id, citizen_id)
        if existing:
            return {"success": True, "message": "Already registered"}

        # Register
        reg_dict = {"eventId": event_id, "citizenId": citizen_id}
        new_id = EventRegistrationService.register_citizen(reg_dict)

        return {"success": True, "message": "Registered successfully", "registrationId": new_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[REGISTER] Error: citizen={registration_data.citizenId} event={event_id} err={e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e) or "Registration failed")


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


@router.get("/stats/summary", response_model=dict)
async def get_event_stats():
    """Get event statistics summary"""
    try:
        # Get total registered events and upcoming events count
        all_events = EventService.list_events(0, 10000)  # Get all events
        total_events = len(all_events) if all_events else 0
        
        # Get total registrations
        db = MongoDatabase.get_db()
        registrations_count = db["event_registrations"].count_documents({})
        attended_count = db["event_registrations"].count_documents({"status": "attended"})
        
        stats = {
            "total": total_events,
            "registered": registrations_count,
            "upcoming": max(0, total_events - registrations_count),
            "attended": attended_count
        }
        
        return success_response(
            data=stats,
            message="Event stats retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Error fetching event stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

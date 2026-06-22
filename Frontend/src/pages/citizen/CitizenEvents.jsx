import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchEvents, registerForEvent } from "../../features/events/eventService";
import { getCitizenProfile } from "../../shared/services/citizenService";
import "./citizen-events.css";

export default function CitizenEvents() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch live profile to get the citizen's actual wardId / constituencyId
      let citizenAreaId = null;
      try {
        const profile = await getCitizenProfile();
        citizenAreaId = profile?.wardId || profile?.constituencyId || null;
      } catch { /* if profile fails, show no events so citizen sets up profile */ }

      const data = await fetchEvents(1, 100);
      const visible = (data || []).filter(e => {
        if (e.status === 'CANCELLED') return false;
        if (!citizenAreaId) return false; // no area set → show nothing until profile is complete
        return String(e.wardId) === String(citizenAreaId);
      });
      setUpcomingEvents(visible);
      setRegisteredEvents([]);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Failed to load events. Please try again.");
      setUpcomingEvents([]);
      setRegisteredEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterEvent = async (eventId) => {
    try {
      console.log("[REG] step 1: fetching profile for event", eventId);
      const profile = await getCitizenProfile();
      console.log("[REG] step 2: profile=", profile);
      const citizenId = profile?.citizenId || profile?.id || profile?._id;
      console.log("[REG] step 3: citizenId=", citizenId);
      if (!citizenId) { alert('Could not determine your citizen ID. Please update your profile.'); return; }
      console.log("[REG] step 4: calling registerForEvent");
      await registerForEvent(eventId, citizenId);
      console.log("[REG] step 5: success");
      const event = upcomingEvents.find((e) => (e._id || e.id) === eventId);
      alert(`✅ Successfully registered for "${event?.eventName || 'event'}"`);
      loadEvents();
    } catch (err) {
      console.error("[REG] CAUGHT ERROR type=", typeof err, "value=", err, "message=", err?.message, "stack=", err?.stack);
      console.error("[REG] response data=", err?.response?.data);
      alert(`Failed to register: ${err?.message || JSON.stringify(err?.response?.data) || 'Unknown error'}`);
    }
  };

  return (
    <div className="citizen-events-container">
      {/* Header */}
      <div className="events-header">
  <button className="events-back-btn" onClick={() => navigate("/citizen")}>
    ←
  </button>
  <div className="events-header-content">
    <h1 className="events-title">Events &amp; programs</h1>
    <p className="events-subtitle">Upcoming ward events</p>
  </div>
</div>
      {/* Loading State */}
      {loading && (
        <div className="events-content">
          <div className="loading-state">Loading events...</div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="events-content">
          <div className="error-state">
            <p>{error}</p>
            <button className="retry-btn" onClick={loadEvents}>
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && registeredEvents.length === 0 && upcomingEvents.length === 0 && (
        <div className="events-content">
          <div className="empty-state">
            <p>No events available for your ward.</p>
          </div>
        </div>
      )}

      {/* Main Content - Show only when loaded successfully */}
      {!loading && !error && (registeredEvents.length > 0 || upcomingEvents.length > 0) && (
        <>
      {/* Events Content */}
      <div className="events-content">
        {/* Registered Events Section */}
        {registeredEvents.length > 0 && (
          <div className="events-section">
            <h3 className="section-title">REGISTERED</h3>
            <div className="events-list">
              {registeredEvents.map((event) => (
                <div key={event.id} className="event-card">
                  <div className="event-header">
                    <h4 className="event-title">{event.title}</h4>
                    <span className="event-status registered">
                      {event.status}
                    </span>
                  </div>
                  <div className="event-details">
                    <div className="detail-row">
                      <span className="detail-label">📅</span>
                      <span className="detail-text">
                        {event.date} · {event.time}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">📍</span>
                      <span className="detail-text">{event.location}</span>
                    </div>
                    <div className="event-meta">
                      <span className="meta-item">👥 {event.attendees} attending</span>
                      <span className="meta-item">{event.type}</span>
                    </div>
                  </div>
                  <button
                    className="event-action-btn unregister-btn"
                    onClick={() => {}}
                  >
                    Cancel registration
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events Section */}
        {upcomingEvents.length > 0 && (
          <div className="events-section">
            <h3 className="section-title">UPCOMING NEAR YOU</h3>
            <div className="events-list">
              {upcomingEvents.map((event) => {
                const eventId = event._id || event.id;
                const eventDate = event.eventDate
                  ? new Date(event.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—';
                const eventTime = event.eventDate
                  ? new Date(event.eventDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                  : '';
                return (
                  <div key={eventId} className="event-card">
                    <div className="event-header">
                      <h4 className="event-title">{event.eventName}</h4>
                      <span className="event-status open">{event.status}</span>
                    </div>
                    <div className="event-details">
                      <div className="detail-row">
                        <span className="detail-label">📅</span>
                        <span className="detail-text">{eventDate}{eventTime ? ` · ${eventTime}` : ''}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">📍</span>
                        <span className="detail-text">{event.venue || '—'}</span>
                      </div>
                      {event.wardId && (
                        <div className="detail-row">
                          <span className="detail-label">🏘️</span>
                          <span className="detail-text">Ward {event.wardId}</span>
                        </div>
                      )}
                      <div className="event-meta">
                        <span className="meta-item">{event.eventType || '—'}</span>
                        <span className="meta-item">👥 {event.registrationCount || 0} registered</span>
                      </div>
                    </div>
                    <button
                      className="event-action-btn register-btn"
                      onClick={() => handleRegisterEvent(eventId)}
                    >
                      Register free
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {registeredEvents.length === 0 && upcomingEvents.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <p>No events available at the moment</p>
            <small>Check back later for upcoming programs</small>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import eventService from "../../services/eventService";
import "./citizen-events.css";

export default function CitizenEvents() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventService.getCitizenEvents();
      setRegisteredEvents(data.registered || []);
      setUpcomingEvents(data.upcoming || []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Failed to load events. Please try again.");
      setRegisteredEvents([]);
      setUpcomingEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterEvent = async (eventId) => {
    try {
      await eventService.registerForEvent(eventId);
      const event = upcomingEvents.find((e) => e.id === eventId);
      if (event) {
        alert(`✅ Successfully registered for "${event.title}"`);
        // Refresh events list
        fetchEvents();
      }
    } catch (err) {
      console.error("Error registering for event:", err);
      alert(`Failed to register: ${err.message}`);
    }
  };

  const handleUnregisterEvent = async (eventId) => {
    try {
      await eventService.unregisterFromEvent(eventId);
      const event = registeredEvents.find((e) => e.id === eventId);
      if (event) {
        alert(`Unregistered from "${event.title}"`);
        // Refresh events list
        fetchEvents();
      }
    } catch (err) {
      console.error("Error unregistering from event:", err);
      alert(`Failed to unregister: ${err.message}`);
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
            <button className="retry-btn" onClick={fetchEvents}>
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
          {/* Ward and Date Info */}
          <div className="ward-info-section">
            <div className="ward-info-banner">
              <div className="ward-calendar-icon">📅</div>
              <div className="ward-info-text">
                <h2>Ward Events</h2>
              </div>
            </div>
          </div>

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
                    onClick={() => handleUnregisterEvent(event.id)}
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
              {upcomingEvents.map((event) => (
                <div key={event.id} className="event-card">
                  <div className="event-header">
                    <h4 className="event-title">{event.title}</h4>
                    <span className="event-status open">{event.status}</span>
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
                      <span className="meta-item">{event.type}</span>
                    </div>
                  </div>
                  <button
                    className="event-action-btn register-btn"
                    onClick={() => handleRegisterEvent(event.id)}
                  >
                    Register free
                  </button>
                </div>
              ))}
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

import React, { useState } from 'react';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/EventsPublicPrograms.css';

export default function EventsPublicPrograms() {
  const [events, setEvents] = useState([
    { id: '', name: '', date: '', ward: '', registrations:'', feedback:'', status: '' },
    { id: '', name: '', date: '', ward: '', registrations: '', feedback: '', status: '' },
    { id: '', name: '', date: '', ward: '', registrations: '', feedback: '', status: '' },
    { id: '', name: '', date: '', ward: '', registrations:'', feedback:'', status: '' },
  ]);

  const [totalMetrics] = useState({
    totalEvents: '',
    upcomingEvents: '',
    totalRegistrations: '',
    avgAttendance: '',
    avgFeedback: '',
  });

  return (
    <div className="mla-container">
      <div className="mla-header">
        <h1>📅 Events & Public Programs</h1>
        <p>Manage constituency events and community outreach</p>
      </div>

      {/* Event Metrics */}
      <div className="mla-section">
        <div className="event-metrics-grid">
          <div className="metric-card">
            <div className="metric-value">{totalMetrics.totalEvents}</div>
            <div className="metric-label">Total Events</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{totalMetrics.upcomingEvents}</div>
            <div className="metric-label">Upcoming This Week</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{totalMetrics.totalRegistrations}</div>
            <div className="metric-label">Total Registrations</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{totalMetrics.avgAttendance}%</div>
            <div className="metric-label">Avg Attendance</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{totalMetrics.avgFeedback}/5 ⭐</div>
            <div className="metric-label">Avg Feedback</div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="mla-section">
        <h2>Upcoming Events Calendar</h2>
        <div className="calendar-placeholder">
          <p>📆 Calendar View (Integration with React Calendar)</p>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="mla-section">
        <h2>Upcoming Events</h2>
        <div className="events-list">
          {events.map(event => (
            <div key={event.id} className="event-item">
              <div className="event-date">
                <div className="date-day">{new Date(event.date).getDate()}</div>
                <div className="date-month">{new Date(event.date).toLocaleString('default', { month: 'short' })}</div>
              </div>
              <div className="event-info">
                <h4>{event.name}</h4>
                <p className="event-location">📍 {event.ward}</p>
                <div className="event-stats">
                  <span>👥 {event.registrations} registrations</span>
                  <span>⭐ {event.feedback}/5</span>
                </div>
              </div>
              <button className="btn-secondary">Manage</button>
            </div>
          ))}
        </div>
      </div>

      {/* Create Event Button */}
      <div className="mla-section">
        <div className="detail-buttons">
          <button className="btn-primary">+ Create New Event</button>
          <button className="btn-primary">View Event Analytics</button>
          <button className="btn-primary">Send Reminders</button>
        </div>
      </div>
    </div>
  );
}

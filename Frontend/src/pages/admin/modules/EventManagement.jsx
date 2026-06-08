import React, { useState } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';

export default function EventManagement() {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({ status: 'ALL' });

  return (
    <div className="module-container">
      <div className="module-header">
        <h1>📅 Event Management</h1>
        <p>Create, manage, and track events and registrations</p>
      </div>

      <div className="module-controls">
        <input type="text" placeholder="Search events..." />
        
        <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
          <option value="ALL">All Events</option>
          <option value="UPCOMING">Upcoming</option>
          <option value="ONGOING">Ongoing</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Create Event
        </button>
      </div>

      <div className="module-stats">
        <div className="stat-card">
          <span className="stat-label">Total Events</span>
          <span className="stat-value"></span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Upcoming</span>
          <span className="stat-value"></span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Registrations</span>
          <span className="stat-value"></span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg Attendance %</span>
          <span className="stat-value"></span>
        </div>
      </div>

      <div className="events-list">
        <div className="empty-state">
          <p>📭 No events created yet. Click "Create Event" to get started.</p>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create New Event</h2>
            <form>
              <div className="form-group">
                <label>Event Name *</label>
                <input type="text" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea></textarea>
              </div>
              <div className="form-group">
                <label>Date & Time *</label>
                <input type="datetime-local" required />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" />
              </div>
              <div className="form-group">
                <label>Expected Attendees</label>
                <input type="number" />
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <input type="number" />
              </div>
              <div className="form-group">
                <label>Event Type</label>
                <select>
                  <option>Select Type</option>
                  <option>Awareness Campaign</option>
                  <option>Community Meeting</option>
                  <option>Training Program</option>
                  <option>Health Camp</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

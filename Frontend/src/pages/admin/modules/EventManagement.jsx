import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import { fetchEvents, createEvent } from '../../../features/events/eventService';

export default function EventManagement() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({ status: 'ALL' });
  const [stats, setStats] = useState({ total: 0, upcoming: 0, registrations: 0, attendance: 0 });
  
  useEffect(() => {
    loadEvents();
  }, [filters]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEvents(1, 1000, filters);
      setEvents(data);
      calculateStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load events');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (eventList) => {
    const total = eventList.length;
    const upcoming = eventList.filter(e => e.status === 'UPCOMING').length;
    const registrations = eventList.reduce((sum, e) => sum + (e.registrations || 0), 0);
    const attendance = eventList.length > 0 ? Math.round((eventList.filter(e => e.attendance).length / eventList.length) * 100) : 0;
    setStats({ total, upcoming, registrations, attendance });
  };

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
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Upcoming</span>
          <span className="stat-value">{stats.upcoming}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Registrations</span>
          <span className="stat-value">{stats.registrations}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg Attendance %</span>
          <span className="stat-value">{stats.attendance}%</span>
        </div>
      </div>

      <div className="events-list">
        {loading ? (
          <div className="loading-state">Loading events...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <p>📭 No events created yet. Click "Create Event" to get started.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Date & Time</th>
                <th>Location</th>
                <th>Status</th>
                <th>Registrations</th>
                <th>Attendance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event._id || event.id}>
                  <td>{event.name}</td>
                  <td>{event.dateTime ? new Date(event.dateTime).toLocaleDateString() : '-'}</td>
                  <td>{event.location}</td>
                  <td><span className="status-badge">{event.status}</span></td>
                  <td>{event.registrations || 0}</td>
                  <td>{event.attendance || 0}%</td>
                  <td>
                    <button>✏️</button>
                    <button>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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

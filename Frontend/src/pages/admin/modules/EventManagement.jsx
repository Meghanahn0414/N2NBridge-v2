import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import PageHeader from "../../../components/PageHeader";
import { fetchEvents, createEvent, updateEvent, deleteEvent, publishEvent, cancelEvent } from '../../../features/events/eventService';
import Pagination from '../../../components/Pagination';

const PAGE_SIZE = 100;
const EMPTY_FORM = { name: '', description: '', dateTime: '', location: '', capacity: '', eventType: '', wardId: '' };

const toDatetimeLocal = (iso) => {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 16);
};

export default function EventManagement() {
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stats, setStats] = useState({ total: 0, upcoming: 0, registrations: 0, attendance: 0 });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Create / Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation modal
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Cancel confirmation modal
  const [cancellingEvent, setCancellingEvent] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => { loadEvents(page); }, [page]);

  // Client-side filter applied on every render
  const events = allEvents.filter(e => {
    const matchesStatus = statusFilter === 'ALL' || (e.status || 'DRAFT') === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q ||
      (e.eventName || '').toLowerCase().includes(q) ||
      (e.venue || '').toLowerCase().includes(q) ||
      (e.eventType || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const loadEvents = async (targetPage = page) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEvents(targetPage, PAGE_SIZE, {});
      setAllEvents(data);
      setHasMore(data.length >= PAGE_SIZE);
      calculateStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (list) => {
    const total = list.length;
    const upcoming = list.filter(e => e.status === 'PUBLISHED' || e.status === 'ONGOING').length;
    const registrations = list.reduce((sum, e) => sum + (e.registrationCount || 0), 0);
    setStats({ total, upcoming, registrations, attendance: 0 });
  };

  // ── Form helpers ──────────────────────────────────────────
  const openCreate = () => {
    setEditingEvent(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.eventName || '',
      description: event.description || '',
      dateTime: toDatetimeLocal(event.eventDate),
      location: event.venue || '',
      capacity: event.capacity != null ? String(event.capacity) : '',
      eventType: event.eventType || '',
      wardId: event.wardId || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEvent(null);
    setFormData(EMPTY_FORM);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        eventName: formData.name,
        description: formData.description || '',
        eventDate: formData.dateTime,
        venue: formData.location || '',
        capacity: formData.capacity ? Number(formData.capacity) : 100,
        eventType: formData.eventType || 'Other',
        wardId: formData.wardId || null,
      };

      if (editingEvent) {
        await updateEvent(editingEvent.id || editingEvent._id, payload);
      } else {
        await createEvent({ ...payload, qrEnabled: true, organizerId: 'system' });
      }

      closeModal();
      await loadEvents(); // reload all, recalculate stats
    } catch (err) {
      alert(err.message || `Failed to ${editingEvent ? 'update' : 'create'} event`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Cancel helper ─────────────────────────────────────────
  const handleCancelConfirm = async () => {
    try {
      setCancelling(true);
      await cancelEvent(cancellingEvent._id || cancellingEvent.id);
      setCancellingEvent(null);
      await loadEvents();
    } catch (err) {
      alert(err.message || 'Failed to cancel event');
    } finally {
      setCancelling(false);
    }
  };

  // ── Publish helper ────────────────────────────────────────
  const handlePublish = async (event) => {
    if (!window.confirm(`Publish "${event.eventName}"? Citizens will be able to see it.`)) return;
    try {
      await publishEvent(event._id || event.id);
      await loadEvents();
    } catch (err) {
      alert(err.message || 'Failed to publish event');
    }
  };

  // ── Delete helpers ────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await deleteEvent(deletingEvent.id || deletingEvent._id);
      setDeletingEvent(null);
      await loadEvents();
    } catch (err) {
      alert(err.message || 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader subtitle="Create, manage, and track events and registrations" />
      <div className="module-container">
      <div className="module-controls">
        <input
          type="text"
          placeholder="Search by name, location, type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All Events</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ONGOING">Ongoing</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <button className="btn-primary" onClick={openCreate}>+ Create Event</button>
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

      <div className="events-table-wrapper">
        {loading ? (
          <div className="loading-state">Loading events...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <p>{allEvents.length === 0
              ? '📭 No events created yet. Click "Create Event" to get started.'
              : '🔍 No events match your search or filter.'
            }</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Event Name</th>
                <th>Date & Time</th>
                <th>Location</th>
                <th>Ward</th>
                <th>Type</th>
                <th>Status</th>
                <th>Registrations</th>
                <th>Capacity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, idx) => (
                <tr key={event._id || event.id}>
                  <td className="row-num">{idx + 1}</td>
                  <td className="event-name-cell">{event.eventName}</td>
                  <td>{event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                  <td>{event.venue || '-'}</td>
                  <td>{event.wardId || '-'}</td>
                  <td>{event.eventType || '-'}</td>
                  <td>
                    <span className={`event-status-badge status-${(event.status || 'DRAFT').toLowerCase()}`}>
                      {event.status || 'DRAFT'}
                    </span>
                  </td>
                  <td className="center">{event.registrationCount || 0}</td>
                  <td className="center">{event.capacity || 0}</td>
                  <td>
                    <div className="action-btns">
                      {event.status === 'DRAFT' && (
                        <button className="action-btn publish" title="Publish event" onClick={() => handlePublish(event)}>🚀</button>
                      )}
                      {event.status !== 'CANCELLED' && event.status !== 'COMPLETED' && (
                        <button className="action-btn" title="Cancel event" onClick={() => setCancellingEvent(event)}
                          style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 14 }}>
                          🚫
                        </button>
                      )}
                      <button className="action-btn edit" title="Edit event" onClick={() => openEdit(event)}>✏️</button>
                      <button className="action-btn delete" title="Delete event" onClick={() => setDeletingEvent(event)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination
          page={page}
          hasMore={hasMore}
          onPrev={() => setPage(p => p - 1)}
          onNext={() => setPage(p => p + 1)}
          loading={loading}
          pageSize={PAGE_SIZE}
        />
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content">
            <h2>{editingEvent ? '✏️ Edit Event' : '➕ Create New Event'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Event Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label>Date & Time *</label>
                <input type="datetime-local" name="dateTime" value={formData.dateTime} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <input type="number" name="capacity" value={formData.capacity} onChange={handleFormChange} min="1" />
              </div>
              <div className="form-group">
                <label>Ward Number</label>
                <input
                  type="text"
                  name="wardId"
                  value={formData.wardId}
                  onChange={handleFormChange}
                  placeholder="e.g. 23"
                />
              </div>
              <div className="form-group">
                <label>Event Type</label>
                <select name="eventType" value={formData.eventType} onChange={handleFormChange}>
                  <option value="">Select Type</option>
                  <option value="Awareness Campaign">Awareness Campaign</option>
                  <option value="Community Meeting">Community Meeting</option>
                  <option value="Training Program">Training Program</option>
                  <option value="Health Camp">Health Camp</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={closeModal} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? (editingEvent ? 'Saving...' : 'Creating...') : (editingEvent ? 'Save Changes' : 'Create Event')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingEvent && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setCancellingEvent(null)}>
          <div className="modal-content delete-confirm-modal">
            <div className="delete-icon">🚫</div>
            <h2>Cancel Event?</h2>
            <p className="delete-msg">
              Are you sure you want to cancel <strong>{cancellingEvent.eventName}</strong>?
              The event will be stored in the database as <strong>CANCELLED</strong> and citizens will be notified.
            </p>
            <div className="form-actions">
              <button type="button" onClick={() => setCancellingEvent(null)} disabled={cancelling}>Back</button>
              <button type="button" className="btn-danger" onClick={handleCancelConfirm} disabled={cancelling}>
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEvent && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeletingEvent(null)}>
          <div className="modal-content delete-confirm-modal">
            <div className="delete-icon">🗑️</div>
            <h2>Delete Event?</h2>
            <p className="delete-msg">
              Are you sure you want to delete <strong>{deletingEvent.eventName}</strong>?
              This action cannot be undone.
            </p>
            <div className="form-actions">
              <button type="button" onClick={() => setDeletingEvent(null)} disabled={deleting}>Cancel</button>
              <button type="button" className="btn-danger" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

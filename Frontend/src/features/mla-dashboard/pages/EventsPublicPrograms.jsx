import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/routes/RouteConstants';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/EventsPublicPrograms.css';
import useMlaDashboard from '../../../shared/hooks/useMlaDashboard';
import PageHeader from '../../../components/PageHeader';
import ExportButton from '../../../components/ExportButton';

const formatNumber = (value) => (value == null || value === '' ? '-' : value.toLocaleString());

export default function EventsPublicPrograms() {
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const { dashboard } = useMlaDashboard();

  const handleCreateEvent = () => window.alert('Create Event feature coming soon. Please contact your administrator to create events.');
  const handleViewAnalytics = () => navigate(ROUTES.mlaAIInsights);
  const handleSendReminders = () => navigate(ROUTES.mlaCommunications);
  const handleManageEvent = () => navigate(ROUTES.mlaCommunications);

  const eventMetrics = dashboard?.metrics?.events || {};
  const events = Array.isArray(eventMetrics.recent) ? eventMetrics.recent.slice(0, 4) : [];
  const totalMetrics = {
    totalEvents: formatNumber(eventMetrics.totalEvents || events.length),
    upcomingEvents: formatNumber(eventMetrics.upcomingEvents || events.filter((e) => new Date(e.date) >= new Date()).length),
    totalRegistrations: formatNumber(eventMetrics.registrations || events.reduce((sum, e) => sum + (e.attendees || 0), 0)),
    avgAttendance: formatNumber(eventMetrics.avgAttendance || 0),
    avgFeedback: formatNumber(eventMetrics.avgFeedback || 0),
  };

  return (
    <div>
      <PageHeader subtitle="Manage events and public programs" />
      <div className="mla-container" ref={pageRef}>

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
            <div className="metric-label">Avg. Attendance</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{totalMetrics.avgFeedback}/5 ⭐</div>
            <div className="metric-label">Avg. Feedback</div>
          </div>
        </div>
      </div>

      <div className="mla-section">
        <h2>Upcoming Events Calendar</h2>
        <div className="calendar-placeholder">
          <p>📆 Calendar View (Integration with React Calendar)</p>
        </div>
      </div>

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
                  <span>👥 {event.registrations} Registrations</span>
                  <span>⭐ {event.feedback}/5</span>
                </div>
              </div>
              <button type="button" className="btn-secondary" onClick={handleManageEvent}>Manage</button>
            </div>
          ))}
        </div>
      </div>

      <div className="mla-section">
        <div className="detail-buttons">
          <button type="button" className="btn-primary" onClick={handleCreateEvent}>Create New Event</button>
          <button type="button" className="btn-primary" onClick={handleViewAnalytics}>View Event Analytics</button>
          <button type="button" className="btn-primary" onClick={handleSendReminders}>Send Reminders</button>
          <ExportButton
            filename="events"
            pdfRef={pageRef}
            data={events.length > 0 ? events.map(e => ({
              name: e.name || '—',
              ward: e.ward || '—',
              date: e.date ? new Date(e.date).toLocaleDateString() : '—',
              registrations: e.registrations || 0,
              feedback: e.feedback || '—',
            })) : [{ name: 'Total Events', ward: totalMetrics.totalEvents, date: '—', registrations: totalMetrics.totalRegistrations, feedback: totalMetrics.avgFeedback }]}
            columns={[
              { key: 'name',          label: 'Event' },
              { key: 'ward',          label: 'Location' },
              { key: 'date',          label: 'Date' },
              { key: 'registrations', label: 'Registrations' },
              { key: 'feedback',      label: 'Feedback' },
            ]}
          />
        </div>
      </div>
    </div>
  </div>
  );
}

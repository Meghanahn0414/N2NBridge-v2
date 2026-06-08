import React, { useState } from 'react';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/LiveConstituencyStatus.css';

export default function LiveConstituencyStatus() {
  const [stats, setStats] = useState({
    complaints: { new:'', assigned:'', inProgress:'', resolved: '' },
    alerts: { critical: '', high: '', medium: '', low: '' },
    events: { today: '', thisWeek: '', registrations: '' },
  });

  return (
    <div className="mla-container">
      <div className="mla-header">
        <h1>📊 Live Constituency Status</h1>
        <p>Real-time command center view</p>
      </div>

      {/* Complaints Widget */}
      <div className="mla-section">
        <h2>Complaints Status</h2>
        <div className="status-widget-grid">
          <div className="status-widget new">
            <div className="status-number">{stats.complaints.new}</div>
            <div className="status-label">New</div>
            <div className="status-icon">📝</div>
          </div>
          <div className="status-widget assigned">
            <div className="status-number">{stats.complaints.assigned}</div>
            <div className="status-label">Assigned</div>
            <div className="status-icon">👤</div>
          </div>
          <div className="status-widget inProgress">
            <div className="status-number">{stats.complaints.inProgress}</div>
            <div className="status-label">In Progress</div>
            <div className="status-icon">⚙️</div>
          </div>
          <div className="status-widget resolved">
            <div className="status-number">{stats.complaints.resolved}</div>
            <div className="status-label">Resolved</div>
            <div className="status-icon">✅</div>
          </div>
        </div>
      </div>

      {/* Alerts Widget */}
      <div className="mla-section">
        <h2>Emergency Alerts</h2>
        <div className="status-widget-grid">
          <div className="status-widget critical">
            <div className="status-number">{stats.alerts.critical}</div>
            <div className="status-label">Critical</div>
            <div className="status-icon">🔴</div>
          </div>
          <div className="status-widget high">
            <div className="status-number">{stats.alerts.high}</div>
            <div className="status-label">High</div>
            <div className="status-icon">🟠</div>
          </div>
          <div className="status-widget medium">
            <div className="status-number">{stats.alerts.medium}</div>
            <div className="status-label">Medium</div>
            <div className="status-icon">🟡</div>
          </div>
          <div className="status-widget low">
            <div className="status-number">{stats.alerts.low}</div>
            <div className="status-label">Low</div>
            <div className="status-icon">🟢</div>
          </div>
        </div>
      </div>

      {/* Events Widget */}
      <div className="mla-section">
        <h2>Events & Outreach</h2>
        <div className="status-widget-grid">
          <div className="status-widget events">
            <div className="status-number">{stats.events.today}</div>
            <div className="status-label">Today</div>
            <div className="status-icon">📅</div>
          </div>
          <div className="status-widget events">
            <div className="status-number">{stats.events.thisWeek}</div>
            <div className="status-label">This Week</div>
            <div className="status-icon">📆</div>
          </div>
          <div className="status-widget events">
            <div className="status-number">{stats.events.registrations}</div>
            <div className="status-label">Registrations</div>
            <div className="status-icon">👥</div>
          </div>
        </div>
      </div>

      {/* View Details Buttons */}
      <div className="mla-section">
        <div className="detail-buttons">
          <button className="btn-primary">View All Complaints</button>
          <button className="btn-primary">View All Alerts</button>
          <button className="btn-primary">View All Events</button>
        </div>
      </div>
    </div>
  );
}

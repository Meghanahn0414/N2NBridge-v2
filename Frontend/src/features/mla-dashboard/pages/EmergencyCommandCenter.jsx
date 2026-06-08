import React, { useState } from 'react';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/EmergencyCommandCenter.css';

export default function EmergencyCommandCenter() {
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'Flood', ward: 'Ward 8', status: 'Team Dispatched', time: '10 mins ago', priority: 'critical' },
    { id: 2, type: 'Fire', ward: 'Ward 14', status: 'Firefighters En Route', time: '23 mins ago', priority: 'critical' },
    { id: 3, type: 'Medical Emergency', ward: 'Ward 5', status: 'Ambulance Assigned', time: '45 mins ago', priority: 'high' },
    { id: 4, type: 'Accident', ward: 'Ward 12', status: 'Police On Scene', time: '1 hour ago', priority: 'high' },
    { id: 5, type: 'Law & Order', ward: 'Ward 20', status: 'Investigation Underway', time: '2 hours ago', priority: 'high' },
  ]);

  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="mla-container">
      <div className="mla-header alert-header">
        <h1>🚨 Emergency Command Center</h1>
        <p>Real-time emergency response coordination</p>
      </div>

      {/* Critical Alert Count */}
      <div className="mla-section">
        <div className="critical-alert-banner">
          <div className="critical-count">
            <span className="count-number">5</span>
            <span className="count-label">Active Emergencies</span>
          </div>
          <button className="btn-danger">🔔 Alert All Officers</button>
        </div>
      </div>

      {/* Alert Tabs */}
      <div className="mla-section">
        <div className="alert-tabs">
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Alerts (5)
          </button>
          <button
            className={`tab-btn ${activeTab === 'critical' ? 'active' : ''}`}
            onClick={() => setActiveTab('critical')}
          >
            Critical (2)
          </button>
          <button
            className={`tab-btn ${activeTab === 'high' ? 'active' : ''}`}
            onClick={() => setActiveTab('high')}
          >
            High (3)
          </button>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="mla-section">
        <div className="alert-cards">
          {alerts.map(alert => (
            <div key={alert.id} className={`alert-card ${alert.priority}`}>
              <div className="alert-header-row">
                <h3>{alert.type}</h3>
                <span className={`priority-badge ${alert.priority}`}>{alert.priority.toUpperCase()}</span>
              </div>
              
              <div className="alert-details">
                <div className="detail-row">
                  <span className="label">Location:</span>
                  <span className="value">{alert.ward}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span className="value status-text">{alert.status}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Reported:</span>
                  <span className="value">{alert.time}</span>
                </div>
              </div>

              <div className="alert-actions">
                <button className="btn-secondary">View Details</button>
                <button className="btn-secondary">Dispatch Team</button>
                <button className="btn-danger">Escalate</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Response Teams */}
      <div className="mla-section">
        <h2>Response Teams Status</h2>
        <div className="teams-grid">
          <div className="team-card">
            <div className="team-name">🚒 Fire Brigade</div>
            <div className="team-status active">Active</div>
            <div className="team-units">2 units deployed</div>
          </div>
          <div className="team-card">
            <div className="team-name">🚑 Ambulance Service</div>
            <div className="team-status active">Active</div>
            <div className="team-units">1 unit deployed</div>
          </div>
          <div className="team-card">
            <div className="team-name">🚓 Police</div>
            <div className="team-status active">Active</div>
            <div className="team-units">2 units deployed</div>
          </div>
          <div className="team-card">
            <div className="team-name">🛠️ Emergency Repair</div>
            <div className="team-status standby">Standby</div>
            <div className="team-units">Available</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mla-section">
        <div className="detail-buttons">
          <button className="btn-danger">📢 Send Emergency Broadcast</button>
          <button className="btn-primary">📞 Call Emergency Meeting</button>
          <button className="btn-primary">📋 View Response Logs</button>
        </div>
      </div>
    </div>
  );
}

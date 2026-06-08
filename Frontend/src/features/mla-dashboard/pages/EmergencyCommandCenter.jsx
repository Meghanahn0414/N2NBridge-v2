import React, { useState } from 'react';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/EmergencyCommandCenter.css';

export default function EmergencyCommandCenter() {
  const [alerts, setAlerts] = useState([
    { id: '', type: '', ward: '', status: '', time: '', priority: '' },
    { id: '', type: '', ward: '', status: '', time: '', priority: '' },
    { id: '', type: '', ward: '', status: '', time: '', priority: '' },
    { id: '', type: '', ward: '', status: '', time: '', priority: '' },
    { id: '', type: '', ward: '', status: '', time: '', priority: '' },
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
            <span className="count-number"></span>
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
            All Alerts ()
          </button>
          <button
            className={`tab-btn ${activeTab === 'critical' ? 'active' : ''}`}
            onClick={() => setActiveTab('critical')}
          >
            Critical ()
          </button>
          <button
            className={`tab-btn ${activeTab === 'high' ? 'active' : ''}`}
            onClick={() => setActiveTab('high')}
          >
            High ()
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
            <div className="team-name"></div>
            <div className="team-status active"></div>
            <div className="team-units"></div>
          </div>
          <div className="team-card">
            <div className="team-name"></div>
            <div className="team-status active"></div>
            <div className="team-units"></div>
          </div>
          <div className="team-card">
            <div className="team-name"></div>
            <div className="team-status active"></div>
            <div className="team-units"></div>
          </div>
          <div className="team-card">
            <div className="team-name"></div>
            <div className="team-status standby"></div>
            <div className="team-units"></div>
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

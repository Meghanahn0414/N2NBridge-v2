import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/routes/RouteConstants';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/EmergencyCommandCenter.css';
import useMlaDashboard from '../../../shared/hooks/useMlaDashboard';

export default function EmergencyCommandCenter() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const { dashboard, loading, error } = useMlaDashboard();

  const handleAlertAllOfficers = () => navigate(ROUTES.mlaCommunications);
  const handleViewDetails = () => navigate(ROUTES.mlaEmergencyCenter);
  const handleDispatchTeam = () => navigate(ROUTES.mlaTeamPerformance);
  const handleEscalate = () => navigate(ROUTES.mlaCommunications);
  const handleSendEmergencyBroadcast = () => navigate(ROUTES.mlaCommunications);
  const handleCallMeeting = () => navigate(ROUTES.mlaEvents);
  const handleViewResponseLogs = () => window.alert('Opening response logs...');
  const alerts = dashboard?.recentAlerts?.slice(0, 5).map((alert) => ({
    id: alert._id,
    type: alert.alertType || alert.type || 'Emergency Alert',
    ward: alert.location || alert.wardId || 'Unknown',
    status: alert.status || 'Active',
    time: new Date(alert.createdAt || Date.now()).toLocaleString(),
    priority: (alert.priority || 'medium').toLowerCase(),
  })) || [];
  const alertCounts = {
    all: alerts.length,
    critical: alerts.filter((alert) => alert.priority === 'critical').length,
    high: alerts.filter((alert) => alert.priority === 'high').length,
  };
  const responseTeams = (dashboard?.teamPerformance || []).slice(0, 4).map((member) => ({
    name: member.name || 'Team Member',
    status: member.completed > 0 ? 'active' : 'standby',
    units: member.assigned || 0,
  }));

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
            <span className="count-number">{alertCounts.all}</span>
            <span className="count-label">Active Emergencies</span>
          </div>
          <button type="button" className="btn-danger" onClick={handleAlertAllOfficers}>🔔 Alert All Officers</button>
        </div>
      </div>

      {/* Alert Tabs */}
      <div className="mla-section">
        <div className="alert-tabs">
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Alerts ({alertCounts.all})
          </button>
          <button
            className={`tab-btn ${activeTab === 'critical' ? 'active' : ''}`}
            onClick={() => setActiveTab('critical')}
          >
            Critical ({alertCounts.critical})
          </button>
          <button
            className={`tab-btn ${activeTab === 'high' ? 'active' : ''}`}
            onClick={() => setActiveTab('high')}
          >
            High ({alertCounts.high})
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
                <button type="button" className="btn-secondary" onClick={handleViewDetails}>View Details</button>
                <button type="button" className="btn-secondary" onClick={handleDispatchTeam}>Dispatch Team</button>
                <button type="button" className="btn-danger" onClick={handleEscalate}>Escalate</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Response Teams */}
      <div className="mla-section">
        <h2>Response Teams Status</h2>
        <div className="teams-grid">
          {responseTeams.length > 0 ? responseTeams.map((team, idx) => (
            <div key={idx} className="team-card">
              <div className="team-name">{team.name}</div>
              <div className={`team-status ${team.status}`}>{team.status}</div>
              <div className="team-units">{team.units} units</div>
            </div>
          )) : (
            <div className="team-card no-data">
              <div className="team-name">No response team data</div>
              <div className="team-status standby">standby</div>
              <div className="team-units">0 units</div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mla-section">
        <div className="detail-buttons">
          <button type="button" className="btn-danger" onClick={handleSendEmergencyBroadcast}>📢 Send Emergency Broadcast</button>
          <button type="button" className="btn-primary" onClick={handleCallMeeting}>📞 Call Emergency Meeting</button>
          <button type="button" className="btn-primary" onClick={handleViewResponseLogs}>📋 View Response Logs</button>
        </div>
      </div>
    </div>
  );
}

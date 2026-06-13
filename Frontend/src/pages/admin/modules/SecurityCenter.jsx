import React, { useState } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import '../../../styles/modules/SecurityCenter.css';
import PageHeader from "../../../components/PageHeader";

export default function SecurityCenter() {
  const [threats, setThreats] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [showSessionDetail, setShowSessionDetail] = useState(false);

  const [stats, setStats] = useState({
    failedLoginAttempts: '',
    activeSessions: '',
    lockedAccounts: '',
    apiErrors: '',
    suspiciousActivities: '',
  });

  const handleTerminateSession = (sessionId) => {
    console.log('Terminating session:', sessionId);
    // TODO: Call API
  };

  const handleRunSecurityScan = () => {
    console.log('Running security scan...');
    // TODO: Call API
  };

  return (
    <div>
      <PageHeader subtitle="Monitor security threats, access logs, and system health" />
      <div className="module-container">
      <div className="module-controls">
        <input type="text" placeholder="Search incidents, users, IPs..." />
        <select>
          <option value="ALL">All Threats</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <button className="btn-primary" onClick={handleRunSecurityScan}>
          🔍 Run Security Scan
        </button>
      </div>

      {/* Security Dashboard Widgets */}
      <div className="module-stats security-stats">
        <div className="stat-card alert-critical">
          <span className="stat-label">🚫 Failed Login Attempts</span>
          <span className="stat-value">{stats.failedLoginAttempts}</span>
        </div>
        <div className="stat-card alert-high">
          <span className="stat-label">👥 Active Sessions</span>
          <span className="stat-value">{stats.activeSessions}</span>
        </div>
        <div className="stat-card alert-medium">
          <span className="stat-label">🔒 Locked Accounts</span>
          <span className="stat-value">{stats.lockedAccounts}</span>
        </div>
        <div className="stat-card alert-critical">
          <span className="stat-label">⚠️ API Errors</span>
          <span className="stat-value">{stats.apiErrors}</span>
        </div>
        <div className="stat-card alert-high">
          <span className="stat-label">🚨 Suspicious Activities</span>
          <span className="stat-value">{stats.suspiciousActivities}</span>
        </div>
      </div>

      {/* Access Logs Table */}
      <div className="security-section" style={{ marginTop: '32px' }}>
        <h3>📋 Recent Security Events</h3>
        <div className="security-table">
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Event Type</th>
                <th>User/IP</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="6" className="no-data">No security events recorded</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Sessions Table */}
      <div className="security-section" style={{ marginTop: '32px' }}>
        <h3>👥 Active Sessions</h3>
        <div className="security-table">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>IP Address</th>
                <th>Login Time</th>
                <th>Last Activity</th>
                <th>Device</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="7" className="no-data">No active sessions</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Access Control List */}
      <div className="security-section" style={{ marginTop: '32px' }}>
        <h3>🔐 Access Control List</h3>
        <div className="security-table">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Modified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="6" className="no-data">No access control entries</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}

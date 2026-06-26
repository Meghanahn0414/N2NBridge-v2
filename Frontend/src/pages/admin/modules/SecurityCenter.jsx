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
      <PageHeader subtitle="Monitor security threats, access logs, and system health">
        <input type="text" placeholder="Search incidents, users, IPs..."
          style={{ flex: 1, minWidth: 200, padding: "9px 14px", border: "1px solid #EAEDF4", borderRadius: 10, fontSize: 13, fontFamily: "'Hanken Grotesk',sans-serif", background: "#F8F9FC", color: "#16233C", outline: "none" }} />
        <select style={{ padding: "9px 14px", border: "1px solid #EAEDF4", borderRadius: 10, fontSize: 13, fontFamily: "'Hanken Grotesk',sans-serif", background: "#F8F9FC", color: "#16233C", cursor: "pointer" }}>
          <option value="ALL">All Threats</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <button onClick={handleRunSecurityScan}
          style={{ padding: "9px 18px", borderRadius: 10, background: "#16233C", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Hanken Grotesk',sans-serif", whiteSpace: "nowrap" }}>
          🔍 Run Security Scan
        </button>
      </PageHeader>
      <div className="module-container">

      {/* Security Dashboard Widgets */}
      <div className="module-stats">
        {[
          { label: "Failed Logins",          value: stats.failedLoginAttempts  || "—", icon: "🚫", bg: "#FEF2F2" },
          { label: "Active Sessions",         value: stats.activeSessions        || "—", icon: "👥", bg: "#EEF2FF" },
          { label: "Locked Accounts",         value: stats.lockedAccounts        || "—", icon: "🔒", bg: "#FFF7ED" },
          { label: "API Errors",              value: stats.apiErrors             || "—", icon: "⚠️",  bg: "#FFFBEB" },
          { label: "Suspicious Activities",   value: stats.suspiciousActivities  || "—", icon: "🚨", bg: "#FEF2F2" },
        ].map(({ label, value, icon, bg }) => (
          <div key={label} style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 18, padding: "18px 20px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icon}</div>
              <span style={{ font: "600 12px 'Hanken Grotesk',system-ui,sans-serif", color: "#8590A6", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
            </div>
            <div style={{ fontFamily: "'Newsreader','Georgia',serif", fontSize: "clamp(22px,2.5vw,32px)", fontWeight: 400, color: "#16233C", lineHeight: 1.2 }}>{value}</div>
          </div>
        ))}
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

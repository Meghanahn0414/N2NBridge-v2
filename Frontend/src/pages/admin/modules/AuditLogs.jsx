import React, { useState } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import PageHeader from "../../../components/PageHeader";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ actionType: 'ALL', dateRange: 'LAST_7_DAYS' });

  const actionTypes = [
    'USER_CREATED',
    'USER_UPDATED',
    'USER_DELETED',
    'ROLE_CHANGED',
    'COMPLAINT_CREATED',
    'COMPLAINT_UPDATED',
    'CONFIG_CHANGED',
    'DATA_EXPORTED',
  ];

  return (
    <div>
      <PageHeader subtitle="Track all system changes and user actions for compliance">
        <select value={filters.actionType} onChange={(e) => setFilters({...filters, actionType: e.target.value})}
          style={{ padding: "9px 14px", border: "1px solid #EAEDF4", borderRadius: 10, fontSize: 13, fontFamily: "'Hanken Grotesk',sans-serif", background: "#F8F9FC", color: "#16233C", cursor: "pointer" }}>
          <option value="ALL">All Actions</option>
          {actionTypes.map(action => (
            <option key={action} value={action}>{action}</option>
          ))}
        </select>
        <select value={filters.dateRange} onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
          style={{ padding: "9px 14px", border: "1px solid #EAEDF4", borderRadius: 10, fontSize: 13, fontFamily: "'Hanken Grotesk',sans-serif", background: "#F8F9FC", color: "#16233C", cursor: "pointer" }}>
          <option value="LAST_7_DAYS">Last 7 Days</option>
          <option value="LAST_30_DAYS">Last 30 Days</option>
          <option value="LAST_90_DAYS">Last 90 Days</option>
          <option value="CUSTOM">Custom Range</option>
        </select>
        <input type="text" placeholder="Search by user, action, or resource..."
          style={{ flex: 1, minWidth: 180, padding: "9px 14px", border: "1px solid #EAEDF4", borderRadius: 10, fontSize: 13, fontFamily: "'Hanken Grotesk',sans-serif", background: "#F8F9FC", color: "#16233C", outline: "none" }} />
        <button style={{ padding: "9px 18px", borderRadius: 10, background: "#16233C", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Hanken Grotesk',sans-serif", whiteSpace: "nowrap" }}>
          📥 Export Logs
        </button>
      </PageHeader>
      <div className="module-container">

      <div className="module-stats">
        {[
          { label: "Total Actions", value: "—", icon: "🗂️", bg: "#EEF2FF" },
          { label: "Users Active",  value: "—", icon: "👤", bg: "#F0FDF4" },
          { label: "Changes Made",  value: "—", icon: "✏️", bg: "#FFF7ED" },
          { label: "Data Exports",  value: "—", icon: "📥", bg: "#F5F3FF" },
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

      <div className="audit-logs-table">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Role</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Details</th>
              <th>IP Address</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="8" className="no-data">
                No audit logs found. Actions will appear here as they happen.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="log-details">
        <h3>Log Details</h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="label">User Logins:</span>
            <span className="value"></span>
          </div>
          <div className="detail-item">
            <span className="label">Failed Attempts:</span>
            <span className="value"></span>
          </div>
          <div className="detail-item">
            <span className="label">Role Changes:</span>
            <span className="value"></span>
          </div>
          <div className="detail-item">
            <span className="label">Data Accessed:</span>
            <span className="value"></span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

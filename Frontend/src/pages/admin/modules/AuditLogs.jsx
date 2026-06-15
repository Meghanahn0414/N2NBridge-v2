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
      <PageHeader subtitle="Track all system changes and user actions for compliance" />
      <div className="module-container">
      <div className="module-controls">
        <select value={filters.actionType} onChange={(e) => setFilters({...filters, actionType: e.target.value})}>
          <option value="ALL">All Actions</option>
          {actionTypes.map(action => (
            <option key={action} value={action}>{action}</option>
          ))}
        </select>

        <select value={filters.dateRange} onChange={(e) => setFilters({...filters, dateRange: e.target.value})}>
          <option value="LAST_7_DAYS">Last 7 Days</option>
          <option value="LAST_30_DAYS">Last 30 Days</option>
          <option value="LAST_90_DAYS">Last 90 Days</option>
          <option value="CUSTOM">Custom Range</option>
        </select>

        <input type="text" placeholder="Search by user, action, or resource..." />
        <button className="btn-primary">📥 Export Logs</button>
      </div>

      <div className="module-stats">
        <div className="stat-card">
          <span className="stat-label">Total Actions</span>
          <span className="stat-value"></span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Users Active</span>
          <span className="stat-value"></span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Changes Made</span>
          <span className="stat-value"></span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Data Exports</span>
          <span className="stat-value"></span>
        </div>
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

import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';

export default function ComplaintManagement() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'ALL', category: 'ALL', priority: 'ALL' });

  const statuses = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'CLOSED'];
  const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const categories = ['Infrastructure', 'Safety', 'Health', 'Education', 'Utilities', 'Other'];

  // Dashboard stats
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    assigned: 0,
    escalated: 0,
    resolved: 0,
  });

  useEffect(() => {
    // TODO: Fetch complaints from API
    // fetchComplaints();
    setLoading(false);
  }, []);

  const getPriorityColor = (priority) => {
    const colors = {
      CRITICAL: '#ef4444',
      HIGH: '#f59e0b',
      MEDIUM: '#eab308',
      LOW: '#10b981',
    };
    return colors[priority] || '#6b7280';
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      OPEN: 'status-open',
      ASSIGNED: 'status-assigned',
      IN_PROGRESS: 'status-in-progress',
      ESCALATED: 'status-escalated',
      RESOLVED: 'status-resolved',
      CLOSED: 'status-closed',
    };
    return classes[status] || '';
  };

  const handleReassign = (complaintId) => {
    console.log('Reassigning complaint:', complaintId);
  };

  const handleEscalate = (complaintId) => {
    console.log('Escalating complaint:', complaintId);
  };

  const handleClose = (complaintId) => {
    console.log('Closing complaint:', complaintId);
  };

  const handleDownloadReport = (complaintId) => {
    console.log('Downloading report for complaint:', complaintId);
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h1>📋 Complaint Management</h1>
        <p>Monitor, manage, and resolve citizen complaints</p>
      </div>

      {/* Dashboard Stats */}
      <div className="module-stats complaint-stats">
        <div className="stat-card">
          <span className="stat-label">Total Complaints</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card alert-high">
          <span className="stat-label">Open</span>
          <span className="stat-value">{stats.open}</span>
        </div>
        <div className="stat-card alert-medium">
          <span className="stat-label">Assigned</span>
          <span className="stat-value">{stats.assigned}</span>
        </div>
        <div className="stat-card alert-critical">
          <span className="stat-label">Escalated</span>
          <span className="stat-value">{stats.escalated}</span>
        </div>
        <div className="stat-card alert-low">
          <span className="stat-label">Resolved</span>
          <span className="stat-value">{stats.resolved}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="module-controls">
        <input type="text" placeholder="Search by complaint ID, citizen name, ward..." />
        
        <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
          <option value="ALL">All Status</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={filters.priority} onChange={(e) => setFilters({...filters, priority: e.target.value})}>
          <option value="ALL">All Priority</option>
          {priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <button className="btn-primary">Export Report</button>
      </div>

      {/* Complaints Table */}
      {loading ? (
        <div className="loading">Loading complaints...</div>
      ) : (
        <div className="complaints-table">
          <table>
            <thead>
              <tr>
                <th>Complaint ID</th>
                <th>Citizen</th>
                <th>Category</th>
                <th>Ward</th>
                <th>Priority</th>
                <th>Assigned Officer</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="9" className="no-data">
                  No complaints found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

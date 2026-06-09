import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import { fetchGrievances, updateGrievance, assignGrievance } from '../../../features/grievances/grievanceService';

export default function ComplaintManagement() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: 'ALL', category: 'ALL', priority: 'ALL' });
  const [searchTerm, setSearchTerm] = useState('');

  const statuses = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED', 'REJECTED'];
  const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const categories = ['Infrastructure', 'Safety', 'Health', 'Education', 'Utilities', 'Other'];

  // Dashboard stats
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
  });

  // Fetch complaints from backend
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchGrievances(1, 1000, filters);
      setComplaints(data);
      calculateStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load complaints');
      console.error('Error loading complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (complaintsList) => {
    const total = complaintsList.length;
    const open = complaintsList.filter(c => c.status === 'NEW').length;
    const assigned = complaintsList.filter(c => c.status === 'ASSIGNED').length;
    const inProgress = complaintsList.filter(c => c.status === 'IN_PROGRESS').length;
    const resolved = complaintsList.filter(c => c.status === 'RESOLVED').length;
    
    setStats({ total, open: open, assigned, inProgress, resolved });
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleReassign = (complaintId) => {
    const officerId = prompt("Enter Officer ID:");
    if (officerId) {
      assignGrievance(complaintId, officerId)
        .then(() => fetchComplaints())
        .catch(err => setError(err.message));
    }
  };

  const handleEscalate = async (complaintId) => {
    try {
      await updateGrievance(complaintId, { status: 'IN_PROGRESS' });
      await fetchComplaints();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClose = async (complaintId) => {
    if (window.confirm('Are you sure you want to close this complaint?')) {
      try {
        await updateGrievance(complaintId, { status: 'RESOLVED' });
        await fetchComplaints();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleDownloadReport = (complaintId) => {
    console.log('Downloading report for complaint:', complaintId);
    // TODO: Implement report download
  };

  // Filter complaints based on search and filters
  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = !searchTerm || 
      (complaint._id && complaint._id.toString().includes(searchTerm)) ||
      (complaint.description && complaint.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (complaint.address && complaint.address.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filters.status === 'ALL' || complaint.status === filters.status;
    const matchesPriority = filters.priority === 'ALL' || complaint.priority === filters.priority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

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
      NEW: 'status-open',
      ASSIGNED: 'status-assigned',
      IN_PROGRESS: 'status-in-progress',
      ON_HOLD: 'status-on-hold',
      RESOLVED: 'status-resolved',
      CLOSED: 'status-closed',
      REJECTED: 'status-rejected',
    };
    return classes[status] || '';
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
          <span className="stat-label">In Progress</span>
          <span className="stat-value">{stats.inProgress}</span>
        </div>
        <div className="stat-card alert-low">
          <span className="stat-label">Resolved</span>
          <span className="stat-value">{stats.resolved}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="module-controls">
        <input 
          type="text" 
          placeholder="Search by complaint ID, description, address..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select 
          value={filters.status} 
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="ALL">All Status</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select 
          value={filters.priority} 
          onChange={(e) => setFilters({...filters, priority: e.target.value})}
        >
          <option value="ALL">All Priority</option>
          {priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <button 
          className="btn-primary" 
          onClick={fetchComplaints} 
          disabled={loading}
        >
          {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
        </button>
        <button className="btn-primary">Export Report</button>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* Complaints Table */}
      {loading ? (
        <div className="loading">Loading complaints...</div>
      ) : (
        <div className="complaints-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Complaint #</th>
                <th>Description</th>
                <th>Address</th>
                <th>Priority</th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data">
                    No complaints found.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((complaint) => (
                  <tr key={complaint._id || complaint.id}>
                    <td>{String(complaint._id || complaint.id).substring(0, 8)}</td>
                    <td>{complaint.complaintNumber || 'N/A'}</td>
                    <td>{complaint.description ? complaint.description.substring(0, 30) + '...' : 'N/A'}</td>
                    <td>{complaint.address || 'N/A'}</td>
                    <td>
                      <span style={{ 
                        color: getPriorityColor(complaint.priority),
                        fontWeight: 'bold'
                      }}>
                        {complaint.priority || 'N/A'}
                      </span>
                    </td>
                    <td>{complaint.assignedOfficerId ? String(complaint.assignedOfficerId).substring(0, 8) : 'Unassigned'}</td>
                    <td>
                      <span className={getStatusBadgeClass(complaint.status)}>
                        {complaint.status || 'NEW'}
                      </span>
                    </td>
                    <td>{complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => handleReassign(complaint._id)} title="Reassign">📤</button>
                        <button onClick={() => handleEscalate(complaint._id)} title="Escalate">📈</button>
                        <button onClick={() => handleClose(complaint._id)} title="Close">✓</button>
                        <button onClick={() => handleDownloadReport(complaint._id)} title="Download">⬇</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

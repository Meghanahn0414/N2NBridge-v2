import React, { useState, useEffect } from 'react';
import '../../styles/modules/ModulePageTemplate.css';
import { fetchAlerts, updateAlert } from '../../features/alerts/alertService';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: 'ALL', priority: 'ALL' });
  const [searchTerm, setSearchTerm] = useState('');

  const statuses = ['ACTIVE', 'RESOLVED', 'DISMISSED', 'ACKNOWLEDGED'];
  const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  // Dashboard stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    resolved: 0,
    critical: 0,
  });

  // Fetch alerts from backend
  const fetchAlertsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchAlerts(1, 100, filters);
      setAlerts(data);
      calculateStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load alerts');
      console.error('Error loading alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (alertsList) => {
    const total = alertsList.length;
    const active = alertsList.filter(a => a.status === 'ACTIVE').length;
    const resolved = alertsList.filter(a => a.status === 'RESOLVED').length;
    const critical = alertsList.filter(a => a.priority === 'CRITICAL').length;
    
    setStats({ total, active, resolved, critical });
  };

  useEffect(() => {
    fetchAlertsData();
  }, []);

  const handleAcknowledge = async (alertId) => {
    try {
      await updateAlert(alertId, { status: 'ACKNOWLEDGED' });
      await fetchAlertsData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await updateAlert(alertId, { status: 'RESOLVED' });
      await fetchAlertsData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDismiss = async (alertId) => {
    if (window.confirm('Are you sure you want to dismiss this alert?')) {
      try {
        await updateAlert(alertId, { status: 'DISMISSED' });
        await fetchAlertsData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Filter alerts based on search and filters
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = !searchTerm || 
      (alert._id && alert._id.toString().includes(searchTerm)) ||
      (alert.title && alert.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (alert.description && alert.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filters.status === 'ALL' || alert.status === filters.status;
    const matchesPriority = filters.priority === 'ALL' || alert.priority === filters.priority;
    
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
      ACTIVE: 'status-open',
      ACKNOWLEDGED: 'status-assigned',
      RESOLVED: 'status-resolved',
      DISMISSED: 'status-closed',
    };
    return classes[status] || '';
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h1>🚨 Alert Management</h1>
        <p>Monitor and Manage Active Alerts and Notifications</p>
      </div>

      {/* Dashboard Stats */}
      <div className="module-stats complaint-stats">
        <div className="stat-card">
          <span className="stat-label">Total Alerts</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card alert-high">
          <span className="stat-label">Active</span>
          <span className="stat-value">{stats.active}</span>
        </div>
        <div className="stat-card alert-critical">
          <span className="stat-label">Critical</span>
          <span className="stat-value">{stats.critical}</span>
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
          placeholder="Search by alert ID, title, description..." 
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
          onClick={fetchAlertsData} 
          disabled={loading}
        >
          {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* Alerts Table */}
      {loading ? (
        <div className="loading">Loading alerts...</div>
      ) : (
        <div className="complaints-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Description</th>
                <th>Priority</th>
                <th>Category</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">
                    No alerts found.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr key={alert._id || alert.id}>
                    <td>{String(alert._id || alert.id).substring(0, 8)}</td>
                    <td>{alert.title || 'N/A'}</td>
                    <td>{alert.description ? alert.description.substring(0, 30) + '...' : 'N/A'}</td>
                    <td>
                      <span style={{ 
                        color: getPriorityColor(alert.priority),
                        fontWeight: 'bold'
                      }}>
                        {alert.priority || 'N/A'}
                      </span>
                    </td>
                    <td>{alert.category || 'N/A'}</td>
                    <td>
                      <span className={getStatusBadgeClass(alert.status)}>
                        {alert.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td>{alert.createdAt ? new Date(alert.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => handleAcknowledge(alert._id)} title="Acknowledge">👁</button>
                        <button onClick={() => handleResolve(alert._id)} title="Resolve">✓</button>
                        <button onClick={() => handleDismiss(alert._id)} title="Dismiss">✕</button>
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

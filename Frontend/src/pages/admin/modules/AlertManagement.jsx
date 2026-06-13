import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import '../../../styles/modules/AlertManagement.css';
import PageHeader from "../../../components/PageHeader";
import { fetchAlerts, broadcastAlert } from '../../../features/alerts/alertService';

export default function AlertManagement() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ priority: 'ALL', status: 'ALL' });
  const [showBroadcast, setShowBroadcast] = useState(false);

  const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const statuses = ['ACTIVE', 'RESOLVED', 'DISMISSED'];

  // Real-Time Alert Board Data
  const [alertBoard, setAlertBoard] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  useEffect(() => {
    loadAlerts();
  }, [filters]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAlerts(1, 1000, filters);
      setAlerts(data);
      updateAlertBoard(data);
    } catch (err) {
      setError(err.message || 'Failed to load alerts');
      console.error('Error loading alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateAlertBoard = (alertList) => {
    const board = { critical: 0, high: 0, medium: 0, low: 0 };
    alertList.forEach(alert => {
      const priority = alert.priority?.toLowerCase();
      if (priority === 'critical') board.critical++;
      else if (priority === 'high') board.high++;
      else if (priority === 'medium') board.medium++;
      else if (priority === 'low') board.low++;
    });
    setAlertBoard(board);
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    // TODO: Implement broadcast functionality
    console.log('Broadcasting alert...');
    setShowBroadcast(false);
  };

  const handleAssignTeam = (alertId) => {
    console.log('Assigning team to alert:', alertId);
  };

  const handleMarkResolved = (alertId) => {
    console.log('Marking alert as resolved:', alertId);
  };

  return (
    <div>
      <PageHeader subtitle="Monitor and manage emergency alerts in real-time" />
      <div className="module-container">
      <div className="module-controls">
        <input type="text" placeholder="Search alerts by location, type, reporter..." />
        
        <select value={filters.priority} onChange={(e) => setFilters({...filters, priority: e.target.value})}>
          <option value="ALL">All Priority</option>
          {priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
          <option value="ALL">All Status</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <button className="btn-primary" onClick={() => setShowBroadcast(true)}>
          🔊 Broadcast Alert
        </button>
      </div>

      {/* Real-Time Alert Board Statistics */}
      <div className="module-stats alert-board-stats">
        <div className="stat-card alert-critical">
          <span className="stat-label">🔴 Critical Alerts</span>
          <span className="stat-value">{alertBoard.critical}</span>
        </div>
        <div className="stat-card alert-high">
          <span className="stat-label">🟠 High Priority</span>
          <span className="stat-value">{alertBoard.high}</span>
        </div>
        <div className="stat-card alert-medium">
          <span className="stat-label">🟡 Medium Priority</span>
          <span className="stat-value">{alertBoard.medium}</span>
        </div>
        <div className="stat-card alert-low">
          <span className="stat-label">🟢 Low Priority</span>
          <span className="stat-value">{alertBoard.low}</span>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="alerts-table" style={{ marginTop: '24px' }}>
        {loading ? (
          <div className="loading-state">Loading alerts...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>No alerts at this time. Stay vigilant!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Alert Type</th>
                <th>Location</th>
                <th>Priority</th>
                <th>Reporter</th>
                <th>Assigned Team</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(alert => (
                <tr key={alert._id || alert.id}>
                  <td>{alert.type || 'Emergency'}</td>
                  <td>
                    {typeof alert.location === 'object' && alert.location?.coordinates 
                      ? `${alert.location.coordinates[1]}, ${alert.location.coordinates[0]}` 
                      : (alert.location || '-')}
                  </td>
                  <td><span className="priority-badge" style={{color: alert.priority?.toLowerCase()}}>{alert.priority}</span></td>
                  <td>{alert.reporter || 'System'}</td>
                  <td>{alert.assignedTeam || 'Unassigned'}</td>
                  <td><span className="status-badge">{alert.status}</span></td>
                  <td>{alert.createdDate ? new Date(alert.createdDate).toLocaleDateString() : '-'}</td>
                  <td>
                    <button onClick={() => handleAssignTeam(alert._id || alert.id)}>👥</button>
                    <button onClick={() => handleMarkResolved(alert._id || alert.id)}>✓</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Broadcast Modal */}
      {showBroadcast && (
        <div className="modal-overlay" onClick={() => setShowBroadcast(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔊 Broadcast Emergency Alert</h2>
              <button className="modal-close" onClick={() => setShowBroadcast(false)}>×</button>
            </div>
            <form onSubmit={handleBroadcast}>
              <div className="form-group">
                <label>Alert Title *</label>
                <input type="text" placeholder="Brief title for the alert" required />
              </div>
              <div className="form-group">
                <label>Alert Message *</label>
                <textarea placeholder="Detailed alert message for citizens" required></textarea>
              </div>
              <div className="form-group">
                <label>Alert Type *</label>
                <select required>
                  <option value="">Select Type</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="WARNING">Warning</option>
                  <option value="INFORMATION">Information</option>
                  <option value="EVACUATION">Evacuation</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority Level *</label>
                <select required>
                  <option value="">Select Priority</option>
                  <option value="CRITICAL">🔴 Critical</option>
                  <option value="HIGH">🟠 High</option>
                  <option value="MEDIUM">🟡 Medium</option>
                  <option value="LOW">🟢 Low</option>
                </select>
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input type="text" placeholder="Affected area/location" required />
              </div>
              <div className="form-group">
                <label>Broadcast Channels</label>
                <div className="checkbox-group">
                  <label><input type="checkbox" defaultChecked /> SMS</label>
                  <label><input type="checkbox" defaultChecked /> WhatsApp</label>
                  <label><input type="checkbox" defaultChecked /> Email</label>
                  <label><input type="checkbox" defaultChecked /> Push Notification</label>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowBroadcast(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Broadcast Alert</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import '../../../styles/modules/AlertManagement.css';
import PageHeader from "../../../components/PageHeader";
import { fetchAlerts, broadcastAlert, updateAlert } from '../../../features/alerts/alertService';
import Pagination from '../../../components/Pagination';

const PAGE_SIZE = 100;

export default function AlertManagement() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ priority: 'ALL', status: 'ALL' });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    alertType: '',
    priority: '',
    description: '',
    location: null,
  });
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastError, setBroadcastError] = useState(null);

  const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const statuses = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

  // Real-Time Alert Board Data
  const [alertBoard, setAlertBoard] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  useEffect(() => { setPage(1); }, [filters]);
  useEffect(() => { loadAlerts(page); }, [page, filters]);

  const loadAlerts = async (targetPage = page) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAlerts(targetPage, PAGE_SIZE, filters);
      setAlerts(data);
      setHasMore(data.length >= PAGE_SIZE);
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
    setBroadcastLoading(true);
    setBroadcastError(null);
    try {
      await broadcastAlert(broadcastForm);
      setShowBroadcast(false);
      setBroadcastForm({ alertType: '', priority: '', description: '', location: null });
      await loadAlerts();
    } catch (err) {
      setBroadcastError(err.message || 'Failed to broadcast alert');
    } finally {
      setBroadcastLoading(false);
    }
  };

  const handleAssignTeam = async (alertId) => {
    const officerId = prompt('Enter officer ID to assign:');
    if (!officerId) return;
    try {
      await import('../../../features/alerts/alertService').then(({ default: svc, ...rest }) =>
        fetch(`/api/alerts/${alertId}/assign/${officerId}`, { method: 'POST' })
      );
      await loadAlerts();
    } catch (err) {
      console.error('Error assigning team:', err);
    }
  };

  const handleMarkResolved = async (alertId) => {
    try {
      await updateAlert(alertId, { status: 'RESOLVED' });
      await loadAlerts();
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  const formatLocation = (location) => {
    if (!location || typeof location !== 'object') return location || '-';
    if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
      const [lng, lat] = location.coordinates;
      return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
    }
    return typeof location.name === 'string' ? location.name : '-';
  };

  const formatText = (value, fallback = '-') => {
    if (value === null || value === undefined || value === '') return fallback;
    return typeof value === 'string' ? value : String(value);
  };

  return (
    <div>
      <PageHeader subtitle="Monitor and manage emergency alerts in real-time">
        <input type="text" placeholder="Search alerts by location, type, reporter…"
          style={{ flex: 1, minWidth: 200, padding: "9px 14px", border: "1px solid #EAEDF4", borderRadius: 10, fontSize: 13, fontFamily: "'Hanken Grotesk',sans-serif", background: "#F8F9FC", color: "#16233C", outline: "none" }} />
        <select value={filters.priority} onChange={(e) => setFilters({...filters, priority: e.target.value})}
          style={{ padding: "9px 14px", border: "1px solid #EAEDF4", borderRadius: 10, fontSize: 13, fontFamily: "'Hanken Grotesk',sans-serif", background: "#F8F9FC", color: "#16233C", cursor: "pointer" }}>
          <option value="ALL">All Priority</option>
          {priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}
          style={{ padding: "9px 14px", border: "1px solid #EAEDF4", borderRadius: 10, fontSize: 13, fontFamily: "'Hanken Grotesk',sans-serif", background: "#F8F9FC", color: "#16233C", cursor: "pointer" }}>
          <option value="ALL">All Status</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => setShowBroadcast(true)}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, background: "#16233C", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Hanken Grotesk',sans-serif", whiteSpace: "nowrap" }}>
          🔊 Broadcast Alert
        </button>
      </PageHeader>
      <div className="module-container">

      {/* Real-Time Alert Board Statistics */}
      <div className="module-stats alert-board-stats">
        {[
          { label: "Critical Alerts",  value: alertBoard.critical,  icon: "🚨", bg: "#FEF2F2" },
          { label: "High Priority",    value: alertBoard.high,      icon: "🔥", bg: "#FFF7ED" },
          { label: "Medium Priority",  value: alertBoard.medium,    icon: "⚠️",  bg: "#FFFBEB" },
          { label: "Low Priority",     value: alertBoard.low,       icon: "✅", bg: "#F0FDF4" },
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
                  <td>{formatText(alert.type || alert.alertType, 'Emergency')}</td>
                  <td>{formatLocation(alert.location)}</td>
                  <td>
                    <span className="priority-badge" style={{ color: String(alert.priority || '').toLowerCase() }}>
                      {formatText(alert.priority, 'LOW')}
                    </span>
                  </td>
                  <td>{formatText(alert.reporter || alert.citizenId, 'System')}</td>
                  <td>{formatText(alert.assignedTeam || alert.assignedTo, 'Unassigned')}</td>
                  <td><span className="status-badge">{formatText(alert.status, 'OPEN')}</span></td>
                  <td>{alert.createdAt ? new Date(alert.createdAt).toLocaleDateString() : (alert.createdDate ? new Date(alert.createdDate).toLocaleDateString() : '-')}</td>
                  <td>
                    <button onClick={() => handleAssignTeam(alert._id || alert.id)}>👥</button>
                    <button onClick={() => handleMarkResolved(alert._id || alert.id)}>✓</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination
          page={page}
          hasMore={hasMore}
          onPrev={() => setPage(p => p - 1)}
          onNext={() => setPage(p => p + 1)}
          loading={loading}
          pageSize={PAGE_SIZE}
        />
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
              {broadcastError && <div className="error-state" style={{ marginBottom: 12 }}>{broadcastError}</div>}
              <div className="form-group">
                <label>Alert Type *</label>
                <select
                  value={broadcastForm.alertType}
                  onChange={e => setBroadcastForm({ ...broadcastForm, alertType: e.target.value })}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="SECURITY">Security</option>
                  <option value="HEALTH">Health</option>
                  <option value="INFRASTRUCTURE">Infrastructure</option>
                  <option value="POLLUTION">Pollution</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority Level *</label>
                <select
                  value={broadcastForm.priority}
                  onChange={e => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}
                  required
                >
                  <option value="">Select Priority</option>
                  <option value="CRITICAL">🔴 Critical</option>
                  <option value="HIGH">🟠 High</option>
                  <option value="MEDIUM">🟡 Medium</option>
                  <option value="LOW">🟢 Low</option>
                </select>
              </div>
              <div className="form-group">
                <label>Alert Message *</label>
                <textarea
                  placeholder="Detailed alert message for citizens"
                  value={broadcastForm.description}
                  onChange={e => setBroadcastForm({ ...broadcastForm, description: e.target.value })}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowBroadcast(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={broadcastLoading}>
                  {broadcastLoading ? 'Broadcasting...' : 'Broadcast Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

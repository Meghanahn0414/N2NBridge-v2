import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import '../../../styles/modules/ComplaintManagement.css';
import PageHeader from "../../../components/PageHeader";
import { fetchGrievances, updateGrievance, assignGrievance } from '../../../features/grievances/grievanceService';
import { fetchUsers } from '../../../features/team-management/userService';
import Pagination from '../../../components/Pagination';

const PAGE_SIZE = 100;

export default function ComplaintManagement() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: 'ALL', priority: 'ALL' });
  const [searchTerm, setSearchTerm] = useState('');
  const [officers, setOfficers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Reassign modal
  const [reassignModal, setReassignModal] = useState(null); // complaint object
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [reassigning, setReassigning] = useState(false);

  // Status modal
  const [statusModal, setStatusModal] = useState(null); // complaint object
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  const statuses = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED', 'REJECTED'];
  const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const [stats, setStats] = useState({ total: 0, open: 0, assigned: 0, inProgress: 0, resolved: 0 });

  const loadComplaints = async (targetPage = page) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchGrievances(targetPage, PAGE_SIZE, filters);
      setComplaints(data);
      setHasMore(data.length >= PAGE_SIZE);
      calculateStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const loadOfficers = async () => {
    try {
      const data = await fetchUsers(1, 200, 'FIELD_OFFICER');
      setOfficers(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  };

  const calculateStats = (list) => {
    setStats({
      total: list.length,
      open: list.filter(c => c.status === 'NEW').length,
      assigned: list.filter(c => c.status === 'ASSIGNED').length,
      inProgress: list.filter(c => c.status === 'IN_PROGRESS').length,
      resolved: list.filter(c => c.status === 'RESOLVED').length,
    });
  };

  useEffect(() => { loadOfficers(); }, []);

  useEffect(() => { loadComplaints(page); }, [page]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
    loadComplaints(1);
  };

  // ── Reassign ──────────────────────────────────────────────
  const openReassign = (complaint) => {
    setReassignModal(complaint);
    setSelectedOfficer('');
  };

  const handleReassignConfirm = async () => {
    if (!selectedOfficer) return;
    try {
      setReassigning(true);
      await assignGrievance(reassignModal._id || reassignModal.id, selectedOfficer);
      setReassignModal(null);
      await loadComplaints();
    } catch (err) {
      setError(err.message || 'Reassign failed');
    } finally {
      setReassigning(false);
    }
  };

  // ── Status change ─────────────────────────────────────────
  const openStatusModal = (complaint) => {
    setStatusModal(complaint);
    setSelectedStatus(complaint.status || 'NEW');
  };

  const handleStatusConfirm = async () => {
    if (!selectedStatus) return;
    try {
      setStatusUpdating(true);
      await updateGrievance(statusModal._id || statusModal.id, { status: selectedStatus });
      setStatusModal(null);
      await loadComplaints();
    } catch (err) {
      setError(err.message || 'Status update failed');
    } finally {
      setStatusUpdating(false);
    }
  };

  // ── Resolve ───────────────────────────────────────────────
  const handleResolve = async (complaint) => {
    if (!window.confirm(`Mark complaint as RESOLVED?`)) return;
    try {
      await updateGrievance(complaint._id || complaint.id, { status: 'RESOLVED' });
      await loadComplaints();
    } catch (err) {
      setError(err.message || 'Failed to resolve');
    }
  };

  // ── Download CSV ──────────────────────────────────────────
  const handleDownload = (complaint) => {
    const id = complaint._id || complaint.id || '';
    const rows = [
      ['Field', 'Value'],
      ['ID', id],
      ['Complaint #', complaint.complaintNumber || ''],
      ['Description', (complaint.description || '').replace(/,/g, ' ')],
      ['Address', complaint.address || ''],
      ['Citizen', complaint.citizenName || complaint.citizenId || ''],
      ['Priority', complaint.priority || ''],
      ['Status', complaint.status || ''],
      ['Assigned To', complaint.assignedOfficerId || 'Unassigned'],
      ['Created Date', complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : ''],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complaint-${id.substring(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Filters ───────────────────────────────────────────────
  const filteredComplaints = complaints.filter(c => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q ||
      (c._id || '').toString().includes(q) ||
      (c.description || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q);
    const matchStatus = filters.status === 'ALL' || c.status === filters.status;
    const matchPriority = filters.priority === 'ALL' || c.priority === filters.priority;
    return matchSearch && matchStatus && matchPriority;
  });

  const getPriorityColor = (p) => ({ CRITICAL: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#eab308', LOW: '#10b981' }[p] || '#6b7280');

  const getStatusBadgeClass = (status) => ({
    NEW: 'status-open', ASSIGNED: 'status-assigned', IN_PROGRESS: 'status-in-progress',
    ON_HOLD: 'status-on-hold', RESOLVED: 'status-resolved', CLOSED: 'status-closed', REJECTED: 'status-rejected',
  }[status] || '');

  return (
    <div>
      <PageHeader subtitle="Monitor, manage, and resolve citizen complaints" />
      <div className="module-container">
      <div className="module-stats complaint-stats">
        <div className="stat-card"><span className="stat-label">Total</span><span className="stat-value">{stats.total}</span></div>
        <div className="stat-card alert-high"><span className="stat-label">Open</span><span className="stat-value">{stats.open}</span></div>
        <div className="stat-card alert-medium"><span className="stat-label">Assigned</span><span className="stat-value">{stats.assigned}</span></div>
        <div className="stat-card alert-critical"><span className="stat-label">In Progress</span><span className="stat-value">{stats.inProgress}</span></div>
        <div className="stat-card alert-low"><span className="stat-label">Resolved</span><span className="stat-value">{stats.resolved}</span></div>
      </div>

      <div className="module-controls">
        <input type="text" placeholder="Search by ID, description, address..."
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <select value={filters.status} onChange={e => handleFilterChange({ ...filters, status: e.target.value })}>
          <option value="ALL">All Status</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filters.priority} onChange={e => handleFilterChange({ ...filters, priority: e.target.value })}>
          <option value="ALL">All Priority</option>
          {priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button className="btn-primary" onClick={() => loadComplaints(page)} disabled={loading}>
          {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading">Loading complaints...</div>
      ) : (
        <div className="complaints-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Address</th>
                <th>Citizen</th>
                <th>Priority</th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.length === 0 ? (
                <tr><td colSpan="9" className="no-data">No complaints found.</td></tr>
              ) : filteredComplaints.map(complaint => {
                const id = complaint._id || complaint.id;
                const officer = officers.find(o => (o._id || o.id) === complaint.assignedOfficerId);
                return (
                  <tr key={id}>
                    <td>{String(id).substring(0, 8)}</td>
                    <td>{complaint.description ? complaint.description.substring(0, 30) + '...' : 'N/A'}</td>
                    <td>{complaint.address || 'N/A'}</td>
                    <td>{complaint.citizenName || (complaint.citizenId ? String(complaint.citizenId).substring(0, 8) : 'Unknown')}</td>
                    <td>
                      <span style={{ color: getPriorityColor(complaint.priority), fontWeight: 'bold' }}>
                        {complaint.priority || 'N/A'}
                      </span>
                    </td>
                    <td>{officer ? (officer.fullName || officer.email) : (complaint.assignedOfficerId ? String(complaint.assignedOfficerId).substring(0, 8) : 'Unassigned')}</td>
                    <td>
                      <span className={`complaint-status ${getStatusBadgeClass(complaint.status)}`}>
                        {complaint.status || 'NEW'}
                      </span>
                    </td>
                    <td>{complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action btn-reassign" onClick={() => openReassign(complaint)} title="Reassign Officer">
                          👤
                        </button>
                        <button className="btn-action btn-status" onClick={() => openStatusModal(complaint)} title="Change Status">
                          🔄
                        </button>
                        <button className="btn-action btn-resolve" onClick={() => handleResolve(complaint)} title="Mark Resolved"
                          disabled={complaint.status === 'RESOLVED' || complaint.status === 'CLOSED'}>
                          ✓
                        </button>
                        <button className="btn-action btn-download" onClick={() => handleDownload(complaint)} title="Download CSV">
                          ⬇
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        hasMore={hasMore}
        onPrev={() => setPage(p => p - 1)}
        onNext={() => setPage(p => p + 1)}
        loading={loading}
        pageSize={PAGE_SIZE}
      />

      {/* Reassign Modal */}
      {reassignModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setReassignModal(null)}>
          <div className="modal-content">
            <h2>👤 Reassign Complaint</h2>
            <p className="modal-subtitle">Complaint ID: <strong>{String(reassignModal._id || reassignModal.id).substring(0, 8)}</strong></p>
            <div className="form-group">
              <label>Select Officer</label>
              <select value={selectedOfficer} onChange={e => setSelectedOfficer(e.target.value)}>
                <option value="">— Choose an officer —</option>
                {officers.map(o => (
                  <option key={o._id || o.id} value={o._id || o.id}>
                    {o.fullName || o.email || o.mobile}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button onClick={() => setReassignModal(null)} disabled={reassigning}>Cancel</button>
              <button className="btn-primary" onClick={handleReassignConfirm}
                disabled={!selectedOfficer || reassigning}>
                {reassigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {statusModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setStatusModal(null)}>
          <div className="modal-content">
            <h2>🔄 Change Status</h2>
            <p className="modal-subtitle">Complaint ID: <strong>{String(statusModal._id || statusModal.id).substring(0, 8)}</strong></p>
            <div className="form-group">
              <label>Select New Status</label>
              <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                {statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-actions">
              <button onClick={() => setStatusModal(null)} disabled={statusUpdating}>Cancel</button>
              <button className="btn-primary" onClick={handleStatusConfirm} disabled={statusUpdating}>
                {statusUpdating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

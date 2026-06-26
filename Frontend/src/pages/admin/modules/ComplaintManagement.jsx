import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ComplaintManagement.css';
import { fetchGrievances, updateGrievance, assignGrievance } from '../../../features/grievances/grievanceService';
import { fetchUsers } from '../../../features/team-management/userService';
import Pagination from '../../../components/Pagination';
import { FaUserAlt, FaSyncAlt, FaCheck, FaDownload, FaExchangeAlt } from 'react-icons/fa';

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

  const KPI = [
    { label: "Total",       value: stats.total,      icon: "📋", iconBg: "#EEF2FF", sub: "All complaints" },
    { label: "Open",        value: stats.open,        icon: "🔴", iconBg: "#FEF2F2", sub: "Awaiting action" },
    { label: "Assigned",    value: stats.assigned,    icon: "👤", iconBg: "#FFF7ED", sub: "With officers" },
    { label: "In Progress", value: stats.inProgress,  icon: "⚙️",  iconBg: "#F5F3FF", sub: "Being worked on" },
    { label: "Resolved",    value: stats.resolved,    icon: "✅",  iconBg: "#F0FDF4", sub: "Successfully closed" },
  ];

  return (
    <div style={{ background: "#F3F5FA", minHeight: "100%", fontFamily: "'Hanken Grotesk',system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ padding: "28px 32px 0" }}>
        <p style={{ margin: 0, font: "500 13px 'Hanken Grotesk',sans-serif", color: "#8590A6" }}>Complaint Management</p>
        <h1 style={{ margin: "4px 0 2px", font: "400 30px 'Newsreader','Georgia',serif", color: "#16233C" }}>Grievance Overview</h1>
        <p style={{ margin: 0, font: "500 13px 'Hanken Grotesk',sans-serif", color: "#8590A6" }}>Monitor, manage, and resolve citizen complaints</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16, padding: "20px 32px 0" }}>
        {KPI.map(k => (
          <div key={k.label} style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 18, padding: "18px 20px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: k.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 17 }}>{k.icon}</div>
              <span style={{ font: "600 12px 'Hanken Grotesk',sans-serif", color: "#8590A6" }}>{k.label}</span>
            </div>
            <div style={{ fontFamily: "'Newsreader','Georgia',serif", fontSize: "clamp(22px,2.2vw,32px)", fontWeight: 400, color: "#16233C", lineHeight: 1.2, marginBottom: 4 }}>{k.value}</div>
            <div style={{ font: "500 12px 'Hanken Grotesk',sans-serif", color: "#8590A6" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "20px 32px 0" }}>

      {/* Filters */}
      <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 16, padding: "16px 20px", marginBottom: 16, display: "flex", gap: 12, alignItems: "center", boxShadow: "0 4px 12px -6px rgba(20,35,60,.1)" }}>
        <input type="text" placeholder="Search by ID, description, address…"
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: 1, border: "1px solid #EAEDF4", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontFamily: "'Hanken Grotesk',sans-serif", color: "#16233C", outline: "none", background: "#F8F9FC" }} />
        <select value={filters.status} onChange={e => handleFilterChange({ ...filters, status: e.target.value })}
          style={{ border: "1px solid #EAEDF4", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontFamily: "'Hanken Grotesk',sans-serif", color: "#16233C", background: "#F8F9FC", cursor: "pointer" }}>
          <option value="ALL">All Status</option>
          {statuses.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
        </select>
        <select value={filters.priority} onChange={e => handleFilterChange({ ...filters, priority: e.target.value })}
          style={{ border: "1px solid #EAEDF4", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontFamily: "'Hanken Grotesk',sans-serif", color: "#16233C", background: "#F8F9FC", cursor: "pointer" }}>
          <option value="ALL">All Priority</option>
          {priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={() => loadComplaints(page)} disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, background: "#16233C", color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Hanken Grotesk',sans-serif", opacity: loading ? 0.7 : 1 }}>
          <FaSyncAlt style={{ fontSize: 12 }} />{loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13 }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#8590A6", fontSize: 14 }}>Loading complaints…</div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 16, overflowX: "auto", boxShadow: "0 4px 12px -6px rgba(20,35,60,.1)" }}>
          <table style={{ width: "100%", minWidth: 900, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8F9FC", borderBottom: "1px solid #EAEDF4" }}>
                {["ID","Description","Address","Citizen","Priority","Assigned To","Status","Created Date","Actions"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", font: "700 11px 'Hanken Grotesk',sans-serif", color: "#8590A6", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.length === 0 ? (
                <tr><td colSpan="9" style={{ padding: 32, textAlign: "center", color: "#8590A6", fontSize: 14 }}>No complaints found.</td></tr>
              ) : filteredComplaints.map((complaint, rowIdx) => {
                const id = complaint._id || complaint.id;
                const officer = officers.find(o => (o._id || o.id) === complaint.assignedOfficerId);
                const tdStyle = { padding: "11px 14px", fontSize: 13, color: "#16233C", fontFamily: "'Hanken Grotesk',sans-serif", borderBottom: "1px solid #F3F5FA", whiteSpace: "nowrap" };
                return (
                  <tr key={id} style={{ background: rowIdx % 2 === 0 ? "#fff" : "#FAFBFD", transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F0F4FF"}
                    onMouseLeave={e => e.currentTarget.style.background = rowIdx % 2 === 0 ? "#fff" : "#FAFBFD"}
                  >
                    <td style={tdStyle} className="notranslate" translate="no">
                      <span style={{ font: "600 12px 'Hanken Grotesk',sans-serif", color: "#4F46E5" }}>{String(id).substring(0, 8)}</span>
                    </td>
                    <td style={tdStyle}>{complaint.description ? complaint.description.substring(0, 30) + '…' : 'N/A'}</td>
                    <td style={{ ...tdStyle, color: "#8590A6" }}>{complaint.address || 'N/A'}</td>
                    <td style={tdStyle} className="notranslate" translate="no">{complaint.citizenName || (complaint.citizenId ? String(complaint.citizenId).substring(0, 8) : 'Unknown')}</td>
                    <td style={tdStyle}>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: getPriorityColor(complaint.priority) + '18', color: getPriorityColor(complaint.priority) }}>
                        {complaint.priority || 'N/A'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: "#8590A6" }}>{officer ? (officer.fullName || officer.email) : (complaint.assignedOfficerId ? String(complaint.assignedOfficerId).substring(0, 8) : 'Unassigned')}</td>
                    <td style={tdStyle}>
                      <span className={`complaint-status ${getStatusBadgeClass(complaint.status)}`}>
                        {complaint.status?.replace('_', ' ') || 'NEW'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: "#8590A6" }}>{complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openReassign(complaint)} title="Reassign Officer"
                          style={{ width: 30, height: 30, borderRadius: 8, background: "#EEF2FF", border: "none", color: "#4F46E5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                          <FaUserAlt />
                        </button>
                        <button onClick={() => openStatusModal(complaint)} title="Change Status"
                          style={{ width: 30, height: 30, borderRadius: 8, background: "#FFF7ED", border: "none", color: "#EA580C", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                          <FaSyncAlt />
                        </button>
                        <button onClick={() => handleResolve(complaint)} title="Mark Resolved"
                          disabled={complaint.status === 'RESOLVED' || complaint.status === 'CLOSED'}
                          style={{ width: 30, height: 30, borderRadius: 8, background: "#F0FDF4", border: "none", color: "#16A34A", cursor: complaint.status === 'RESOLVED' || complaint.status === 'CLOSED' ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, opacity: complaint.status === 'RESOLVED' || complaint.status === 'CLOSED' ? 0.4 : 1 }}>
                          <FaCheck />
                        </button>
                        <button onClick={() => handleDownload(complaint)} title="Download CSV"
                          style={{ width: 30, height: 30, borderRadius: 8, background: "#F1F5F9", border: "none", color: "#64748B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                          <FaDownload />
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

      <div style={{ marginTop: 16, marginBottom: 32 }}>
        <Pagination
          page={page}
          hasMore={hasMore}
          onPrev={() => setPage(p => p - 1)}
          onNext={() => setPage(p => p + 1)}
          loading={loading}
          pageSize={PAGE_SIZE}
        />
      </div>

      </div>{/* /padding wrapper */}

      {/* Reassign Modal */}
      {reassignModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setReassignModal(null)}>
          <div className="modal-content">
            <h2><FaUserAlt style={{marginRight:7,verticalAlign:'middle',fontSize:18}} /> Reassign Complaint</h2>
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
            <h2><FaExchangeAlt style={{marginRight:7,verticalAlign:'middle',fontSize:18}} /> Change Status</h2>
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
  );
}

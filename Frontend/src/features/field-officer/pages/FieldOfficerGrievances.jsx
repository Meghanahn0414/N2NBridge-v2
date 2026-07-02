import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchGrievances, updateGrievance } from '../../grievances/grievanceService';
import { getCurrentUserId } from '../../complaints/complaintService';
import { ROUTES } from '../../../app/routes/RouteConstants';
import '../../../styles/field-officer.css';
import FieldPageHeader from '../components/FieldPageHeader';

// Backend statuses are Title Case with spaces ("Open", "Assigned",
// "In Progress", "Resolved", "Closed", "Rejected") — "Acknowledged" used to
// be a separate status but was folded into "Assigned" (a complaint is
// already shown as Assigned the moment it's assigned; a distinct
// "Acknowledged" step was redundant). Only Assigned/In Progress/Resolved/
// Closed are settable transitions via the PATCH endpoints (see
// grievanceService.js's updateGrievance).
const STATUS_OPTIONS = ['Assigned', 'In Progress', 'Resolved', 'Closed'];
// All statuses a grievance can actually be in, for the filter buttons
// (includes Open, which isn't officer-settable but does occur).
const FILTER_STATUSES = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected'];
const STATUS_COLORS = {
  Open: '#fef3c7',
  Assigned: '#ede9fe',
  'In Progress': '#dbeafe',
  Resolved: '#d1fae5',
  Closed: '#f3f4f6',
  Rejected: '#fee2e2',
};

export default function FieldOfficerGrievances() {
  const navigate = useNavigate();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updating, setUpdating] = useState(null);

  const officerId = getCurrentUserId();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchGrievances(1, 100, { assignedOfficerId: officerId });
      setGrievances(data || []);
    } catch (err) {
      setError('Failed to load grievances.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (grievanceId, newStatus) => {
    try {
      setUpdating(grievanceId);
      await updateGrievance(grievanceId, { status: newStatus });
      setGrievances(prev =>
        prev.map(g => (g._id === grievanceId || g.id === grievanceId) ? { ...g, status: newStatus } : g)
      );
    } catch (err) {
      alert(err?.response?.data?.detail || err?.message || 'Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = statusFilter === 'ALL' ? grievances : grievances.filter(g => g.status === statusFilter);

  return (
    <div className="field-subpage">
      <FieldPageHeader subtitle={`${grievances.length} grievance${grievances.length !== 1 ? 's' : ''} assigned to you`} />
      <div className="field-subpage-inner">
      <div style={{ marginBottom: '24px' }}>
          <h1>Assigned Grievances</h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total',       count: grievances.length,                                                                          icon: '📋', bg: '#EEF2FF' },
          { label: 'Open',        count: grievances.filter(g => ['Open', 'Assigned'].includes(g.status)).length,                     icon: '📂', bg: '#FEF3C7' },
          { label: 'In Progress', count: grievances.filter(g => g.status === 'In Progress').length,                                   icon: '⏳', bg: '#DBEAFE' },
          { label: 'Resolved',    count: grievances.filter(g => ['Resolved', 'Closed'].includes(g.status)).length,                   icon: '✅', bg: '#D1FAE5' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #EAEDF4', borderRadius: 18, padding: '18px 20px', boxShadow: '0 14px 30px -22px rgba(20,35,60,.3)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{s.icon}</div>
              <span style={{ font: "600 12px 'Hanken Grotesk',system-ui,sans-serif", color: '#8590A6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
            </div>
            <div style={{ fontFamily: "'Newsreader','Georgia',serif", fontSize: 'clamp(22px,2.5vw,32px)', fontWeight: 400, color: '#16233C', lineHeight: 1.2 }}>{s.count}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['ALL', ...FILTER_STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '6px 16px', borderRadius: '20px', border: '1px solid #e5e7eb',
              background: statusFilter === s ? '#1e293b' : '#fff',
              color: statusFilter === s ? '#fff' : '#374151',
              fontWeight: 600, fontSize: '13px', cursor: 'pointer',
            }}
          >{s === 'ALL' ? 'All' : s.replace('_', ' ')}</button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading...</div>}
      {error && <div style={{ color: '#ef4444', padding: '16px', background: '#fef2f2', borderRadius: '8px' }}>{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
          <p>No grievances {statusFilter !== 'ALL' ? `with status "${statusFilter}"` : 'assigned to you'}.</p>
        </div>
      )}

      {!loading && filtered.map(g => {
        const id = g._id || g.id;
        return (
          <div key={id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px', marginBottom: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{g.description ? g.description.slice(0, 80) + (g.description.length > 80 ? '…' : '') : 'No description'}</span>
                  <span style={{
                    padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                    background: STATUS_COLORS[g.status] || '#f3f4f6', color: '#374151',
                  }}>{g.status}</span>
                  {g.priority && (
                    <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '12px', background: g.priority === 'HIGH' ? '#fee2e2' : '#f3f4f6', color: '#374151' }}>
                      {g.priority}
                    </span>
                  )}
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {g.category && <span>📌 {g.category.replace(/_/g, ' ')}</span>}
                  {g.address && <span>📍 {g.address}</span>}
                  {g.complaintNumber && <span style={{ fontFamily: 'monospace' }}>#{g.complaintNumber}</span>}
                  {g.created_at && <span>Filed: {new Date(g.created_at).toLocaleDateString()}</span>}
                </div>
              </div>
              <div style={{ minWidth: '160px' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Update Status</label>
                <select
                  value={g.status}
                  disabled={updating === id}
                  onChange={e => handleStatusChange(id, e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', cursor: 'pointer' }}
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

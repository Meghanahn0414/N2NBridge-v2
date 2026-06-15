import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchGrievances, updateGrievance } from '../../grievances/grievanceService';
import { getCurrentUserId } from '../../complaints/complaintService';
import { ROUTES } from '../../../app/routes/RouteConstants';
import '../../../styles/field-officer.css';
import FieldPageHeader from '../components/FieldPageHeader';

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const STATUS_COLORS = {
  OPEN: '#fef3c7',
  IN_PROGRESS: '#dbeafe',
  RESOLVED: '#d1fae5',
  CLOSED: '#f3f4f6',
  REJECTED: '#fee2e2',
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
      const data = await fetchGrievances(1, 1000, { assignedOfficerId: officerId });
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
    } catch {
      alert('Failed to update status.');
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total', count: grievances.length, color: '#6366f1' },
          { label: 'Open', count: grievances.filter(g => g.status === 'OPEN').length, color: '#f59e0b' },
          { label: 'In Progress', count: grievances.filter(g => g.status === 'IN_PROGRESS').length, color: '#3b82f6' },
          { label: 'Resolved', count: grievances.filter(g => g.status === 'RESOLVED').length, color: '#10b981' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.count}</div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['ALL', ...STATUS_OPTIONS].map(s => (
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
                  {g.createdAt && <span>Filed: {new Date(g.createdAt).toLocaleDateString()}</span>}
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

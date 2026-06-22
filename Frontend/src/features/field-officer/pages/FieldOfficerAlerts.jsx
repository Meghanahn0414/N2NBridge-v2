import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../shared/services/api';
import { ROUTES } from '../../../app/routes/RouteConstants';
import '../../../styles/field-officer.css';
import FieldPageHeader from '../components/FieldPageHeader';

const PRIORITY_COLORS = { HIGH: '#fee2e2', MEDIUM: '#fef3c7', LOW: '#f0fdf4', CRITICAL: '#fce7f3' };
const STATUS_COLORS = { ACTIVE: '#fee2e2', ACKNOWLEDGED: '#fef3c7', RESOLVED: '#d1fae5' };

export default function FieldOfficerAlerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [acknowledging, setAcknowledging] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/alerts/', { params: { page: 1, per_page: 100 } });
      const data = Array.isArray(res.data) ? res.data : res.data?.data?.alerts || res.data?.alerts || [];
      setAlerts(data);
    } catch (err) {
      setError('Failed to load alerts.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      setAcknowledging(alertId);
      await api.put(`/api/alerts/${alertId}`, { status: 'ACKNOWLEDGED' });
      setAlerts(prev => prev.map(a => (a._id === alertId || a.id === alertId) ? { ...a, status: 'ACKNOWLEDGED' } : a));
    } catch {
      alert('Failed to acknowledge alert.');
    } finally {
      setAcknowledging(null);
    }
  };

  const handleResolve = async (alertId) => {
    if (!window.confirm('Mark this alert as resolved?')) return;
    try {
      setAcknowledging(alertId);
      await api.put(`/api/alerts/${alertId}`, { status: 'RESOLVED' });
      setAlerts(prev => prev.map(a => (a._id === alertId || a.id === alertId) ? { ...a, status: 'RESOLVED' } : a));
    } catch {
      alert('Failed to resolve alert.');
    } finally {
      setAcknowledging(null);
    }
  };

  const filtered = statusFilter === 'ALL' ? alerts : alerts.filter(a => a.status === statusFilter);
  const activeCount = alerts.filter(a => a.status === 'ACTIVE').length;

  return (
    <div className="field-subpage">
      <FieldPageHeader subtitle={activeCount > 0 ? `${activeCount} active alert${activeCount > 1 ? 's' : ''} need attention` : 'No active alerts'} />
      <div className="field-subpage-inner">
      <div style={{ marginBottom: '24px' }}>
          <h1>Emergency Alerts</h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Active', count: alerts.filter(a => a.status === 'ACTIVE').length, color: '#ef4444' },
          { label: 'Acknowledged', count: alerts.filter(a => a.status === 'ACKNOWLEDGED').length, color: '#f59e0b' },
          { label: 'Resolved', count: alerts.filter(a => a.status === 'RESOLVED').length, color: '#10b981' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.count}</div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{
              padding: '6px 16px', borderRadius: '20px', border: '1px solid #e5e7eb',
              background: statusFilter === s ? '#1e293b' : '#fff',
              color: statusFilter === s ? '#fff' : '#374151',
              fontWeight: 600, fontSize: '13px', cursor: 'pointer',
            }}
          >{s === 'ALL' ? 'All' : s}</button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading alerts...</div>}
      {error && <div style={{ color: '#ef4444', padding: '16px', background: '#fef2f2', borderRadius: '8px' }}>{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚨</div>
          <p>No {statusFilter !== 'ALL' ? statusFilter.toLowerCase() : ''} alerts.</p>
        </div>
      )}

      {!loading && filtered.map((alert) => {
        const id = alert._id || alert.id;
        return (
          <div key={id} style={{ background: '#fff', border: `1px solid ${alert.status === 'ACTIVE' ? '#fca5a5' : '#e2e8f0'}`, borderRadius: '14px', padding: '20px', marginBottom: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '20px' }}>🚨</span>
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>{alert.emergencyType || alert.type || 'Emergency Alert'}</span>
                  <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, background: STATUS_COLORS[alert.status] || '#f3f4f6', color: '#374151' }}>
                    {alert.status}
                  </span>
                  {alert.priority && (
                    <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '12px', background: PRIORITY_COLORS[alert.priority] || '#f3f4f6', color: '#374151' }}>
                      {alert.priority}
                    </span>
                  )}
                </div>
                <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '14px' }}>{alert.description || alert.message || 'No description'}</p>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
                  {alert.location && <span>📍 {alert.location} · </span>}
                  {alert.createdAt && <span>Reported: {new Date(alert.createdAt).toLocaleString()}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' }}>
                {alert.status === 'ACTIVE' && (
                  <button
                    disabled={acknowledging === id}
                    onClick={() => handleAcknowledge(id)}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                  >Acknowledge</button>
                )}
                {(alert.status === 'ACTIVE' || alert.status === 'ACKNOWLEDGED') && (
                  <button
                    disabled={acknowledging === id}
                    onClick={() => handleResolve(id)}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                  >Resolve</button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

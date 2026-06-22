import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTasks, updateTask } from '../../tasks/taskService';
import { getCurrentUserId } from '../../complaints/complaintService';
import { ROUTES } from '../../../app/routes/RouteConstants';

const STATUS_OPTIONS = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const STATUS_COLORS = {
  PENDING: '#fef3c7',
  IN_PROGRESS: '#dbeafe',
  COMPLETED: '#d1fae5',
  CANCELLED: '#f3f4f6',
};
const PRIORITY_COLORS = { HIGH: '#fee2e2', MEDIUM: '#fef3c7', LOW: '#f0fdf4', CRITICAL: '#fce7f3' };

export default function FieldOfficerTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
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
      const data = await fetchTasks(1, 100, { assignedTo: officerId });
      setTasks(data || []);
    } catch {
      setError('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setUpdating(taskId);
      await updateTask(taskId, { status: newStatus });
      setTasks(prev =>
        prev.map(t => (t._id === taskId || t.id === taskId) ? { ...t, status: newStatus } : t)
      );
    } catch {
      alert('Failed to update task status.');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = statusFilter === 'ALL' ? tasks : tasks.filter(t => t.status === statusFilter);

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate(ROUTES.field)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>←</button>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>My Tasks</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>{tasks.length} tasks assigned to you</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total', count: tasks.length, color: '#6366f1' },
          { label: 'Pending', count: tasks.filter(t => t.status === 'PENDING').length, color: '#f59e0b' },
          { label: 'In Progress', count: tasks.filter(t => t.status === 'IN_PROGRESS').length, color: '#3b82f6' },
          { label: 'Completed', count: tasks.filter(t => t.status === 'COMPLETED').length, color: '#10b981' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{s.label}</div>
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
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <p>No tasks {statusFilter !== 'ALL' ? `with status "${statusFilter}"` : 'assigned to you'}.</p>
        </div>
      )}

      {!loading && filtered.map(t => {
        const id = t._id || t.id;
        return (
          <div key={id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>{t.title || t.taskName || 'Untitled Task'}</span>
                  <span style={{
                    padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                    background: STATUS_COLORS[t.status] || '#f3f4f6', color: '#374151',
                  }}>{t.status}</span>
                  {t.priority && (
                    <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '12px', background: PRIORITY_COLORS[t.priority] || '#f3f4f6', color: '#374151' }}>
                      {t.priority}
                    </span>
                  )}
                </div>
                <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '14px' }}>{t.description || 'No description'}</p>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
                  {t.dueDate && <span>Due: {new Date(t.dueDate).toLocaleDateString()} · </span>}
                  {t.createdAt && <span>Created: {new Date(t.createdAt).toLocaleDateString()}</span>}
                </div>
              </div>
              <div style={{ minWidth: '160px' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Update Status</label>
                <select
                  value={t.status}
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
  );
}

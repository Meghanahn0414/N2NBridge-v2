import React, { useEffect, useState } from 'react';
import api from '../../shared/services/api';
import './NewMLA.css';

export default function AdminUsers(){
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users/', { params: { per_page: 100, role: 'CITIZEN' } });
      if (res.data) {
        const list = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : res.data);
        setUsers(list);
      }
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-mla-container">
      <div className="new-mla-card">
        <div className="new-mla-header">
          <h1 className="new-mla-title">CITIZENS</h1>
          <p className="new-mla-subtitle">All registered citizens in the system</p>
        </div>
        <div style={{ padding: 30 }}>
          {loading && <div>Loading...</div>}
          {error && <div className="new-mla-alert new-mla-alert--error">{error}</div>}
          {!loading && !error && (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {users.map((u) => (
                <li key={u._id || u.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{u.fullName || u.name}</div>
                      <div style={{ color: '#666' }}>{u.email} · {u.mobile} · {u.role}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

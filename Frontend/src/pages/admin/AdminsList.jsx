import React, { useEffect, useState } from 'react';
import api from '../../shared/services/api';
import './NewMLA.css';

export default function AdminsList(){
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/api/users/', { params: { role: 'ADMIN', per_page: 100 } });
      // Backend wraps results as { items, total, page, per_page } under .data.
      const list = res.data?.data?.items ?? [];
      setAdmins(list);
    }catch(err){
      console.error('AdminsList fetch error', err);
      const message = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to load admins';
      setError(message);
    } finally{ setLoading(false); }
  };

  return (
    <div className="new-mla-container">
      <div className="new-mla-card">
        <div className="new-mla-header">
          <h1 className="new-mla-title">Admins</h1>
          <p className="new-mla-subtitle">All Registered Admins in the System</p>
        </div>
        <div style={{ padding: 30 }}>
          {loading && <div>Loading...</div>}
          {error && <div className="new-mla-alert new-mla-alert--error">{error}</div>}
          {!loading && !error && (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {admins.map((admin) => (
                <li key={admin._id || admin.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{admin.fullName || admin.name}</div>
                      <div style={{ color: '#666' }}>{admin.email} · {admin.mobile} · {admin.role}</div>
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

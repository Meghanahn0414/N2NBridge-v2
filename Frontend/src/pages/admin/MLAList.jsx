import React, { useEffect, useState } from 'react';
import api from '../../shared/services/api';
import "./NewMLA.css";

export default function MLAList(){
  const [mlas, setMlas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(()=>{ fetchMLAs(); },[]);

  const fetchMLAs = async ()=>{
    try{
      const res = await api.get('/api/users/', { params: { role: 'REPRESENTATIVE', per_page: 100 } });
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      setMlas(list);
    }catch(err){
      console.error('MLAList fetch error', err);
      const message = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to load MLAs';
      setError(message);
    } finally{ setLoading(false); }
  };

  return (
    <div className="new-mla-container">
      <div className="new-mla-card">
        <div className="new-mla-header">
          <h1 className="new-mla-title">MLA List</h1>
          <p className="new-mla-subtitle">Registered Representatives</p>
        </div>
        <div style={{ padding: 30 }}>
          {loading && <div>Loading...</div>}
          {!loading && (
            <>
              {error && <div className="new-mla-alert new-mla-alert--error">{error}</div>}
              {!error && (
            <div style={{ overflowX: 'auto' }}>
              {mlas.length === 0 ? (
                <div>No MLAs registered yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e5e7eb' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e5e7eb' }}>Email</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e5e7eb' }}>Mobile</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e5e7eb' }}>Constituency</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e5e7eb' }}>District</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e5e7eb' }}>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mlas.map((m) => (
                      <tr key={m._id || m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 16px' }}>{m.fullName || m.name || '-'}</td>
                        <td style={{ padding: '12px 16px' }}>{m.email || '-'}</td>
                        <td style={{ padding: '12px 16px' }}>{m.mobile || '-'}</td>
                        <td style={{ padding: '12px 16px' }}>{m.constituencyId || m.constituency || '-'}</td>
                        <td style={{ padding: '12px 16px' }}>{m.district || '-'}</td>
                        <td style={{ padding: '12px 16px' }}>{m.role || 'Representative'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}

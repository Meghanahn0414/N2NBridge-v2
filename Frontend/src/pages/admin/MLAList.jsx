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
      const res = await api.get('/api/users', { params: { role: 'REPRESENTATIVE', per_page: 100 } });
      if(res.data && Array.isArray(res.data.data)) setMlas(res.data.data);
    }catch(err){ setError('Failed to load MLAs'); }
    finally{ setLoading(false); }
  };

  return (
    <div className="new-mla-container">
      <div className="new-mla-card">
        <div className="new-mla-header">
          <h1 className="new-mla-title">MLA List</h1>
          <p className="new-mla-subtitle">Registered representatives</p>
        </div>
        <div style={{padding:30}}>
          {loading && <div>Loading...</div>}
          {error && <div className="new-mla-alert new-mla-alert--error">{error}</div>}
          {!loading && !error && (
            <ul style={{listStyle:'none', padding:0}}>
              {mlas.map(m=> (
                <li key={m._id || m.id} style={{padding:'12px 0', borderBottom:'1px solid #eee'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                      <div style={{fontWeight:700}}>{m.fullName || m.name}</div>
                      <div style={{color:'#666'}}>{m.email} · {m.mobile}</div>
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

import React, { useEffect, useState } from 'react';
import api from '../../../shared/services/api';
import '../../../pages/admin/NewMLA.css';

export default function EventList(){
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/api/events/', { params: { per_page: 100 } });
      if (res.data) {
        const list = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : res.data);
        setEvents(list);
      }
    } catch (err) {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-mla-container">
      <div className="new-mla-card">
        <div className="new-mla-header">
          <h1 className="new-mla-title">EVENTS</h1>
          <p className="new-mla-subtitle">All registered events in the system</p>
        </div>
        <div style={{ padding: 30 }}>
          {loading && <div>Loading...</div>}
          {error && <div className="new-mla-alert new-mla-alert--error">{error}</div>}
          {!loading && !error && (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {events.map((e) => (
                <li key={e._id || e.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{e.title || e.name}</div>
                      <div style={{ color: '#666' }}>{e.description} · {e.date}</div>
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

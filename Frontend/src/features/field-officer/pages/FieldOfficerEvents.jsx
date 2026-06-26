import React, { useState, useEffect } from 'react';
import api from '../../../shared/services/api';
import '../../../styles/field-officer.css';
import FieldPageHeader from '../components/FieldPageHeader';

const TYPE_META = {
  PUBLIC_MEETING:   { icon: '🏛️', color: '#2563eb', bg: '#eff6ff' },
  COMMUNITY_EVENT:  { icon: '🤝', color: '#7c3aed', bg: '#f5f3ff' },
  HEALTH_CAMP:      { icon: '🏥', color: '#059669', bg: '#ecfdf5' },
  AWARENESS_DRIVE:  { icon: '📢', color: '#d97706', bg: '#fffbeb' },
  INAUGURATION:     { icon: '🎗️', color: '#db2777', bg: '#fdf2f8' },
  OTHER:            { icon: '📌', color: '#475569', bg: '#f1f5f9' },
};

const STATUS_META = {
  UPCOMING:   { label: 'Upcoming',   bg: '#dbeafe', text: '#1d4ed8' },
  ONGOING:    { label: 'Ongoing',    bg: '#dcfce7', text: '#166534' },
  COMPLETED:  { label: 'Completed',  bg: '#f1f5f9', text: '#475569' },
  CANCELLED:  { label: 'Cancelled',  bg: '#fee2e2', text: '#991b1b' },
};

export default function FieldOfficerEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/api/events/', { params: { page: 1, per_page: 100 } })
      .then(res => {
        const data = res.data?.data?.events || res.data?.events || res.data || [];
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch(() => setError('Failed to load events.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter(e => {
    const matchStatus = filter === 'ALL' || e.status === filter;
    const matchSearch = !search || (e.title || e.name || '').toLowerCase().includes(search.toLowerCase()) || (e.location || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const upcoming  = events.filter(e => e.status === 'UPCOMING').length;
  const ongoing   = events.filter(e => e.status === 'ONGOING').length;
  const completed = events.filter(e => e.status === 'COMPLETED').length;

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const formatTime = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const subtitle = upcoming > 0 ? `${upcoming} upcoming event${upcoming > 1 ? 's' : ''}` : `${events.length} total events`;

  return (
    <div className="field-subpage">
      <FieldPageHeader subtitle={subtitle} />

      <div className="field-subpage-inner">

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Upcoming',  value: upcoming,  icon: '🗓️', bg: '#EEF2FF' },
            { label: 'Ongoing',   value: ongoing,   icon: '▶️',  bg: '#ECFDF5' },
            { label: 'Completed', value: completed, icon: '✅', bg: '#F1F5F9' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #EAEDF4', borderRadius: 18, padding: '18px 20px', boxShadow: '0 14px 30px -22px rgba(20,35,60,.3)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{s.icon}</div>
                <span style={{ font: "600 12px 'Hanken Grotesk',system-ui,sans-serif", color: '#8590A6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
              </div>
              <div style={{ fontFamily: "'Newsreader','Georgia',serif", fontSize: 'clamp(22px,2.5vw,32px)', fontWeight: 400, color: '#16233C', lineHeight: 1.2 }}>{loading ? '—' : s.value}</div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#94a3b8' }}>🔍</span>
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', background: '#fff' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['ALL', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                style={{
                  padding: '7px 16px', borderRadius: '20px', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                  background: filter === s ? '#1e293b' : '#fff',
                  color: filter === s ? '#fff' : '#374151',
                }}
              >{s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}</button>
            ))}
          </div>
        </div>

        {/* State indicators */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
            <p style={{ fontSize: '14px' }}>Loading events...</p>
          </div>
        )}
        {error && (
          <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#dc2626', fontSize: '13px' }}>{error}</div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
            <p style={{ fontSize: '14px', fontWeight: 600 }}>No events found</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>{filter !== 'ALL' ? `No ${filter.toLowerCase()} events.` : 'No events have been scheduled yet.'}</p>
          </div>
        )}

        {/* Event cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!loading && filtered.map((event, i) => {
            const id = event._id || event.id || i;
            const type = event.eventType || event.type || 'OTHER';
            const tm = TYPE_META[type] || TYPE_META.OTHER;
            const sm = STATUS_META[event.status] || STATUS_META.UPCOMING;
            const title = event.title || event.name || 'Untitled Event';
            const location = event.location || event.venue || '';
            const startDate = event.startDate || event.date || event.scheduledDate;
            const endDate = event.endDate;
            const attendees = event.expectedAttendees || event.attendees || null;
            const organizer = event.organizer || event.organizerName || '';
            const description = event.description || '';

            return (
              <div key={id} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '14px', flex: 1, minWidth: 0 }}>
                    {/* Icon */}
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: tm.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                      {tm.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{title}</h3>
                        <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: sm.bg, color: sm.text }}>
                          {sm.label}
                        </span>
                        <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: tm.bg, color: tm.color }}>
                          {(type).replace(/_/g, ' ')}
                        </span>
                      </div>

                      {description && (
                        <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                          {description.length > 120 ? description.slice(0, 120) + '…' : description}
                        </p>
                      )}

                      {/* Meta row */}
                      <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
                        {startDate && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b' }}>
                            <span>🗓️</span>
                            <span>{formatDate(startDate)}{endDate && endDate !== startDate ? ` – ${formatDate(endDate)}` : ''}</span>
                          </div>
                        )}
                        {startDate && formatTime(startDate) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b' }}>
                            <span>🕐</span>
                            <span>{formatTime(startDate)}</span>
                          </div>
                        )}
                        {location && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b' }}>
                            <span>📍</span>
                            <span>{location}</span>
                          </div>
                        )}
                        {attendees && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b' }}>
                            <span>👥</span>
                            <span>{attendees} expected</span>
                          </div>
                        )}
                        {organizer && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b' }}>
                            <span>👤</span>
                            <span>{organizer}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

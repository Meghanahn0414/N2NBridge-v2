import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../shared/services/api';
import { ROUTES } from '../../../app/routes/RouteConstants';
import '../../../styles/field-officer.css';
import FieldPageHeader from '../components/FieldPageHeader';

export default function FieldOfficerProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/users/me')
      .then(res => setProfile(res.data))
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const joinedDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—';

  return (
    <div className="field-subpage">
      <FieldPageHeader subtitle="Your account information" />
      <div style={{ padding: '28px 32px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>My Profile</h1>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading...</div>}
      {error && <div style={{ color: '#ef4444', padding: '16px', background: '#fef2f2', borderRadius: '8px' }}>{error}</div>}

      {profile && (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '32px' }}>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#fff', fontWeight: 700 }}>
              {(profile.fullName || profile.username || 'O')[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{profile.fullName || profile.username || '—'}</h2>
              <span style={{ display: 'inline-block', marginTop: '6px', padding: '3px 12px', borderRadius: '12px', background: '#dbeafe', color: '#1e40af', fontSize: '12px', fontWeight: 600 }}>
                {profile.role || 'FIELD_OFFICER'}
              </span>
            </div>
          </div>

          {/* Fields */}
          {[
            { label: 'Full Name', value: profile.fullName },
            { label: 'Email', value: profile.email },
            { label: 'Mobile', value: profile.mobile },
            { label: 'Address', value: profile.address },
            { label: 'Constituency', value: profile.constituencyId },
            { label: 'Ward', value: profile.wardId },
            { label: 'Status', value: profile.status },
            { label: 'Member Since', value: joinedDate },
          ].map(({ label, value }) => value ? (
            <div key={label} style={{ display: 'flex', gap: '16px', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ width: '140px', color: '#6b7280', fontSize: '13px', fontWeight: 600, flexShrink: 0 }}>{label}</span>
              <span style={{ color: '#1e293b', fontSize: '13px' }}>{value}</span>
            </div>
          ) : null)}
        </div>
      )}
      </div>
    </div>
  );
}

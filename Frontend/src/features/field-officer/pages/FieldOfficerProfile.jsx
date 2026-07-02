import React, { useState, useEffect, useRef } from 'react';
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
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get('/api/users/me')
      // Backend wraps every payload as { success, message, data, ... } and
      // this fetch-based api client passes that whole envelope through as
      // res.data — the actual profile fields are at res.data.data. Reading
      // res.data directly (as before) meant every field on this page was
      // undefined, showing blank name/email/mobile/etc.
      .then(res => setProfile(res.data?.data ?? res.data))
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const handlePhotoClick = () => {
    if (!photoUploading) fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    setPhotoError('');
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // POST /api/users/{id}/upload-profile-photo — falls back to db.staff
      // when the id isn't a representative, so this works for Field
      // Officers/Managers too, not just representatives.
      const res = await api.post(`/api/users/${profile.id}/upload-profile-photo`, formData);
      const data = res.data?.data ?? res.data;
      if (data?.profileImage) {
        setProfile((prev) => ({ ...prev, profileImage: data.profileImage }));
      }
    } catch (err) {
      setPhotoError('Failed to upload photo. Please try again.');
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Backend stores/returns profileImage as a relative path like
  // "uploads/xyz.jpg" (see Backend/src/utils/file_handler.py), servable at
  // GET /uploads/xyz.jpg on the API host — not the Vite dev server this page
  // is loaded from. Used raw as an <img src>, it resolved against the
  // frontend's own origin (port 5174) and 404'd. Same fix already applied in
  // Header.jsx/Sidebar.jsx for the representative's own avatar.
  const getProfileImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('data:image/')) return img;
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    const base = import.meta.env.VITE_API_BASE_URL || '';
    const path = img.startsWith('/') ? img : `/${img}`;
    return base ? `${base}${path}` : path;
  };
  const profileImageUrl = getProfileImageUrl(profile?.profileImage);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: photoError ? '8px' : '32px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
            <div
              onClick={handlePhotoClick}
              title="Change photo"
              style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0, cursor: photoUploading ? 'default' : 'pointer' }}
            >
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={profile.fullName || 'Profile photo'}
                  style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#fff', fontWeight: 700 }}>
                  {(profile.fullName || profile.username || 'O')[0].toUpperCase()}
                </div>
              )}
              {/* Camera badge — signals the avatar is clickable to change the photo */}
              <div style={{
                position: 'absolute', bottom: '-2px', right: '-2px',
                width: '24px', height: '24px', borderRadius: '50%',
                background: photoUploading ? '#94a3b8' : '#2563eb',
                border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px',
              }}>
                {photoUploading ? '…' : '✎'}
              </div>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{profile.fullName || profile.username || '—'}</h2>
              <span style={{ display: 'inline-block', marginTop: '6px', padding: '3px 12px', borderRadius: '12px', background: '#dbeafe', color: '#1e40af', fontSize: '12px', fontWeight: 600 }}>
                {profile.role || 'FIELD_OFFICER'}
              </span>
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#94a3b8' }}>
                {photoUploading ? 'Uploading photo…' : 'Click your photo to change it'}
              </div>
            </div>
          </div>
          {photoError && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '24px' }}>{photoError}</div>
          )}

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

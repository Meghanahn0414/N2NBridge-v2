import React, { useState } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import PageHeader from "../../../components/PageHeader";
import PhoneInput from "../../../components/PhoneInput";
import { sanitizePhoneInput } from "../../../utils/phoneUtils";
import api from "../../../shared/services/api";
import { getAuthUser, updateAuthUser } from "../../../services/authStorage";

export default function AdminSettings() {
  const [mobile, setMobile] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(() => {
    const img = getAuthUser()?.profileImage;
    if (!img) return '';
    if (img.startsWith('data:image/') || img.startsWith('http://') || img.startsWith('https://')) return img;
    const base = import.meta.env.VITE_API_BASE_URL || '';
    const path = img.startsWith('/') ? img : `/${img}`;
    return base ? `${base}${path}` : path;
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoMsg, setPhotoMsg] = useState('');

  const [userPreferences, setUserPreferences] = useState({
    theme: 'light',
    emailNotifications: true,
    smsNotifications: true,
    language: 'English',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handlePreferenceChange = (key, value) => {
    setUserPreferences({ ...userPreferences, [key]: value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoMsg('');
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) { setPhotoMsg('Please select a photo first.'); return; }
    const user = getAuthUser();
    if (!user?.id && !user?._id) { setPhotoMsg('Could not determine user ID. Please re-login.'); return; }
    const userId = user.id || user._id;
    setUploadingPhoto(true);
    setPhotoMsg('');
    try {
      const formData = new FormData();
      formData.append('file', photoFile);
      const res = await api.post(`/api/users/${userId}/upload-profile-photo`, formData);
      const newUrl = res.data?.data?.profileImage || res.data?.profileImage;
      if (newUrl) {
        updateAuthUser({ profileImage: newUrl });
        window.dispatchEvent(new Event('auth-user-updated'));
        setPhotoMsg('✅ Photo updated successfully.');
        setPhotoFile(null);
      } else {
        setPhotoMsg('Upload succeeded but no URL returned.');
      }
    } catch (err) {
      setPhotoMsg('❌ ' + (err?.response?.data?.detail || err?.message || 'Upload failed.'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div>
      <PageHeader subtitle="Manage your account preferences and settings" />
      <div className="module-container">
      <div className="settings-sections">
        <div className="settings-section">
          <h3>👤 Profile Information</h3>
          <form>
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" placeholder="Your full name" />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" placeholder="Your email address" />
            </div>
            <div className="form-group">
              <label>Mobile</label>
              <PhoneInput
                value={mobile}
                onChange={(name, value) => setMobile(sanitizePhoneInput(value))}
                name="mobile"
                placeholder="Your mobile number"
                className="admin-settings-phone-input"
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label>Profile Photo</label>
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', display: 'block', marginBottom: 8 }}
                />
              )}
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ marginBottom: 8 }} />
              <button type="button" className="btn-secondary" onClick={handlePhotoUpload} disabled={uploadingPhoto || !photoFile}>
                {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
              </button>
              {photoMsg && (
                <div style={{ marginTop: 6, fontSize: 13, color: photoMsg.startsWith('✅') ? '#15803d' : '#b91c1c' }}>
                  {photoMsg}
                </div>
              )}
            </div>
            <button type="submit" className="btn-primary">Update Profile</button>
          </form>
        </div>

        <div className="settings-section">
          <h3>🔐 Change Password</h3>
          <button 
            className="btn-secondary"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
          >
            {showPasswordForm ? 'Cancel' : 'Change Password'}
          </button>
          
          {showPasswordForm && (
            <form>
              <div className="form-group">
                <label>Current Password *</label>
                <input type="password" required />
              </div>
              <div className="form-group">
                <label>New Password *</label>
                <input type="password" required />
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <input type="password" required />
              </div>
              <button type="submit" className="btn-primary">Update Password</button>
            </form>
          )}
        </div>

        <div className="settings-section">
          <h3>🎨 Preferences</h3>
          <form>
            <div className="form-group">
              <label>Theme</label>
              <select 
                value={userPreferences.theme}
                onChange={(e) => handlePreferenceChange('theme', e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            <div className="form-group">
              <label>Language</label>
              <select 
                value={userPreferences.language}
                onChange={(e) => handlePreferenceChange('language', e.target.value)}
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Local">Local Language</option>
              </select>
            </div>
            <button type="submit" className="btn-primary">Save Preferences</button>
          </form>
        </div>

        <div className="settings-section">
          <h3>🔔 Notification Settings</h3>
          <form>
            <div className="form-group checkbox">
              <input 
                type="checkbox"
                id="emailNotif"
                checked={userPreferences.emailNotifications}
                onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
              />
              <label htmlFor="emailNotif">Email Notifications</label>
            </div>
            <div className="form-group checkbox">
              <input 
                type="checkbox"
                id="smsNotif"
                checked={userPreferences.smsNotifications}
                onChange={(e) => handlePreferenceChange('smsNotifications', e.target.checked)}
              />
              <label htmlFor="smsNotif">SMS Notifications</label>
            </div>
            <div className="form-group checkbox">
              <input type="checkbox" defaultChecked />
              <label>Dashboard Alerts</label>
            </div>
            <button type="submit" className="btn-primary">Save Notification Settings</button>
          </form>
        </div>

        <div className="settings-section danger-zone">
          <h3>⚠️ Danger Zone</h3>
          <div className="danger-actions">
            <div className="action">
              <h4>Delete Account</h4>
              <p>Permanently delete your admin account and all associated data</p>
              <button className="btn-danger">Delete Account</button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

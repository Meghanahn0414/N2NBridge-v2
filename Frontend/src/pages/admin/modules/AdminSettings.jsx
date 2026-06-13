import React, { useState } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import PageHeader from "../../../components/PageHeader";

export default function AdminSettings() {
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
              <input type="tel" placeholder="Your mobile number" />
            </div>
            <div className="form-group">
              <label>Profile Picture</label>
              <input type="file" accept="image/*" />
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

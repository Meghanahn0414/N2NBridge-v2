import React, { useState } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';

export default function SystemConfiguration() {
  const [settings, setSettings] = useState({
    constituencyName: '',
    logoUrl: '',
    timezone: 'IST',
    language: 'English',
  });

  const [notifications, setNotifications] = useState({
    smsTemplate: '',
    emailTemplate: '',
    whatsappTemplate: '',
    pushTemplate: '',
  });

  const [slaSettings, setSlaSettings] = useState({
    critical: 15,
    high: 60,
    complaint: 1440,
  });

  const handleSettingChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleSLAChange = (key, value) => {
    setSlaSettings({ ...slaSettings, [key]: value });
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h1>⚙️ System Configuration</h1>
        <p>Configure platform settings, notifications, and SLA parameters</p>
      </div>

      <div className="config-tabs">
        <button className="tab-btn active">General</button>
        <button className="tab-btn">Notifications</button>
        <button className="tab-btn">SLA Settings</button>
        <button className="tab-btn">Templates</button>
      </div>

      <div className="config-section">
        <h3>General Settings</h3>
        <form>
          <div className="form-group">
            <label>Constituency Name *</label>
            <input
              type="text"
              value={settings.constituencyName}
              onChange={(e) => handleSettingChange('constituencyName', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Platform Logo URL</label>
            <input
              type="url"
              value={settings.logoUrl}
              onChange={(e) => handleSettingChange('logoUrl', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Timezone</label>
            <select value={settings.timezone} onChange={(e) => handleSettingChange('timezone', e.target.value)}>
              <option value="IST">India Standard Time (IST)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <div className="form-group">
            <label>Language</label>
            <select value={settings.language} onChange={(e) => handleSettingChange('language', e.target.value)}>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Local">Local Language</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">Save Settings</button>
        </form>
      </div>

      <div className="config-section">
        <h3>SLA Settings (Response Time)</h3>
        <form>
          <div className="form-group">
            <label>Critical Alert Response Time (minutes)</label>
            <input
              type="number"
              value={slaSettings.critical}
              onChange={(e) => handleSLAChange('critical', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>High Priority Response Time (minutes)</label>
            <input
              type="number"
              value={slaSettings.high}
              onChange={(e) => handleSLAChange('high', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Complaint Response Time (minutes)</label>
            <input
              type="number"
              value={slaSettings.complaint}
              onChange={(e) => handleSLAChange('complaint', e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">Save SLA Settings</button>
        </form>
      </div>

      <div className="config-section">
        <h3>Notification Templates</h3>
        <div className="templates-grid">
          <div className="template-card">
            <h4>SMS Template</h4>
            <textarea placeholder="SMS message template..."></textarea>
            <button className="btn-secondary">Preview</button>
          </div>
          <div className="template-card">
            <h4>Email Template</h4>
            <textarea placeholder="Email body template..."></textarea>
            <button className="btn-secondary">Preview</button>
          </div>
          <div className="template-card">
            <h4>WhatsApp Template</h4>
            <textarea placeholder="WhatsApp message template..."></textarea>
            <button className="btn-secondary">Preview</button>
          </div>
          <div className="template-card">
            <h4>Push Notification Template</h4>
            <textarea placeholder="Push notification template..."></textarea>
            <button className="btn-secondary">Preview</button>
          </div>
        </div>
      </div>
    </div>
  );
}

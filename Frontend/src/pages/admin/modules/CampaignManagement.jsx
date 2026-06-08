import React, { useState } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';

export default function CampaignManagement() {
  const [campaigns, setCampaigns] = useState([]);
  const [showBuilder, setShowBuilder] = useState(false);

  return (
    <div className="module-container">
      <div className="module-header">
        <h1>📢 Campaign Management</h1>
        <p>Design and launch targeted awareness campaigns</p>
      </div>

      <div className="module-controls">
        <input type="text" placeholder="Search campaigns..." />
        <button className="btn-primary" onClick={() => setShowBuilder(true)}>
          + Launch Campaign
        </button>
      </div>

      <div className="module-stats">
        <div className="stat-card">
          <span className="stat-label">Active Campaigns</span>
          <span className="stat-value"></span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Reach</span>
          <span className="stat-value"></span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Engagement Rate</span>
          <span className="stat-value"></span>
        </div>
        <div className="stat-card">
          <span className="stat-label">ROI</span>
          <span className="stat-value"></span>
        </div>
      </div>

      <div className="campaigns-list">
        <div className="empty-state">
          <p>📭 No campaigns created. Click "Launch Campaign" to get started.</p>
        </div>
      </div>

      {showBuilder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Campaign Builder</h2>
            <form>
              <div className="builder-step">
                <h3>Step 1: Audience Selection</h3>
                <div className="form-group">
                  <label>Target Audience *</label>
                  <div className="checkbox-group">
                    <label><input type="checkbox" /> All Citizens</label>
                    <label><input type="checkbox" /> Specific Ward</label>
                    <label><input type="checkbox" /> Specific Constituency</label>
                    <label><input type="checkbox" /> Custom Segment</label>
                  </div>
                </div>
              </div>

              <div className="builder-step">
                <h3>Step 2: Message Template</h3>
                <div className="form-group">
                  <label>Campaign Title *</label>
                  <input type="text" required />
                </div>
                <div className="form-group">
                  <label>Campaign Message *</label>
                  <textarea required></textarea>
                </div>
                <div className="form-group">
                  <label>Channels</label>
                  <div className="checkbox-group">
                    <label><input type="checkbox" /> SMS</label>
                    <label><input type="checkbox" /> WhatsApp</label>
                    <label><input type="checkbox" /> Email</label>
                    <label><input type="checkbox" /> Push Notification</label>
                  </div>
                </div>
              </div>

              <div className="builder-step">
                <h3>Step 3: Schedule</h3>
                <div className="form-group">
                  <label>Start Date & Time</label>
                  <input type="datetime-local" />
                </div>
                <div className="form-group">
                  <label>Repeat</label>
                  <select>
                    <option>One-time</option>
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowBuilder(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Launch Campaign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

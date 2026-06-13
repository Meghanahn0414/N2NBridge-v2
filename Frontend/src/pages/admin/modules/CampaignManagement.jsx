import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import { fetchCampaigns } from '../../../features/campaigns/campaignService';
import PageHeader from "../../../components/PageHeader";

export default function CampaignManagement() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [stats, setStats] = useState({ active: 0, reach: 0, engagement: 0, roi: 0 });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCampaigns(1, 1000);
      setCampaigns(data);
      updateStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load campaigns');
      console.error('Error loading campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (campaignList) => {
    const active = campaignList.filter(c => c.status === 'ACTIVE').length;
    const reach = campaignList.reduce((sum, c) => sum + (c.reach || 0), 0);
    const engagement = campaignList.length > 0 ? Math.round(campaignList.reduce((sum, c) => sum + (c.engagement || 0), 0) / campaignList.length) : 0;
    const roi = campaignList.length > 0 ? Math.round(campaignList.reduce((sum, c) => sum + (c.roi || 0), 0) / campaignList.length) : 0;
    setStats({ active, reach, engagement, roi });
  };

  return (
    <div>
      <PageHeader subtitle="Design and launch targeted awareness campaigns" />
      <div className="module-container">
      <div className="module-controls">
        <input type="text" placeholder="Search campaigns..." />
        <button className="btn-primary" onClick={() => setShowBuilder(true)}>
          + Launch Campaign
        </button>
      </div>

      <div className="module-stats">
        <div className="stat-card">
          <span className="stat-label">Active Campaigns</span>
          <span className="stat-value">{stats.active}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Reach</span>
          <span className="stat-value">{stats.reach}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Engagement Rate</span>
          <span className="stat-value">{stats.engagement}%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">ROI</span>
          <span className="stat-value">{stats.roi}%</span>
        </div>
      </div>

      <div className="campaigns-list">
        {loading ? (
          <div className="loading-state">Loading campaigns...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : campaigns.length === 0 ? (
          <div className="empty-state">
            <p>📭 No campaigns created. Click "Launch Campaign" to get started.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Campaign Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Target Reach</th>
                <th>Engagement</th>
                <th>ROI</th>
                <th>Start Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(campaign => (
                <tr key={campaign._id || campaign.id}>
                  <td>{campaign.name}</td>
                  <td>{campaign.type || 'Awareness'}</td>
                  <td><span className="status-badge">{campaign.status}</span></td>
                  <td>{campaign.reach || 0}</td>
                  <td>{campaign.engagement || 0}%</td>
                  <td>{campaign.roi || 0}%</td>
                  <td>{campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : '-'}</td>
                  <td>
                    <button>✏️</button>
                    <button>📊</button>
                    <button>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
    </div>
  );
}

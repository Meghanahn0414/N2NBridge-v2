import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import { fetchCampaigns, createCampaign, deleteCampaign, launchCampaign, sendCampaignNotifications } from '../../../features/campaigns/campaignService';
import PageHeader from "../../../components/PageHeader";

const AUDIENCE_OPTIONS = ['All Citizens', 'Specific Ward', 'Specific Constituency', 'Custom Segment'];
const CHANNEL_OPTIONS = ['SMS', 'WhatsApp', 'Email', 'Push Notification'];

const emptyForm = {
  name: '',
  type: 'Awareness',
  message: '',
  targetAudience: [],
  channels: [],
  startDate: '',
  repeat: 'One-time',
};

const TYPE_OPTIONS = ['Awareness', 'Health', 'Infrastructure', 'Education', 'Welfare', 'Other'];
const REPEAT_OPTIONS = ['One-time', 'Daily', 'Weekly', 'Monthly'];

const STATUS_COLORS = {
  ACTIVE: { bg: '#dcfce7', color: '#15803d' },
  DRAFT: { bg: '#f1f5f9', color: '#475569' },
  PAUSED: { bg: '#fef9c3', color: '#a16207' },
  COMPLETED: { bg: '#eff6ff', color: '#1d4ed8' },
  CANCELLED: { bg: '#fee2e2', color: '#b91c1c' },
};

export default function CampaignManagement() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { loadCampaigns(); }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCampaigns(1, 1000);
      setCampaigns(data);
    } catch (err) {
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    active: campaigns.filter(c => c.status === 'ACTIVE').length,
    reach: campaigns.reduce((s, c) => s + (c.reach || 0), 0),
    engagement: campaigns.length ? Math.round(campaigns.reduce((s, c) => s + (c.engagement || 0), 0) / campaigns.length) : 0,
    roi: campaigns.length ? Math.round(campaigns.reduce((s, c) => s + (c.roi || 0), 0) / campaigns.length) : 0,
  };

  const filtered = campaigns.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCheckbox = (field, value) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter(v => v !== value)
        : [...f[field], value],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setSubmitError('Campaign name is required'); return; }
    if (!form.message.trim()) { setSubmitError('Campaign message is required'); return; }
    setSubmitting(true);
    setSubmitError('');
    try {
      await createCampaign({
        ...form,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      });
      setShowBuilder(false);
      setForm(emptyForm);
      await loadCampaigns();
    } catch (err) {
      setSubmitError(err?.response?.data?.detail || 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLaunch = async (id) => {
    try {
      await launchCampaign(id);
      await loadCampaigns();
    } catch { /* ignore */ }
  };

  const handleNotify = async (id, name) => {
    try {
      const res = await sendCampaignNotifications(id);
      alert(`✅ Notifications sent to ${res.notified ?? res.data?.notified ?? 0} citizens for "${name}"`);
    } catch {
      alert('Failed to send notifications. Make sure the backend is restarted with the latest code.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await deleteCampaign(id);
      await loadCampaigns();
    } catch { /* ignore */ }
  };

  return (
    <div>
      <PageHeader subtitle="Design and launch targeted awareness campaigns" />
      <div className="module-container">

        {/* Controls */}
        <div className="module-controls">
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="btn-primary" onClick={() => { setShowBuilder(true); setSubmitError(''); }}>
            + Launch Campaign
          </button>
        </div>

        {/* Stats */}
        <div className="module-stats">
          <div className="stat-card"><span className="stat-label">Active Campaigns</span><span className="stat-value">{stats.active}</span></div>
          <div className="stat-card"><span className="stat-label">Total Reach</span><span className="stat-value">{stats.reach.toLocaleString()}</span></div>
          <div className="stat-card"><span className="stat-label">Engagement Rate</span><span className="stat-value">{stats.engagement}%</span></div>
          <div className="stat-card"><span className="stat-label">ROI</span><span className="stat-value">{stats.roi}%</span></div>
        </div>

        {/* List */}
        <div className="campaigns-list">
          {loading ? (
            <div className="loading-state">Loading campaigns...</div>
          ) : error ? (
            <div className="error-state">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <p>📭 {search ? 'No campaigns match your search.' : 'No campaigns created. Click "Launch Campaign" to get started.'}</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Channels</th>
                  <th>Start Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const sc = STATUS_COLORS[c.status] || STATUS_COLORS.DRAFT;
                  return (
                    <tr key={c._id || c.id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>{c.type || 'Awareness'}</td>
                      <td>
                        <span style={{ background: sc.bg, color: sc.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>
                        {(c.channels || []).join(', ') || '—'}
                      </td>
                      <td>{c.startDate ? new Date(c.startDate).toLocaleDateString() : '—'}</td>
                      <td style={{ display: 'flex', gap: 6 }}>
                        {c.status === 'DRAFT' && (
                          <button
                            onClick={() => handleLaunch(c._id || c.id)}
                            style={{ padding: '4px 10px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                          >
                            Launch
                          </button>
                        )}
                        {c.status === 'ACTIVE' && (c.channels || []).includes('Push Notification') && (
                          <button
                            onClick={() => handleNotify(c._id || c.id, c.name)}
                            style={{ padding: '4px 10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                          >
                            🔔 Notify
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(c._id || c.id)}
                          style={{ padding: '4px 10px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Campaign Builder Modal */}
        {showBuilder && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowBuilder(false); }}>
            <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto', maxWidth: 560 }}>
              <h2>Campaign Builder</h2>

              {submitError && (
                <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="builder-step">
                  <h3>Step 1: Audience & Type</h3>
                  <div className="form-group">
                    <label>Campaign Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Health Awareness Drive"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Campaign Type</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Target Audience</label>
                    <div className="checkbox-group">
                      {AUDIENCE_OPTIONS.map(opt => (
                        <label key={opt}>
                          <input
                            type="checkbox"
                            checked={form.targetAudience.includes(opt)}
                            onChange={() => handleCheckbox('targetAudience', opt)}
                          /> {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="builder-step">
                  <h3>Step 2: Message & Channels</h3>
                  <div className="form-group">
                    <label>Campaign Message *</label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Enter your campaign message..."
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Channels</label>
                    <div className="checkbox-group">
                      {CHANNEL_OPTIONS.map(opt => (
                        <label key={opt}>
                          <input
                            type="checkbox"
                            checked={form.channels.includes(opt)}
                            onChange={() => handleCheckbox('channels', opt)}
                          /> {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="builder-step">
                  <h3>Step 3: Schedule</h3>
                  <div className="form-group">
                    <label>Start Date &amp; Time</label>
                    <input
                      type="datetime-local"
                      value={form.startDate}
                      onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Repeat</label>
                    <select value={form.repeat} onChange={e => setForm(f => ({ ...f, repeat: e.target.value }))}>
                      {REPEAT_OPTIONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" onClick={() => setShowBuilder(false)} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Campaign'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

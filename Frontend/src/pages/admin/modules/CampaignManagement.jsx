import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import { fetchCampaigns, createCampaign, deleteCampaign, launchCampaign, sendCampaignNotifications } from '../../../features/campaigns/campaignService';
import PageHeader from "../../../components/PageHeader";
import Pagination from '../../../components/Pagination';

const PAGE_SIZE = 100;

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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => { loadCampaigns(page); }, [page]);

  const loadCampaigns = async (targetPage = page) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCampaigns(targetPage, PAGE_SIZE);
      setCampaigns(data);
      setHasMore(data.length >= PAGE_SIZE);
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
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(15,23,42,0.08)', overflow: 'hidden', marginTop: 8 }}>
          {/* Card header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #e8edf3' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>All Campaigns</h3>
            {!loading && !error && (
              <span style={{ background: '#eff6ff', color: '#3b82f6', borderRadius: 20, fontSize: 12, fontWeight: 700, padding: '3px 12px' }}>
                {filtered.length} total
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b', fontSize: 14 }}>Loading campaigns...</div>
          ) : error ? (
            <div style={{ margin: 24, padding: '12px 16px', background: '#fef2f2', color: '#b91c1c', borderRadius: 10, fontSize: 13 }}>{error}</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 14 }}>
              📭 {search ? 'No campaigns match your search.' : 'No campaigns yet. Click "+ Launch Campaign" to get started.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Campaign Name', 'Type', 'Status', 'Channels', 'Start Date', 'Reach', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e8edf3' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const sc = STATUS_COLORS[c.status] || STATUS_COLORS.DRAFT;
                  const id = c._id || c.id;
                  const typeColors = {
                    Awareness: '#3b82f6', Health: '#22c55e', Infrastructure: '#f59e0b',
                    Education: '#8b5cf6', Welfare: '#ec4899', Other: '#64748b',
                  };
                  const typeColor = typeColors[c.type] || '#64748b';
                  return (
                    <tr key={id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#94a3b8', fontWeight: 600, width: 40 }}>{i + 1}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${typeColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                            📢
                          </div>
                          <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{c.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13 }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${typeColor}15`, color: typeColor }}>
                          {c.type || 'Awareness'}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13 }}>
                        <span style={{ background: sc.bg, color: sc.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: '#64748b' }}>
                        {(c.channels || []).length > 0
                          ? (c.channels || []).map(ch => (
                            <span key={ch} style={{ display: 'inline-block', background: '#f1f5f9', color: '#475569', borderRadius: 4, padding: '2px 6px', fontSize: 11, marginRight: 4, marginBottom: 2 }}>{ch}</span>
                          ))
                          : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#334155' }}>
                        {c.startDate ? new Date(c.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#334155', fontWeight: 600 }}>
                        {(c.reach || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {c.status === 'DRAFT' && (
                            <button onClick={() => handleLaunch(id)} style={{ padding: '5px 12px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                              Launch
                            </button>
                          )}
                          {c.status === 'ACTIVE' && (c.channels || []).includes('Push Notification') && (
                            <button onClick={() => handleNotify(id, c.name)} style={{ padding: '5px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                              🔔 Notify
                            </button>
                          )}
                          <button onClick={() => handleDelete(id)} style={{ padding: '5px 12px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <Pagination
            page={page}
            hasMore={hasMore}
            onPrev={() => setPage(p => p - 1)}
            onNext={() => setPage(p => p + 1)}
            loading={loading}
            pageSize={PAGE_SIZE}
          />
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

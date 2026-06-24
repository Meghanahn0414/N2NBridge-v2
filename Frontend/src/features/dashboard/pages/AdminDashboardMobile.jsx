import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBars, FaBell, FaHome, FaUsers, FaClipboardList,
  FaExclamationTriangle, FaUserCircle, FaDownload,
} from 'react-icons/fa';
import { getAuthUser } from '../../../services/authStorage';
import { ROUTES } from '../../../app/routes/RouteConstants';
import api from '../../../shared/services/api';
import './AdminDashboardMobile.css';

/* ── Bar chart helpers ─────────────────────────────────── */
const BAR_COLORS = ['#10b981', '#3b82f6', '#d97706', '#dc2626', '#6d28d9', '#9ca3af'];

function CategoryBarChart({ categories }) {
  const entries = Object.entries(categories);
  if (entries.length === 0) return <p className="adm-empty">No category data</p>;
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="adm-bar-chart-area">
      {entries.map(([cat, count], i) => (
        <div key={cat} className="adm-bar-col">
          <span className="adm-bar-value">{count}</span>
          <div className="adm-bar-track">
            <div
              className="adm-bar"
              style={{
                height: `${Math.max((count / max) * 100, 5)}%`,
                background: BAR_COLORS[i % BAR_COLORS.length],
              }}
            />
          </div>
          <span className="adm-bar-label" title={cat}>
            {cat.length > 7 ? cat.slice(0, 6) + '…' : cat}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Main component ────────────────────────────────────── */
export default function AdminDashboardMobile({ dashboard, loading }) {
  const navigate = useNavigate();
  const user = getAuthUser();
  const userName = user?.fullName || user?.name || 'Admin';
  const initial = userName.charAt(0).toUpperCase();

  const [unread, setUnread] = useState(0);
  const [activeTab, setActiveTab] = useState('home');
  const [avatarImgErr, setAvatarImgErr] = useState(false);

  const avatarUrl = (() => {
    const img = user?.profileImage;
    if (!img) return null;
    if (img.startsWith('data:image/')) return img;
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    const base = import.meta.env.VITE_API_BASE_URL || '';
    const path = img.startsWith('/') ? img : `/${img}`;
    return base ? `${base}${path}` : path;
  })();

  useEffect(() => {
    api.get('/api/notifications/unread')
      .then(r => setUnread(Array.isArray(r.data?.data) ? r.data.data.length : 0))
      .catch(() => {});
  }, []);

  const handleMenuClick = () =>
    window.dispatchEvent(new CustomEvent('admin-mobile-menu-click'));

  /* Metrics */
  const m = dashboard?.metrics || {};
  const totalCitizens  = m?.users?.byRole?.CITIZEN || 0;
  const totalComplaints = m?.grievances?.total || 0;
  const criticalAlerts = m?.alerts?.byPriority?.CRITICAL || 0;
  const resolved       = m?.grievances?.byStatus?.RESOLVED || 0;

  const recentActivity = (dashboard?.recentActivity || []).slice(0, 5);
  const categories = dashboard?.metrics?.grievances?.byCategory || {};

  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  /* KPI config */
  const kpis = [
    { label: 'TOTAL CITIZENS', value: totalCitizens,  sub: 'Registered',                              cls: 'kpi-purple' },
    { label: 'COMPLAINTS',     value: totalComplaints, sub: `${totalComplaints} open`,                  cls: 'kpi-orange' },
    { label: 'CRITICAL ALERTS', value: criticalAlerts, sub: criticalAlerts === 0 ? 'All clear' : 'Active', cls: 'kpi-red' },
    { label: 'RESOLVED',       value: resolved,        sub: 'This month',                              cls: 'kpi-green' },
  ];

  /* Quick actions */
  const quickActions = [
    { label: 'Broadcast',    icon: '📢', route: ROUTES.communicationHub },
    { label: 'Create event', icon: '📅', route: ROUTES.eventManagement },
    { label: 'Campaign',     icon: '📣', route: ROUTES.campaignManagement },
    { label: 'Add staff',    icon: '👤', route: ROUTES.register },
    { label: 'Sys backup',   icon: '💾', route: ROUTES.systemConfiguration },
    { label: 'Analytics',   icon: '📊', route: ROUTES.analyticsReports },
  ];

  /* Bottom nav */
  const navItems = [
    { key: 'home',    label: 'Home',    icon: <FaHome />,              route: ROUTES.admin },
    { key: 'users',   label: 'Users',   icon: <FaUsers />,             route: ROUTES.userManagement },
    { key: 'cases',   label: 'Cases',   icon: <FaClipboardList />,     route: ROUTES.complaintManagement },
    { key: 'alerts',  label: 'Alerts',  icon: <FaExclamationTriangle />, route: ROUTES.alertManagement },
    { key: 'profile', label: 'Profile', icon: <FaUserCircle />,        route: ROUTES.adminSettings },
  ];

  const systemStatus = [
    { label: 'Server',   status: 'Online',  ok: true },
    { label: 'Database', status: 'Healthy', ok: true },
    { label: 'API',      status: 'Up',      ok: true },
    { label: 'Backup',   status: 'Healthy', ok: true },
  ];

  const fmt = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const shortId = (v) =>
    v ? String(v).slice(-8) : '';

  return (
    <div className="adm-page">
      {/* ── HEADER ── */}
      <header className="adm-header">
        <button className="adm-hamburger" onClick={handleMenuClick} aria-label="Open menu">
          <FaBars />
        </button>
        <h1 className="adm-header-title">Dashboard</h1>
        <div className="adm-header-right">
          <button className="adm-bell" aria-label="Notifications">
            <FaBell />
            {unread > 0 && <span className="adm-bell-badge">{unread > 9 ? '9+' : unread}</span>}
          </button>
          <div className="adm-avatar">
            {avatarUrl && !avatarImgErr ? (
              <img
                src={avatarUrl}
                alt={initial}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                onError={() => setAvatarImgErr(true)}
              />
            ) : initial}
          </div>
        </div>
      </header>

      {/* ── SUB-HEADER ── */}
      <div className="adm-subheader">
        <span className="adm-date">☐ {dateStr}</span>
        <button className="adm-export">
          <FaDownload /> Export
        </button>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="adm-scroll">
        {loading && <div className="adm-loading">Loading…</div>}

        {/* KPI grid */}
        <div className="adm-kpi-grid">
          {kpis.map(k => (
            <div key={k.label} className={`adm-kpi ${k.cls}`}>
              <p className="adm-kpi-label">{k.label}</p>
              <p className="adm-kpi-value">{k.value}</p>
              <p className="adm-kpi-sub">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Activity + Heatmap: side-by-side on tablet+ */}
        <div className="adm-row-2col">

          {/* Activity */}
          <div className="adm-card">
            <div className="adm-card-head">
              <span className="adm-card-icon-sm">☰</span>
              <h2 className="adm-card-title">Activity</h2>
            </div>
            <div className="adm-activity-list">
              {recentActivity.length === 0
                ? <p className="adm-empty">No recent activity</p>
                : recentActivity.map((item, i) => (
                  <div key={i} className="adm-activity-row">
                    <span className={`adm-dot dot-${(item.status || 'new').toLowerCase()}`} />
                    <div className="adm-activity-body">
                      <span className="adm-activity-id">
                        #{shortId(item.complaintId || item._id || item.id)}
                      </span>
                      <span className="adm-activity-name">
                        {item.citizenName || item.citizen || item.createdBy || 'Citizen'}
                      </span>
                    </div>
                    <span className="adm-activity-time">{fmt(item.createdAt || item.timestamp)}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Complaints by Category */}
          <div className="adm-card">
            <div className="adm-card-head">
              <span className="adm-card-icon-sm">📊</span>
              <h2 className="adm-card-title">Complaints by category</h2>
            </div>
            <CategoryBarChart categories={categories} />
          </div>
        </div>

        {/* System status */}
        <div className="adm-card">
          <div className="adm-card-head">
            <span className="adm-card-icon-sm">☰</span>
            <h2 className="adm-card-title">System status</h2>
          </div>
          <div className="adm-status-grid">
            {systemStatus.map(s => (
              <div key={s.label} className="adm-status-row">
                <span className="adm-status-name">{s.label}</span>
                <span className={`adm-status-pill ${s.ok ? 'pill-ok' : 'pill-warn'}`}>
                  ● {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="adm-actions-grid">
          {quickActions.map(a => (
            <button key={a.label} className="adm-action" onClick={() => navigate(a.route)}>
              <span className="adm-action-icon">{a.icon}</span>
              <span className="adm-action-label">{a.label}</span>
            </button>
          ))}
        </div>

        <div style={{ height: 80 }} />
      </div>

      {/* ── BOTTOM NAV ── */}
      <nav className="adm-bottom-nav">
        {navItems.map(item => (
          <button
            key={item.key}
            className={`adm-nav-btn ${activeTab === item.key ? 'active' : ''}`}
            onClick={() => { setActiveTab(item.key); navigate(item.route); }}
          >
            <span className="adm-nav-icon">{item.icon}</span>
            <span className="adm-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

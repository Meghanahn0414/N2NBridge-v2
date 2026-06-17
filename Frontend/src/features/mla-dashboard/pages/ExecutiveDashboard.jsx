import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell,
} from 'recharts';
import {
  FaBell, FaHome, FaClipboardList, FaMapMarkedAlt,
  FaExclamationCircle, FaUserCircle, FaRegSquare, FaBullhorn,
} from 'react-icons/fa';
import { ROUTES } from '../../../app/routes/RouteConstants';
import useMlaDashboard from '../../../shared/hooks/useMlaDashboard';
import { fetchGrievances } from '../../grievances/grievanceService';
import { fetchCampaigns } from '../../campaigns/campaignService';
import { getAuthUser } from '../../../services/authStorage';
import '../../../styles/mla-dashboard/ExecutiveDashboard.css';
import PageHeader from '../../../components/PageHeader';

function HealthGauge({ score }) {
  const radius = 36;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, Number(score) || 0));
  const offset = circumference - (pct / 100) * circumference;

  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none"
        stroke="#22c55e"
        strokeWidth="10"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={`${offset}`}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px' }}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#1f2937" fontSize="13" fontWeight="700">
        {pct > 0 ? `${pct}%` : '—'}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#6b7280" fontSize="9">
        Score
      </text>
    </svg>
  );
}

const CAT_COLORS = [
  '#3b82f6', // blue
  '#f97316', // orange
  '#10b981', // green
  '#8b5cf6', // purple
  '#ef4444', // red
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#ec4899', // pink
];

function shortenCategory(name) {
  if (!name) return '?';
  const SHORT = {
    'Water Supply': 'Water', 'Road Issue': 'Roads', 'Roads': 'Roads',
    'Electricity': 'Elec.', 'Drainage': 'Drain.', 'Health': 'Health',
    'Sanitation': 'Sanit.', 'Infrastructure': 'Infra.',
    'Education': 'Educ.', 'Transport': 'Trans.',
    'Street Light': 'S.Light', 'Garbage': 'Garbg.',
    'Park Maintenance': 'Park', 'Noise Pollution': 'Noise',
  };
  return SHORT[name] || (name.length > 7 ? name.slice(0, 6) + '.' : name);
}

function wardSeverity(ward) {
  const p = (ward.highestPriority || 'LOW').toUpperCase();
  if (p === 'CRITICAL' || p === 'HIGH') return { bg: '#fee2e2', text: '#dc2626', label: 'High' };
  if (p === 'MEDIUM') return { bg: '#fef9c3', text: '#d97706', label: 'Med' };
  return { bg: '#dcfce7', text: '#16a34a', label: 'Low' };
}

export default function ExecutiveDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dashboard, loading, error } = useMlaDashboard();
  const [recentGrievances, setRecentGrievances] = useState([]);
  const [activeCampaigns, setActiveCampaigns] = useState([]);

  const user = getAuthUser();
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 3)
    : 'MLA';

  useEffect(() => {
    fetchGrievances(1, 100)
      .then(data => setRecentGrievances(Array.isArray(data) ? data : []))
      .catch(() => setRecentGrievances([]));
    fetchCampaigns(1, 1000, { status: 'ACTIVE' })
      .then(data => setActiveCampaigns(Array.isArray(data) ? data : []))
      .catch(() => setActiveCampaigns([]));
  }, []);

  const kpis = dashboard?.summary || {};
  const grievanceStats = dashboard?.metrics?.grievances || {};

  const totalComplaints = Number(kpis.totalComplaints || 0);
  const openComplaints = Number(kpis.openComplaints || 0);
  const resolvedComplaints = Number(
    kpis.resolvedThisMonth || grievanceStats.byStatus?.RESOLVED || 0
  );
  const criticalAlerts = Number(kpis.criticalAlerts || 0);
  const weeklyNew = Number(kpis.weeklyNewComplaints || kpis.newThisWeek || 0);
  const escalated = Number(grievanceStats.byStatus?.ESCALATED || 0);
  const resolutionPct = totalComplaints > 0
    ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;
  const unackCount = (dashboard?.recentAlerts || []).filter(
    a => !a.acknowledged && !a.isAcknowledged
  ).length;

  const rawHealth = kpis.healthScore;
  const healthScore = rawHealth != null
    ? Number(String(rawHealth).replace('%', '')) : 0;

  const satisfaction = Number(kpis.citizenSatisfaction || 0);
  const upcomingEvents = Number(kpis.upcomingEvents || 0);
  const activeOfficers = Number(kpis.activeOfficers || 0);

  const byCategory = grievanceStats.byCategory || {};
  const openRatio = totalComplaints > 0 ? openComplaints / totalComplaints : 0;
  const categoryData = Object.entries(byCategory)
    .map(([key, val]) => {
      const total = typeof val === 'object'
        ? Number(val.total || val.count || 0)
        : Number(val) || 0;
      const open = typeof val === 'object' && val.open != null
        ? Number(val.open)
        : Math.round(total * openRatio);
      return { name: shortenCategory(key), Total: total, Open: open };
    })
    .filter(d => d.Total > 0);

  const wardData = (() => {
    if (Array.isArray(dashboard?.wardStats) && dashboard.wardStats.length) {
      return dashboard.wardStats.map(w => ({
        name: w.name || w.wardId || w.ward || 'Ward',
        count: Number(w.count || w.issues || 0),
        highestPriority: w.highestPriority || 'LOW',
      }));
    }
    const complaints = dashboard?.recentComplaints || [];
    if (complaints.length > 0) {
      const map = {};
      complaints.forEach(c => {
        const ward = c.wardId || c.ward || 'Other';
        map[ward] = (map[ward] || 0) + 1;
      });
      return Object.entries(map)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    }
    return [];
  })();

  const today = new Date().toLocaleDateString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric',
  });

  const navItems = [
    { label: 'Home',       Icon: FaHome,            route: ROUTES.rep },
    { label: 'Complaints', Icon: FaClipboardList,    route: ROUTES.mlaComplaintsDashboard },
    { label: 'Wards',      Icon: FaMapMarkedAlt,     route: ROUTES.mlaHeatMap },
    { label: 'Alerts',     Icon: FaExclamationCircle, route: ROUTES.mlaEmergencyCenter },
    { label: 'Campaigns',  Icon: FaBullhorn,          route: ROUTES.campaignManagement },
  ];

  const activeNav = navItems.find(n => n.route && location.pathname === n.route)?.label || 'Home';

  if (loading) return <div className="rep-loading">Loading dashboard&hellip;</div>;
  if (error) return <div className="rep-error">{error}</div>;

  return (
    <div className="rep-dashboard">
      <PageHeader subtitle="Constituency overview and key performance indicators" />

      {/* KPI Cards */}
      <div className="rep-kpi-row">
        <div className="rep-kpi rep-kpi--blue">
          <div className="rep-kpi-label">TOTAL COMPLAINTS</div>
          <div className="rep-kpi-value">{totalComplaints || '—'}</div>
          {weeklyNew > 0 && (
            <div className="rep-kpi-sub rep-kpi-sub--blue">&#8593; {weeklyNew} this week</div>
          )}
        </div>
        <div className="rep-kpi rep-kpi--orange">
          <div className="rep-kpi-label">OPEN COMPLAINTS</div>
          <div className="rep-kpi-value rep-kpi-value--orange">{openComplaints || '—'}</div>
          {escalated > 0 && (
            <div className="rep-kpi-sub rep-kpi-sub--orange">&#8593; {escalated} escalated</div>
          )}
        </div>
        <div className="rep-kpi rep-kpi--green">
          <div className="rep-kpi-label">RESOLVED</div>
          <div className="rep-kpi-value rep-kpi-value--green">{resolvedComplaints || '—'}</div>
          <div className="rep-kpi-sub rep-kpi-sub--green">{resolutionPct}% rate</div>
        </div>
        <div className="rep-kpi rep-kpi--red">
          <div className="rep-kpi-label">ALERTS</div>
          <div className="rep-kpi-value rep-kpi-value--red">{criticalAlerts || '—'}</div>
          {unackCount > 0 && (
            <div className="rep-kpi-sub rep-kpi-sub--red">{unackCount} unack.</div>
          )}
        </div>
      </div>

      {/* Middle row: 3 panels */}
      <div className="rep-mid-row">
        {/* By Category chart */}
        <div className="rep-card">
          <div className="rep-card-title">
            <div className="rep-card-icon" /> By category
          </div>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={categoryData}
                  barSize={10}
                  margin={{ top: 5, right: 8, left: -28, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="Total" radius={[3, 3, 0, 0]}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} fillOpacity={0.35} />
                    ))}
                  </Bar>
                  <Bar dataKey="Open" radius={[3, 3, 0, 0]}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="rep-legend" style={{ flexWrap: 'wrap', gap: '6px 12px' }}>
                {categoryData.map((entry, i) => (
                  <span key={entry.name} className="rep-legend-item">
                    <span className="rep-legend-dot" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                    {entry.name}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="rep-empty">No category data available</div>
          )}
        </div>

        {/* Ward Heat Map */}
        <div className="rep-card">
          <div className="rep-card-title">
            <div className="rep-card-icon" />Ward heat map
          </div>
          {wardData.length > 0 ? (
            <>
              <div className="rep-ward-grid" style={{ maxHeight: 220, overflowY: 'auto' }}>
                {wardData.map((ward, i) => {
                  const sev = wardSeverity(ward);
                  return (
                    <div
                      key={i}
                      className="rep-ward-tile"
                      style={{ backgroundColor: sev.bg }}
                    >
                      <div className="rep-ward-name" style={{ color: sev.text }}>
                        Ward {ward.name}
                      </div>
                      <div className="rep-ward-count" style={{ color: sev.text }}>
                        {ward.count} {ward.count === 1 ? 'issue' : 'issues'}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="rep-legend">
                <span className="rep-legend-item">
                  <span className="rep-legend-dot" style={{ background: '#fca5a5' }} /> High
                </span>
                <span className="rep-legend-item">
                  <span className="rep-legend-dot" style={{ background: '#fde68a' }} /> Med
                </span>
                <span className="rep-legend-item">
                  <span className="rep-legend-dot" style={{ background: '#86efac' }} /> Low
                </span>
              </div>
            </>
          ) : (
            <div className="rep-empty">No ward data available</div>
          )}
        </div>

        {/* Constituency Health */}
        <div className="rep-card">
          <div className="rep-card-title">
            <div className="rep-card-icon" /> Constituency health
          </div>
          <div className="rep-health-gauge-wrap">
            <HealthGauge score={healthScore} />
          </div>
          <div className="rep-health-metrics">
            <div className="rep-health-row">
              <span className="rep-health-key">Satisfaction</span>
              <span className="rep-health-val">
                {satisfaction > 0 ? satisfaction : 0}/5 &#11088;
              </span>
            </div>
            <div className="rep-health-row">
              <span className="rep-health-key">Events</span>
              <span className="rep-health-val">
                <strong>{upcomingEvents}</strong> upcoming
              </span>
            </div>
            <div className="rep-health-row">
              <span className="rep-health-key">Officers</span>
              <span className="rep-health-val">
                <strong>{activeOfficers}</strong> active
              </span>
            </div>
            <div className="rep-health-row">
              <span className="rep-health-key">Resolution</span>
              <span className="rep-health-val">
                <strong>{resolutionPct}%</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Grievances */}
      <div className="rep-card rep-card--full">
        <div className="rep-card-title">
          <div className="rep-card-icon" /> Recent grievances
        </div>
        <div className="rep-table-wrap">
          <table className="rep-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>CITIZEN</th>
                <th>CATEGORY</th>
                <th>WARD</th>
                <th>PRIORITY</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {recentGrievances.length > 0 ? (
                recentGrievances.map((g, i) => {
                  const label = `G-${String(i + 1).padStart(3, '0')}`;
                  const citizen =
                    g.citizenName ||
                    g.citizen?.name ||
                    g.submittedBy?.name ||
                    g.createdBy?.name ||
                    'Unknown';
                  const rawCat = g.categoryName || g.category || g.categoryId || '';
                  const category = rawCat
                    ? rawCat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                    : '-';
                  const ward = g.wardId || g.ward || '-';
                  const priority = (g.priority || 'LOW').toUpperCase();
                  const isUnassigned = !g.assignedTo || g.status === 'NEW';
                  const priorityClass =
                    priority === 'HIGH'
                      ? 'rep-priority--high'
                      : priority === 'MEDIUM'
                      ? 'rep-priority--medium'
                      : 'rep-priority--low';

                  return (
                    <tr key={g._id || i}>
                      <td>
                        <span
                          className="rep-grievance-id"
                          onClick={() => navigate(ROUTES.mlaComplaintsDashboard)}
                        >
                          {label}
                        </span>
                      </td>
                      <td>{citizen}</td>
                      <td>{category}</td>
                      <td>{ward}</td>
                      <td>
                        <span className={`rep-priority ${priorityClass}`}>{priority}</span>
                      </td>
                      <td>
                        <button
                          className="rep-btn-view"
                          onClick={() => navigate(ROUTES.mlaComplaintsDashboard)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="rep-table-empty">
                    No recent grievances
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Campaigns */}
      {activeCampaigns.length > 0 && (
        <div className="rep-card rep-card--full" style={{ marginTop: 16 }}>
          <div className="rep-card-title">
            <div className="rep-card-icon" /> Active campaigns
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, background: '#dcfce7', color: '#15803d', padding: '2px 10px', borderRadius: 20 }}>
              {activeCampaigns.length} running
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {activeCampaigns.map((c, i) => (
              <div key={c._id || c.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: i < activeCampaigns.length - 1 ? '1px solid #f1f5f9' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>📢</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      {c.type} &bull; {(c.channels || []).join(', ') || 'No channels'} &bull; {c.repeat}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  {c.startDate ? new Date(c.startDate).toLocaleDateString() : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="rep-bottom-nav">
        {navItems.map(({ label, Icon, route }) => {
          const isActive = label === activeNav;
          return (
            <button
              key={label}
              className={`rep-nav-item${isActive ? ' rep-nav-item--active' : ''}`}
              onClick={() => route && navigate(route)}
            >
              <Icon className="rep-nav-icon" />
              <span className="rep-nav-label">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

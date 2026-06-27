import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { getDashboardForRole } from "../../../shared/services/dashboardService";
import { getAuthRole } from "../../../services/authStorage";
import PageHeader from "../../../components/PageHeader";
import { ROUTES } from "../../../app/routes/RouteConstants";
import AdminDashboardMobile from "./AdminDashboardMobile";
import {
  FaBell,
  FaClipboardList,
  FaUsers,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaUserTie,
  FaShieldAlt,
  FaPlus,
  FaRedoAlt,
  FaDownload,
  FaMapMarkerAlt,
  FaChartPie,
  FaChartLine,
  FaBroadcastTower,
  FaCog,
} from "react-icons/fa";
import "../../../styles/AdminDashboard.css";
import { getAuthUser } from '../../../services/authStorage';

const ICON_STYLES = {
  blue:   { bg: "#EEF2FF", color: "#4F46E5" },
  orange: { bg: "#FFF7ED", color: "#EA580C" },
  red:    { bg: "#FEF2F2", color: "#DC2626" },
  pink:   { bg: "#FEF2F2", color: "#DC2626" },
  purple: { bg: "#F5F3FF", color: "#7C3AED" },
  green:  { bg: "#F0FDF4", color: "#16A34A" },
  teal:   { bg: "#F0FDFA", color: "#0D9488" },
};

const StatCard = ({ label, value, trend, icon: Icon, color, trendLabel, subtitle }) => {
  const formatValue = (val) => {
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return val.toLocaleString();
    return val || "0";
  };
  const ic = ICON_STYLES[color] || ICON_STYLES.blue;
  const hasTrend = trend !== null && trend !== undefined && trend !== 0;
  const subText = hasTrend ? `${trend >= 0 ? '+' : ''}${trend}% ${trendLabel || 'vs last month'}` : subtitle;
  const subGreen = hasTrend && trend > 0;

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #EAEDF4",
      borderRadius: 18,
      padding: "18px 20px",
      boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)",
      display: "flex",
      flexDirection: "column",
      gap: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: ic.bg,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon style={{ fontSize: 18, color: ic.color }} />
        </div>
        <span style={{ font: "600 12px 'Hanken Grotesk',system-ui,sans-serif", color: "#8590A6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily: "'Newsreader','Georgia',serif", fontSize: "clamp(22px,2.5vw,32px)", fontWeight: 400, color: "#16233C", lineHeight: 1.2, marginBottom: 4 }}>
        {formatValue(value)}
      </div>
      {subText && (
        <div style={{ font: "500 12px 'Hanken Grotesk',system-ui,sans-serif", color: subGreen ? "#1E7A50" : "#8590A6", marginTop: 2 }}>
          {subText}
        </div>
      )}
    </div>
  );
};

const QuickActionBtn = ({ label, icon: Icon, onClick }) => (
  <button className="quick-action-btn" onClick={onClick}>
    <div className="quick-action-icon">
      <Icon />
    </div>
    <span>{label}</span>
  </button>
);

const SystemStatusItem = ({ label, statusLabel, healthy, icon: Icon }) => (
  <div className="system-status-item">
    <div className="status-header">
      <span className="status-label">{label}</span>
      <div className={`status-indicator ${healthy ? 'healthy' : 'warning'}`}>
        <Icon className="status-icon" />
        <span>{statusLabel}</span>
      </div>
    </div>
  </div>
);

const statusLabels = {
  NEW: "New",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  ESCALATED: "Escalated",
};

const roleLabels = {
  ADMIN: "Administrators",
  REPRESENTATIVE: "Representatives",
  CONSTITUENCY_MANAGER: "Constituency Mgrs",
  FIELD_OFFICER: "Field Officers",
  CITIZEN: "Citizens",
  MANAGER: "Managers",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const role = getAuthRole();
  const user = getAuthUser();

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const result = await getDashboardForRole(role);
        setDashboard(result);
      } catch (err) {
        setError(err?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [role]);

  const stats = dashboard ? [
    {
      label: "Total Citizens",
      value: dashboard?.metrics?.users?.total || 0,
      trend: dashboard?.metrics?.users?.trend || 0,
      subtitle: "Registered on platform",
      icon: FaUsers,
      color: "blue",
    },
    {
      label: "Total Complaints",
      value: dashboard?.metrics?.grievances?.total || 0,
      trend: dashboard?.metrics?.grievances?.trend || 0,
      subtitle: "All time submissions",
      icon: FaClipboardList,
      color: "orange",
    },
    {
      label: "Open Complaints",
      value: (dashboard?.metrics?.grievances?.byStatus?.NEW || 0) + (dashboard?.metrics?.grievances?.byStatus?.ASSIGNED || 0),
      trend: 0,
      subtitle: "Awaiting resolution",
      icon: FaBell,
      color: "red",
    },
    {
      label: "Critical Alerts",
      value: dashboard?.metrics?.alerts?.byPriority?.CRITICAL || 0,
      trend: dashboard?.metrics?.alerts?.trend || 0,
      subtitle: "Needs immediate action",
      icon: FaExclamationTriangle,
      color: "pink",
    },
    {
      label: "Events Scheduled",
      value: dashboard?.metrics?.events?.totalEvents || 0,
      trend: dashboard?.metrics?.events?.trend || 0,
      subtitle: "Upcoming events",
      icon: FaCalendarAlt,
      color: "purple",
    },
  ] : [];

  const quickActions = [
    { label: "Broadcast Alert", icon: FaBroadcastTower, onClick: () => navigate(ROUTES.alertManagement) },
    { label: "Create Event",    icon: FaCalendarAlt,   onClick: () => navigate(ROUTES.eventManagement) },
    { label: "Send Campaign",   icon: FaBell,           onClick: () => navigate(ROUTES.campaignManagement) },
    { label: "Add Staff",       icon: FaUserTie,        onClick: () => navigate(ROUTES.register) },
    { label: "System Backup",   icon: FaCog,            onClick: () => navigate(ROUTES.systemConfiguration) },
    { label: "View Analytics",  icon: FaChartLine,      onClick: () => navigate(ROUTES.analyticsReports) },
  ];

  const grievanceTrends = dashboard?.grievanceTrends || {};
  const trendDays = Object.keys(grievanceTrends);
  const trendCounts = Object.values(grievanceTrends);
  const maxTrend = Math.max(...trendCounts, 25);

  const recentActivity = dashboard?.recentActivity || [];

  if (isMobile) {
    return <AdminDashboardMobile dashboard={dashboard} loading={loading} />;
  }

  return (
    <>
      <PageHeader subtitle="Overview of your constituency management platform" />
      <div className="admin-dashboard-container">
      {loading && <div className="loading-message">Loading dashboard...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="stats-grid">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            trend={stat.trend}
            trendLabel="vs last month"
            subtitle={stat.subtitle}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Row 2 — Activity + Categories + Status: 3 equal columns */}
      <div className="ad-grid-3">
        <div className="dashboard-card">
          <h2 className="card-title">Real-Time Activity Feed</h2>
          <div className="activity-feed">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((item, idx) => (
                <div key={idx} className="activity-item">
                  <span className="activity-time">{item.time}</span>
                  <div className="activity-icon">
                    {item.type === 'COMPLAINT' && <FaClipboardList />}
                    {item.type === 'ALERT' && <FaExclamationTriangle />}
                    {item.type === 'EVENT' && <FaCalendarAlt />}
                    {!item.type && (idx % 3 === 0 ? <FaClipboardList /> : idx % 3 === 1 ? <FaExclamationTriangle /> : <FaCalendarAlt />)}
                  </div>
                  <p className="activity-message">{item.message}</p>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                <p>No recent activities</p>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <h2 className="card-title">Top Complaint Categories</h2>
          {(() => {
            const PIE_COLORS = ['#4F46E5','#0891B2','#F59E0B','#EF4444','#8B5CF6','#EC4899','#10B981'];
            const fmtKey = k => k.split('_').map(w => w[0] + w.slice(1).toLowerCase()).join(' ');
            const categories = dashboard?.metrics?.grievances?.byCategory || {};
            const total = Object.values(categories).reduce((a, b) => a + b, 0);
            const data = Object.entries(categories).map(([name, value]) => ({ name: fmtKey(name), value }));
            if (!data.length) return <div style={{ padding: 20, textAlign: 'center', color: '#8590A6', fontSize: 13 }}>No complaint data available</div>;
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingTop: 8 }}>
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%" cy="50%"
                      innerRadius={46} outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {data.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [`${val} (${total ? (val/total*100).toFixed(1) : 0}%)`, 'Count']}
                      contentStyle={{ borderRadius: 10, border: '1px solid #EAEDF4', fontSize: 12, fontFamily: "'Hanken Grotesk',sans-serif" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {data.map((entry, idx) => {
                    const pct = total ? (entry.value / total * 100).toFixed(0) : 0;
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: PIE_COLORS[idx % PIE_COLORS.length], flexShrink: 0, display: 'inline-block' }} />
                        <span style={{ font: "500 12px 'Hanken Grotesk',sans-serif", color: '#16233C', flex: 1 }}>{entry.name}</span>
                        <span style={{ font: "600 12px 'Hanken Grotesk',sans-serif", color: '#8590A6' }}>{pct}% ({entry.value})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        <div className="dashboard-card">
          <h2 className="card-title">Complaint Status Distribution</h2>
          <div className="status-breakdown">
            {(() => {
              const statuses = dashboard?.metrics?.grievances?.byStatus || {};
              const total = Object.values(statuses).reduce((a, b) => a + b, 0);
              const statusColors = {
                NEW: '#3B82F6', ASSIGNED: '#F59E0B', IN_PROGRESS: '#8B5CF6',
                RESOLVED: '#10B981', CLOSED: '#6B7280', ESCALATED: '#EF4444',
              };
              return Object.entries(statuses).length > 0 ? (
                <div className="status-list">
                  {Object.entries(statuses).map(([status, count], idx) => {
                    const percentage = total > 0 ? (count / total * 100) : 0;
                    return (
                      <div key={idx} className="status-item">
                        <div className="status-info">
                          <span className="status-name">{statusLabels[status] || status}</span>
                          <span className="status-count">{count}</span>
                        </div>
                        <div className="status-bar-bg">
                          <div className="status-bar" style={{ width: `${percentage}%`, backgroundColor: statusColors[status] || '#9CA3AF' }} />
                        </div>
                        <span className="status-percentage">{percentage.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  <p>No complaint status data</p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Row 3 — Staff by Role + Complaint Trend: 2 equal columns */}
      <div className="ad-grid-2">
        <div className="dashboard-card">
          <h2 className="card-title">Staff by Role</h2>
          <div className="status-breakdown">
            {(() => {
              const roles = dashboard?.metrics?.users?.byRole || {};
              const total = Object.values(roles).reduce((a, b) => a + b, 0);
              const roleColors = {
                ADMIN: '#7C3AED', REPRESENTATIVE: '#DC2626',
                CONSTITUENCY_MANAGER: '#2563EB', FIELD_OFFICER: '#059669',
                CITIZEN: '#0891B2', MANAGER: '#EA580C',
              };
              return Object.entries(roles).length > 0 ? (
                <div className="status-list">
                  {Object.entries(roles).map(([r, count], idx) => {
                    const percentage = total > 0 ? (count / total * 100) : 0;
                    return (
                      <div key={idx} className="status-item">
                        <div className="status-info">
                          <span className="status-name">{roleLabels[r] || r}</span>
                          <span className="status-count">{count}</span>
                        </div>
                        <div className="status-bar-bg">
                          <div className="status-bar" style={{ width: `${percentage}%`, backgroundColor: roleColors[r] || '#9CA3AF' }} />
                        </div>
                        <span className="status-percentage">{percentage.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  <p>No user role data available</p>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="dashboard-card">
          <h2 className="card-title">Complaint Trend (Last 7 Days)</h2>
          <div className="chart-container">
            {trendDays && trendDays.length > 0 ? (
              <div className="simple-chart">
                {trendDays.map((day, idx) => (
                  <div key={idx} className="chart-bar">
                    <div className="bar" style={{ height: `${maxTrend > 0 ? (trendCounts[idx] / maxTrend) * 100 : 0}%` }} />
                    <span className="bar-label">{day}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                <p>No trend data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4 — Quick Actions: full width */}
      <div className="dashboard-card">
        <h2 className="card-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          {quickActions.map((action) => (
            <QuickActionBtn key={action.label} label={action.label} icon={action.icon} onClick={action.onClick} />
          ))}
        </div>
      </div>

    </div>
    </>
  );
}

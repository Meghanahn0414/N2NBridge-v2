import React, { useEffect, useState } from "react";
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
  FaHeartbeat,
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
  FaDatabase,
  FaServer,
  FaCheck,
  FaTimes,
  FaHdd,
} from "react-icons/fa";
import "../../../styles/AdminDashboard.css";
import { getAuthUser } from '../../../services/authStorage';

const StatCard = ({ label, value, trend, icon: Icon, color }) => {
  // Format number with commas
  const formatValue = (val) => {
    if (typeof val === 'string') return val; // Return as-is if string (e.g., "99.9%")
    if (typeof val === 'number') return val.toLocaleString();
    return val || "0";
  };

  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-card-header">
        <div className="stat-info">
          <p className="stat-label">{label}</p>
          <p className="stat-value">{formatValue(value)}</p>
        </div>
        <div className={`stat-icon ${color}`}>
          <Icon />
        </div>
      </div>
      {trend !== null && trend !== undefined && trend !== 0 && (
        <p className={`stat-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last 30 days
        </p>
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

const SystemStatusItem = ({ label, status, icon: Icon }) => (
  <div className="system-status-item">
    <div className="status-header">
      <span className="status-label">{label}</span>
      <div className={`status-indicator ${status === 'Healthy' || status === 'Up to date' || status === 'Online' ? 'healthy' : 'warning'}`}>
        <Icon className="status-icon" />
        <span>{status}</span>
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const role = getAuthRole();
  const user = getAuthUser();
  const userName = user?.fullName || user?.name || 'Admin';
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
        console.log("Dashboard data:", result);
        setDashboard(result);
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
        setError(err?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [role]);

  // Build dynamic stats from backend data
  const stats = dashboard ? [
    {
      label: "Total Citizens",
      value: dashboard?.metrics?.users?.total || 0,
      trend: dashboard?.metrics?.users?.trend || 0,
      icon: FaUsers,
      color: "blue",
    },
    // {
    //   label: "Active Users Today",
    //   value: dashboard?.metrics?.activeUsers?.active || dashboard?.activeUsers || 0,
    //   trend: dashboard?.metrics?.activeUsers?.trend || 0,
    //   icon: FaUserTie,
    //   color: "green",
    // },
    {
      label: "Total Complaints",
      value: dashboard?.metrics?.grievances?.total || 0,
      trend: dashboard?.metrics?.grievances?.trend || 0,
      icon: FaClipboardList,
      color: "orange",
    },
    {
      label: "Open Complaints",
      value: (dashboard?.metrics?.grievances?.byStatus?.NEW || 0) + (dashboard?.metrics?.grievances?.byStatus?.ASSIGNED || 0),
      trend: 0,
      icon: FaBell,
      color: "red",
    },
    {
      label: "Critical Alerts",
      value: dashboard?.metrics?.alerts?.byPriority?.CRITICAL || 0,
      trend: dashboard?.metrics?.alerts?.trend || 0,
      icon: FaExclamationTriangle,
      color: "pink",
    },
    {
      label: "Events Scheduled",
      value: dashboard?.metrics?.events?.totalEvents || 0,
      trend: dashboard?.metrics?.events?.trend || 0,
      icon: FaCalendarAlt,
      color: "purple",
    },
    // {
    //   label: "Active Staff",
    //   value: (dashboard?.metrics?.users?.byRole?.FIELD_OFFICER || 0) + (dashboard?.metrics?.users?.byRole?.MANAGER || 0) + (dashboard?.metrics?.users?.byRole?.REPRESENTATIVE || 0),
    //   trend: 0,
    //   icon: FaUsers,
    //   color: "teal",
    // },
    
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

  const teamData = dashboard?.teamPerformance || [];

  const recentActivity = dashboard?.recentActivity || [];

  if (isMobile) {
    return <AdminDashboardMobile dashboard={dashboard} loading={loading} />;
  }

  return (
    <>
      <PageHeader subtitle="Platform administration and oversight" />
      <div className="admin-dashboard-container">
      {loading && <div className="loading-message">Loading dashboard...</div>}
      {error && <div className="error-message">{error}</div>}

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            trend={stat.trend}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Charts Row - 3 Column Layout */}
      <div className="charts-row">
        {/* Real-Time Activity Feed */}
        <div className="dashboard-card">
          <div className="card-header-flex">
            <b><h2 className="card-title">Real-Time Activity Feed </h2></b>
            {/* <a href="#" className="view-all-link">View All</a> */}
          </div>
          <div className="activity-feed">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((item, idx) => (
                <div key={idx} className="activity-item">
                  <span className="activity-time">{item.time}</span>
                  <div className="activity-icon">
                    {item.type === 'COMPLAINT' && <FaClipboardList />}
                    {item.type === 'ALERT' && <FaExclamationTriangle />}
                    {item.type === 'EVENT' && <FaCalendarAlt />}
                    {!item.type && (idx % 3 === 0 && <FaClipboardList />) || (idx % 3 === 1 && <FaExclamationTriangle />) || (idx % 3 === 2 && <FaCalendarAlt />)}
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

        {/* Top Complaint Categories */}
        <div className="dashboard-card">
          <h2 className="card-title">Top Complaint Categories</h2>
          <div className="pie-chart-container">
            {Object.keys(dashboard?.metrics?.grievances?.byCategory || {}).length > 0 ? (
              <>
                <div className="pie-chart">
                  {(() => {
                    const categories = dashboard?.metrics?.grievances?.byCategory || {};
                    const total = Object.values(categories).reduce((a, b) => a + b, 0);
                    return Object.entries(categories).map((entry, idx) => {
                      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
                      const percentage = total > 0 ? (entry[1] / total * 100) : 0;
                      return (
                        <div 
                          key={idx} 
                          className="pie-item" 
                          style={{ background: colors[idx % colors.length], width: `${percentage}%` }}
                          title={`${entry[0]}: ${entry[1]} (${percentage.toFixed(1)}%)`}
                        ></div>
                      );
                    });
                  })()}
                </div>
                <div className="pie-legend">
                  {(() => {
                    const categories = dashboard?.metrics?.grievances?.byCategory || {};
                    const total = Object.values(categories).reduce((a, b) => a + b, 0);
                    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
                    return Object.entries(categories).map((entry, idx) => {
                      const percentage = total > 0 ? (entry[1] / total * 100) : 0;
                      return (
                        <div key={idx} className="legend-item">
                          <span className="legend-box" style={{background: colors[idx % colors.length]}}></span> 
                          {entry[0]} - {percentage.toFixed(0)}% ({entry[1]})
                        </div>
                      );
                    });
                  })()}
                </div>
              </>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                <p>No complaint data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Team Performance */}
        <div className="dashboard-card">
          <div className="card-header-flex">
            <h2 className="card-title">Team Performance (This Month)</h2>
            {/* <a href="#" className="view-all-link">View All</a> */}
          </div>
          <table className="team-table">
            <thead>
              <tr>
                <th>Team / Officer</th>
                <th>Tasks Assigned</th>
                <th>Completed</th>
                <th>Resolution Time</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {teamData && teamData.length > 0 ? (
                teamData.map((member, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="member-cell">
                        <div className="member-avatar">{member.name ? member.name.charAt(0) : '?'}</div>
                        <div className="member-info">
                          <p className="member-name">{member.name || 'Unknown'}</p>
                          <p className="member-role">{member.role || 'Officer'}</p>
                        </div>
                      </div>
                    </td>
                    <td>{member.assigned || 0}</td>
                    <td>{member.completed || 0}</td>
                    <td>{member.time || '0 Days'}</td>
                    <td><span className="stars">★ {member.rating || '0.0'}</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>No team data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complaint Status Breakdown */}
      <div className="charts-row">
        <div className="dashboard-card">
          <h2 className="card-title">Complaint Status Distribution</h2>
          <div className="status-breakdown">
            {(() => {
              const statuses = dashboard?.metrics?.grievances?.byStatus || {};
              const total = Object.values(statuses).reduce((a, b) => a + b, 0);
              const statusLabels = {
                NEW: 'New',
                ASSIGNED: 'Assigned',
                IN_PROGRESS: 'In Progress',
                RESOLVED: 'Resolved',
                CLOSED: 'Closed',
                ESCALATED: 'Escalated'
              };
              const statusColors = {
                NEW: '#3B82F6',
                ASSIGNED: '#F59E0B',
                IN_PROGRESS: '#8B5CF6',
                RESOLVED: '#10B981',
                CLOSED: '#6B7280',
                ESCALATED: '#EF4444'
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
                          <div 
                            className="status-bar" 
                            style={{ 
                              width: `${percentage}%`, 
                              backgroundColor: statusColors[status] || '#9CA3AF'
                            }}
                          ></div>
                        </div>
                        <span className="status-percentage">{percentage.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  <p>No complaint status data available</p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Alert Priority Breakdown */}
        <div className="dashboard-card">
          <h2 className="card-title">Alert Priority Distribution</h2>
          <div className="status-breakdown">
            {(() => {
              const priorities = dashboard?.metrics?.alerts?.byPriority || {};
              const total = Object.values(priorities).reduce((a, b) => a + b, 0);
              const priorityColors = {
                CRITICAL: '#EF4444',
                HIGH: '#F59E0B',
                MEDIUM: '#FBBF24',
                LOW: '#10B981'
              };
              
              return Object.entries(priorities).length > 0 ? (
                <div className="status-list">
                  {Object.entries(priorities).map(([priority, count], idx) => {
                    const percentage = total > 0 ? (count / total * 100) : 0;
                    return (
                      <div key={idx} className="status-item">
                        <div className="status-info">
                          <span className="status-name">{priority}</span>
                          <span className="status-count">{count}</span>
                        </div>
                        <div className="status-bar-bg">
                          <div 
                            className="status-bar" 
                            style={{ 
                              width: `${percentage}%`, 
                              backgroundColor: priorityColors[priority] || '#9CA3AF'
                            }}
                          ></div>
                        </div>
                        <span className="status-percentage">{percentage.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  <p>No alert data available</p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* User Roles Distribution */}
        <div className="dashboard-card">
          <h2 className="card-title">Staff by Role</h2>
          <div className="status-breakdown">
            {(() => {
              const roles = dashboard?.metrics?.users?.byRole || {};
              const total = Object.values(roles).reduce((a, b) => a + b, 0);
              const roleLabels = {
                ADMIN: 'Administrators',
                REPRESENTATIVE: 'Representatives',
                CONSTITUENCY_MANAGER: 'Constituency Mgrs',
                FIELD_OFFICER: 'Field Officers',
                CITIZEN: 'Citizens',
                MANAGER: 'Managers'
              };
              const roleColors = {
                ADMIN: '#7C3AED',
                REPRESENTATIVE: '#DC2626',
                CONSTITUENCY_MANAGER: '#2563EB',
                FIELD_OFFICER: '#059669',
                CITIZEN: '#0891B2',
                MANAGER: '#EA580C'
              };
              
              return Object.entries(roles).length > 0 ? (
                <div className="status-list">
                  {Object.entries(roles).map(([role, count], idx) => {
                    const percentage = total > 0 ? (count / total * 100) : 0;
                    return (
                      <div key={idx} className="status-item">
                        <div className="status-info">
                          <span className="status-name">{roleLabels[role] || role}</span>
                          <span className="status-count">{count}</span>
                        </div>
                        <div className="status-bar-bg">
                          <div 
                            className="status-bar" 
                            style={{ 
                              width: `${percentage}%`, 
                              backgroundColor: roleColors[role] || '#9CA3AF'
                            }}
                          ></div>
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
      </div>

      {/* Complaint Trend & System Status Row */}
      <div className="charts-row">
        {/* Complaint Trend Chart */}
        <div className="dashboard-card">
          <h2 className="card-title">Complaint Trend (Last 7 Days)</h2>
          <div className="chart-container">
            {trendDays && trendDays.length > 0 ? (
              <div className="simple-chart">
                {trendDays.map((day, idx) => (
                  <div key={idx} className="chart-bar">
                    <div className="bar" style={{ height: `${maxTrend > 0 ? (trendCounts[idx] / maxTrend) * 100 : 0}%` }}></div>
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

        {/* System Status */}
        <div className="dashboard-card">
          <h2 className="card-title">System Status</h2>
          <div className="system-status-grid">
            <SystemStatusItem label="Server Status" status="Online" icon={FaServer} />
            <SystemStatusItem label="Database" status="Healthy" icon={FaDatabase} />
            <SystemStatusItem label="API Services" status="Up to date" icon={FaCheck} />
            <SystemStatusItem label="Data Backup" status="Healthy" icon={FaHdd} />
          </div>
        </div>

        {/* Resolution Time Stats */}
        <div className="dashboard-card">
          <h2 className="card-title">Resolution Metrics</h2>
          <div className="metrics-list">
            <div className="metric-item">
              <span className="metric-label">Avg Resolution Time</span>
              <span className="metric-value">{dashboard?.metrics?.resolutionTime?.avgResolutionTime ? (dashboard.metrics.resolutionTime.avgResolutionTime / (1000 * 60 * 60 * 24)).toFixed(1) : '--'} days</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Min Resolution Time</span>
              <span className="metric-value">{dashboard?.metrics?.resolutionTime?.minResolutionTime ? (dashboard.metrics.resolutionTime.minResolutionTime / (1000 * 60 * 60 * 24)).toFixed(1) : '--'} days</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Max Resolution Time</span>
              <span className="metric-value">{dashboard?.metrics?.resolutionTime?.maxResolutionTime ? (dashboard.metrics.resolutionTime.maxResolutionTime / (1000 * 60 * 60 * 24)).toFixed(1) : '--'} days</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Resolved Complaints</span>
              <span className="metric-value">{dashboard?.metrics?.grievances?.byStatus?.RESOLVED || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="actions-row-2">
        {/* Quick Actions */}
        <div className="dashboard-card">
          <h2 className="card-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            {quickActions.map((action) => (
              <QuickActionBtn key={action.label} label={action.label} icon={action.icon} onClick={action.onClick} />
            ))}
          </div>
        </div>
      </div>


    </div>
    </>
  );
}

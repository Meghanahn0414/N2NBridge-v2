import React, { useEffect, useState } from "react";
import "./RepresentativeDashboard.css";
import {
  FaBell,
  FaClipboardList,
  FaLightbulb,
  FaChartLine,
  FaShieldAlt,
  FaUsers,
  FaCalendarAlt,
  FaCheckCircle,
} from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import api from "../../../shared/services/api";
import { getAuthRole } from "../../../services/authStorage";
import { getDashboardForRole } from "../../../shared/services/dashboardService";
import ConstituencyHeatMap from "../components/ConstituencyHeatMap";

const defaultSummaryCards = [
  { title: "Total Complaints", value: "-", detail: "Loading...", color: "#4338ca", icon: FaClipboardList },
  { title: "Resolved Complaints", value: "-", detail: "Loading...", color: "#10b981", icon: FaShieldAlt },
  { title: "Active Alerts", value: "-", detail: "Loading...", color: "#ef4444", icon: FaBell },
  { title: "Registered Citizens", value: "-", detail: "Loading...", color: "#8b5cf6", icon: FaUsers },
  { title: "Resolution Rate", value: "-", detail: "Loading...", color: "#0ea5e9", icon: FaChartLine },
];

const defaultComplaintStatus = [
  { name: "New", value: 0, color: "#4338ca" },
  { name: "Assigned", value: 0, color: "#8b5cf6" },
  { name: "In Progress", value: 0, color: "#f59e0b" },
  { name: "Resolved", value: 0, color: "#10b981" },
  { name: "Escalated", value: 0, color: "#ef4444" },
];

const defaultComplaintLegend = [
  { name: "High Priority", value: "-", color: "#4338ca" },
  { name: "Medium Priority", value: "-", color: "#8b5cf6" },
  { name: "Low Priority", value: "-", color: "#f59e0b" },
  { name: "Critical", value: "-", color: "#10b981" },
];

const priorityLabels = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  CRITICAL: "Critical",
};

const priorityColors = {
  HIGH: "#fb7185",
  MEDIUM: "#fbbf24",
  LOW: "#34d399",
  CRITICAL: "#dc2626",
};

const statusLabels = {
  NEW: "New",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  ESCALATED: "Escalated",
  CLOSED: "Closed",
};

const statusColors = {
  NEW: "#4338ca",
  ASSIGNED: "#8b5cf6",
  IN_PROGRESS: "#f59e0b",
  RESOLVED: "#10b981",
  ESCALATED: "#ef4444",
  CLOSED: "#94a3b8",
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getComplaintData = (dashboard) => {
  const statusCounts = dashboard?.metrics?.grievances?.byStatus || {};
  const orderedStatuses = ["NEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "ESCALATED", "CLOSED"];

  const result = orderedStatuses
    .filter((status) => statusCounts[status] != null)
    .map((status) => ({
      name: statusLabels[status] || status,
      value: statusCounts[status],
      color: statusColors[status] || COLORS[0],
    }));

  return result.length ? result : defaultComplaintStatus;
};

const getComplaintPriorityLegend = (dashboard) => {
  const priorityCounts = dashboard?.metrics?.alerts?.byPriority || {};
  const result = Object.entries(priorityCounts).map(([priority, value]) => ({
    name: priorityLabels[priority] || priority,
    value: String(value),
    color: priorityColors[priority] || "#94a3b8",
  }));

  return result.length ? result : defaultComplaintLegend;
};

const formatDuration = (value) => {
  if (value == null || value === 0) return "-";
  const minutes = Math.round(value / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
};

const getCampaignMetrics = (dashboard) => {
  const openComplaints = dashboard?.metrics?.grievances?.total;
  const criticalAlerts = dashboard?.metrics?.alerts?.byPriority?.CRITICAL;
  const totalEvents = dashboard?.metrics?.events?.totalEvents;
  const totalUsers = dashboard?.metrics?.users?.total;
  const avgResolution = dashboard?.metrics?.resolutionTime?.avgResolutionTime;

  return [
    { label: "Open Complaints", value: formatNumber(openComplaints) },
    { label: "Critical Alerts", value: formatNumber(criticalAlerts ?? dashboard?.metrics?.alerts?.total) },
    { label: "Total Events", value: formatNumber(totalEvents) },
    { label: "Total Users", value: formatNumber(totalUsers) },
    { label: "Avg Resolution", value: formatDuration(avgResolution) },
  ];
};

const getTeamMetrics = (dashboard) => {
  const officerCount = dashboard?.metrics?.users?.byRole?.FIELD_OFFICER ?? dashboard?.metrics?.users?.byRole?.OFFICER;
  const adminCount = dashboard?.metrics?.users?.byRole?.ADMIN;
  const openComplaints = dashboard?.metrics?.grievances?.total;
  const resolvedComplaints = dashboard?.metrics?.grievances?.byStatus?.RESOLVED;
  const openAlerts = dashboard?.metrics?.alerts?.byStatus?.OPEN ?? dashboard?.metrics?.alerts?.total;

  return [
    { label: "Active Officers", value: formatNumber(officerCount) },
    { label: "Admin Users", value: formatNumber(adminCount) },
    { label: "Open Complaints", value: formatNumber(openComplaints) },
    { label: "Resolved Complaints", value: formatNumber(resolvedComplaints) },
    { label: "Open Alerts", value: formatNumber(openAlerts) },
  ];
};

const getEngagementMetrics = (dashboard) => {
  const totalUsers = dashboard?.metrics?.users?.total;
  const totalEvents = dashboard?.metrics?.events?.totalEvents;
  const totalAlerts = dashboard?.metrics?.alerts?.total;
  const openComplaints = dashboard?.metrics?.grievances?.total;

  return [
    { label: "Total Users", value: formatNumber(totalUsers) },
    { label: "Total Events", value: formatNumber(totalEvents) },
    { label: "Total Alerts", value: formatNumber(totalAlerts) },
    { label: "Open Complaints", value: formatNumber(openComplaints) },
  ];
};

const getHeatMapData = (dashboard) => {
  const priorityCounts = dashboard?.metrics?.alerts?.byPriority || {};
  return [
    { label: "Critical", value: formatNumber(priorityCounts.CRITICAL), className: "rep-map-card rep-map-high" },
    { label: "High", value: formatNumber(priorityCounts.HIGH), className: "rep-map-card rep-map-medium" },
    { label: "Medium", value: formatNumber(priorityCounts.MEDIUM), className: "rep-map-card rep-map-low" },
    { label: "Low", value: formatNumber(priorityCounts.LOW), className: "rep-map-card rep-map-low" },
  ];
};

const getTrendSummary = (dashboard) => {
  const statusCounts = dashboard?.metrics?.grievances?.byStatus || {};
  const orderedStatuses = ["NEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "ESCALATED", "CLOSED"];

  return orderedStatuses
    .filter((status) => statusCounts[status] != null)
    .map((status) => ({
      label: statusLabels[status] || status,
      value: formatNumber(statusCounts[status]),
      color: statusColors[status] || COLORS[0],
    }));
};

const getAiInsights = (dashboard) => {
  const totalComplaints = dashboard?.metrics?.grievances?.total ?? 0;
  const resolvedComplaints = dashboard?.metrics?.grievances?.byStatus?.RESOLVED ?? 0;
  const criticalAlerts = dashboard?.metrics?.alerts?.byPriority?.CRITICAL ?? 0;
  const totalEvents = dashboard?.metrics?.events?.totalEvents ?? 0;

  const insights = [];

  if (criticalAlerts > 0) {
    insights.push({
      title: "Critical alerts need immediate action",
      detail: `${criticalAlerts} critical alert${criticalAlerts > 1 ? "s" : ""} currently active.`,
    });
  }

  if (totalComplaints > 0) {
    const unresolved = totalComplaints - resolvedComplaints;
    insights.push({
      title: "Complaint backlog snapshot",
      detail: `${formatNumber(unresolved)} unresolved out of ${formatNumber(totalComplaints)} total complaints.`,
    });
  }

  if (totalEvents > 0) {
    insights.push({
      title: "Event engagement overview",
      detail: `${formatNumber(totalEvents)} events tracked in backend metrics.`,
    });
  }

  if (!insights.length) {
    insights.push({ title: "No insights available", detail: "Dashboard metrics are still loading." });
  }

  return insights.slice(0, 3);
};

const COLORS = ["#4338ca", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"];

const formatNumber = (value) => (value == null ? "-" : value);
const computeResolutionRate = (resolved, total) => {
  if (total == null || total === 0) return "-";
  return `${Math.round((resolved / total) * 100)}%`;
};

const getSummaryCards = (dashboard) => {
  const hasData = Boolean(dashboard);
  const totalComplaints = hasData ? dashboard?.metrics?.grievances?.total : null;
  const resolvedComplaints = hasData ? dashboard?.metrics?.grievances?.byStatus?.RESOLVED : null;
  const activeAlerts = hasData ? dashboard?.metrics?.alerts?.total : null;
  const registeredCitizens = hasData ? dashboard?.metrics?.users?.total : null;

  return [
    {
      title: "Total Complaints",
      value: formatNumber(totalComplaints),
      detail: "Current complaint count",
      color: "#4338ca",
      icon: FaClipboardList,
    },
    {
      title: "Resolved Complaints",
      value: formatNumber(resolvedComplaints),
      detail: "Based on latest dashboard metrics",
      color: "#10b981",
      icon: FaShieldAlt,
    },
    {
      title: "Active Alerts",
      value: formatNumber(activeAlerts),
      detail: "Current active alerts",
      color: "#ef4444",
      icon: FaBell,
    },
    {
      title: "Registered Citizens",
      value: formatNumber(registeredCitizens),
      detail: "Constituency user records",
      color: "#8b5cf6",
      icon: FaUsers,
    },
    {
      title: "Resolution Rate",
      value: computeResolutionRate(resolvedComplaints, totalComplaints),
      detail: "Calculated from resolved issues",
      color: "#0ea5e9",
      icon: FaChartLine,
    },
  ];
};

export default function RepresentativeDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const role = getAuthRole();

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const [dashboardResult, alertsResult, eventsResult] = await Promise.all([
          getDashboardForRole(role),
          api.get("/api/alerts?per_page=4"),
          api.get("/api/events?per_page=4"),
        ]);

        setDashboard(dashboardResult);
        setAlerts(Array.isArray(alertsResult) ? alertsResult : alertsResult.data ?? []);
        setEvents(Array.isArray(eventsResult) ? eventsResult : eventsResult.data ?? []);
      } catch (err) {
        console.error("Failed to load representative dashboard:", err);
        setError(err?.response?.data?.message || err.message || "Unable to fetch dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [role]);

  const complaintData = getComplaintData(dashboard);
  const complaintCategories = getComplaintPriorityLegend(dashboard);
  const summaryCards = getSummaryCards(dashboard);
  const campaignMetrics = getCampaignMetrics(dashboard);
  const teamMetrics = getTeamMetrics(dashboard);
  const engagementMetrics = getEngagementMetrics(dashboard);
  const heatMapLevels = getHeatMapData(dashboard);
  const trendSummary = getTrendSummary(dashboard);
  const aiInsights = getAiInsights(dashboard);

  return (
    <div className="rep-dashboard-page">
      {loading && (
        <div className="rep-dashboard-status rep-dashboard-loading">
          Loading dashboard data from backend...
        </div>
      )}

      {error && (
        <div className="rep-dashboard-status rep-dashboard-error">
          {error}
        </div>
      )}

      <section className="rep-summary-grid">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.title} className="rep-summary-card">
              <div className="rep-summary-card-left">
                <div className="rep-card-icon" style={{ background: `${card.color}22`, color: card.color }}>
                  <Icon />
                </div>
                <div>
                  <div className="rep-card-title">{card.title}</div>
                  <div className="rep-card-detail">{card.detail}</div>
                </div>
              </div>
              <div className="rep-card-value">{card.value}</div>
            </article>
          );
        })}
      </section>

      <section className="rep-main-grid rep-top-grid">
        <article className="rep-panel rep-alert-panel">
          <div className="rep-panel-header">
            <div>
              <h2>Critical Alerts</h2>
              <p className="rep-panel-subtitle">Highest priority issues currently active in the constituency.</p>
            </div>
            <button className="rep-panel-button">View All</button>
          </div>
          <div className="rep-alert-list">
            {alerts.map((alert) => (
              <div key={alert.id || alert.alertNumber} className="rep-alert-item">
                <div>
                  <p className="rep-alert-title">{alert.description || alert.alertType}</p>
                  <p className="rep-alert-meta">{formatDateTime(alert.createdAt)}</p>
                </div>
                <span className={`rep-alert-badge ${String(alert.priority || "LOW").toLowerCase()}`}>
                  {priorityLabels[alert.priority] || alert.priority || "Low"}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="rep-panel rep-overview-panel">
          <div className="rep-panel-header">
            <div>
              <h2>Complaint Overview</h2>
              <p className="rep-panel-subtitle">Live category breakdown and status distribution for all incoming complaints.</p>
            </div>
            <button className="rep-panel-button">View All</button>
          </div>
          <div className="rep-overview-body">
            <div className="rep-donut-chart">
              <ResponsiveContainer width="100%" height={60}>
                <PieChart>
                  <Pie
                    data={complaintData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={42}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {complaintData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="rep-donut-center">
                <span>{dashboard?.metrics?.grievances?.total ?? "-"}</span>
                <small>Total</small>
              </div>
            </div>
            <div className="rep-legend-list">
              {complaintCategories.map((category) => (
                <div key={category.name} className="rep-legend-item">
                  <span className="rep-legend-dot" style={{ background: category.color }} />
                  <span>{category.name}</span>
                  <strong>{category.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="rep-panel rep-insights-panel">
          <div className="rep-panel-header">
            <div>
              <h2>AI Constituency Insights</h2>
              <p className="rep-panel-subtitle">Recommended actions and sentiment signals for fast decision-making.</p>
            </div>
            <button className="rep-panel-button">View Details</button>
          </div>
          <div className="rep-insight-list">
            {aiInsights.map((item) => (
              <div key={item.title} className="rep-insight-item">
                <p className="rep-insight-title">{item.title}</p>
                <p className="rep-insight-detail">{item.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rep-main-grid rep-secondary-grid">
        <article className="rep-panel rep-map-panel">
          <div className="rep-panel-header">
            <div>
              <h2>Constituency Heat Map</h2>
              <p className="rep-panel-subtitle">Alert intensity by priority from backend metrics.</p>
            </div>
          </div>
          <ConstituencyHeatMap 
            data={heatMapLevels.map((item, idx) => ({
              id: idx + 1,
              name: item.label,
              value: parseInt(item.value) || 0,
              level: item.className?.split(' ').find(c => c.includes('high') || c.includes('medium') || c.includes('low'))?.replace('rep-map-', ''),
            }))}
            onViewFullMap={() => console.log('View full map clicked')}
          />
        </article>

        <article className="rep-panel rep-events-panel">
          <div className="rep-panel-header">
            <div>
              <h2>Upcoming Events</h2>
              <p className="rep-panel-subtitle">Community events scheduled for the coming weeks.</p>
            </div>
            <button className="rep-panel-button">View All</button>
          </div>
          <div className="rep-event-list">
            {events.map((event) => (
              <div key={event.id || event.eventName} className="rep-event-item">
                <div>
                  <p className="rep-event-title">{event.eventName || event.title}</p>
                  <p className="rep-event-meta">{formatDateTime(event.eventDate)}</p>
                </div>
                <span className="rep-event-registered">{event.registrationCount ?? event.registered ?? "-"} Registered</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rep-panel rep-campaign-panel">
          <div className="rep-panel-header">
            <div>
              <h2>Campaign Performance</h2>
              <p className="rep-panel-subtitle">Operational metrics sourced from backend data.</p>
            </div>
            <button className="rep-panel-button">View All</button>
          </div>
          <div className="rep-campaign-list">
            {campaignMetrics.map((metric) => (
              <div key={metric.label} className="rep-campaign-stat">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rep-bottom-row">
        <article className="rep-big-card rep-team-card">
          <div className="rep-panel-header">
            <div>
              <h2>Team Performance</h2>
              <p className="rep-panel-subtitle">Officer counts and complaint resolution metrics.</p>
            </div>
            <button className="rep-panel-button">View All</button>
          </div>
          <div className="rep-stat-card-list">
            {teamMetrics.slice(0, 3).map((metric) => (
              <div key={metric.label} className="rep-stat-card">
                <div>
                  <div className="rep-card-label">{metric.label}</div>
                  <div className="rep-card-value">{metric.value}</div>
                </div>
                <FaUsers className="rep-stat-icon" />
              </div>
            ))}
          </div>
        </article>

        <article className="rep-big-card rep-trend-card">
          <div className="rep-panel-header">
            <div>
              <h2>Complaint Trends</h2>
              <p className="rep-panel-subtitle">Current complaint status breakdown from backend metrics.</p>
            </div>
            <button className="rep-panel-button">View Details</button>
          </div>
          <div className="rep-trend-summary">
            {trendSummary.length ? (
              trendSummary.map((item) => (
                <div key={item.label} className="rep-trend-item">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))
            ) : (
              <div className="rep-empty-state">No complaint status data available yet.</div>
            )}
          </div>
        </article>

        <article className="rep-big-card rep-sentiment-card">
          <div className="rep-panel-header">
            <div>
              <h2>Citizen Engagement</h2>
              <p className="rep-panel-subtitle">Recent sentiment and feedback across the constituency.</p>
            </div>
            <button className="rep-panel-button">View Feedback</button>
          </div>
          <div className="rep-sentiment-panel">
            {engagementMetrics.map((metric) => (
              <div key={metric.label} className="rep-sentiment-row">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

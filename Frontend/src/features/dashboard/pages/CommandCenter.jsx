import React, { useEffect, useState } from "react";
import "../../../styles/CommandCenter.css"
import { getAuthRole } from "../../../services/authStorage";
import { getDashboardForRole } from "../../../shared/services/dashboardService";
import {
  FaBell,
  FaClipboardList,
  FaMap,
  FaHome,
  FaEllipsisH,
  FaPlus,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaLightbulb,
  FaShieldAlt,
  FaChartLine,
} from "react-icons/fa";

const quickActions = [
  { label: "Create Event", icon: FaCalendarAlt },
  { label: "Send Message", icon: FaBell },
  { label: "Launch Survey", icon: FaLightbulb },
  { label: "Review Complaints", icon: FaClipboardList },
  { label: "Generate Report", icon: FaChartLine },
];

const navigationTabs = [
  { label: "Home", icon: FaHome },
  { label: "Complaints", icon: FaClipboardList },
  { label: "Alerts", icon: FaBell },
  { label: "Map", icon: FaMap },
  { label: "More", icon: FaEllipsisH },
];

const formatNumber = (value) => (value == null ? "-" : value);

const getSummaryCards = (dashboard, role) => {
  const isAdmin = ["ADMIN", "REPRESENTATIVE", "CONSTITUENCY_MANAGER"].includes(role);
  const isOfficer = role === "FIELD_OFFICER";
  const isCitizen = role === "CITIZEN";

  if (isOfficer) {
    return [
      { label: "Pending Tasks", value: formatNumber(dashboard?.pendingTasks), accent: "bg-emerald-50", icon: FaClipboardList },
      { label: "Pending Grievances", value: formatNumber(dashboard?.pendingGrievances), accent: "bg-rose-50", icon: FaExclamationTriangle },
      { label: "Pending Alerts", value: formatNumber(dashboard?.pendingAlerts), accent: "bg-sky-50", icon: FaBell },
      { label: "Assigned Items", value: formatNumber((dashboard?.tasks?.length || 0) + (dashboard?.grievances?.length || 0)), accent: "bg-indigo-50", icon: FaChartLine },
    ];
  }

  if (isCitizen) {
    return [
      { label: "Total Grievances", value: formatNumber(dashboard?.grievanceSummary?.total), accent: "bg-emerald-50", icon: FaClipboardList },
      { label: "Pending Grievances", value: formatNumber(dashboard?.grievanceSummary?.pending), accent: "bg-rose-50", icon: FaExclamationTriangle },
      { label: "Registered Events", value: formatNumber(dashboard?.registeredEvents?.length), accent: "bg-sky-50", icon: FaCalendarAlt },
      { label: "Recent Alerts", value: formatNumber(dashboard?.recentNotifications?.length), accent: "bg-indigo-50", icon: FaBell },
    ];
  }

  return [
    { label: "Open Complaints", value: formatNumber(dashboard?.metrics?.grievances?.total), accent: "bg-emerald-50", icon: FaClipboardList },
    { label: "Critical Alerts", value: formatNumber(dashboard?.metrics?.alerts?.byPriority?.CRITICAL ?? dashboard?.metrics?.alerts?.total), accent: "bg-rose-50", icon: FaExclamationTriangle },
    { label: "Total Users", value: formatNumber(dashboard?.metrics?.users?.total), accent: "bg-sky-50", icon: FaShieldAlt },
    { label: "Total Events", value: formatNumber(dashboard?.metrics?.events?.totalEvents), accent: "bg-indigo-50", icon: FaChartLine },
  ];
};

const getActionItems = (dashboard, role) => {
  const isAdmin = ["ADMIN", "REPRESENTATIVE", "CONSTITUENCY_MANAGER"].includes(role);
  const isOfficer = role === "FIELD_OFFICER";
  const isCitizen = role === "CITIZEN";

  if (isOfficer) {
    return [
      {
        title: "Assigned Grievances",
        subtitle: `${formatNumber(dashboard?.pendingGrievances)} open cases`,
        description: "Grievances assigned to you need updates.",
        button: "Review",
        icon: FaClipboardList,
        accent: "bg-amber-100",
      },
      {
        title: "Assigned Alerts",
        subtitle: `${formatNumber(dashboard?.pendingAlerts)} unresolved`,
        description: "Alerts require immediate field response.",
        button: "Manage",
        icon: FaBell,
        accent: "bg-rose-100",
      },
      {
        title: "Pending Tasks",
        subtitle: `${formatNumber(dashboard?.pendingTasks)} tasks outstanding`,
        description: "Complete assigned tasks to clear your queue.",
        button: "Open",
        icon: FaCalendarAlt,
        accent: "bg-sky-100",
      },
    ];
  }

  if (isCitizen) {
    return [
      {
        title: "Open Grievances",
        subtitle: `${formatNumber(dashboard?.grievanceSummary?.pending)} pending`,
        description: "Track unresolved grievances and updates.",
        button: "View",
        icon: FaClipboardList,
        accent: "bg-amber-100",
      },
      {
        title: "Recent Notifications",
        subtitle: `${formatNumber(dashboard?.recentNotifications?.length)} updates`,
        description: "Check the latest messages and alerts.",
        button: "Open",
        icon: FaBell,
        accent: "bg-rose-100",
      },
      {
        title: "Registered Events",
        subtitle: `${formatNumber(dashboard?.registeredEvents?.length)} events`,
        description: "See the events you are registered for.",
        button: "Explore",
        icon: FaCalendarAlt,
        accent: "bg-sky-100",
      },
    ];
  }

  return [
    {
      title: "Critical Alerts",
      subtitle: `${formatNumber(dashboard?.metrics?.alerts?.byPriority?.CRITICAL ?? dashboard?.metrics?.alerts?.total)} active`,
      description: "High-priority alerts need immediate action.",
      button: "Review",
      icon: FaBell,
      accent: "bg-rose-100",
    },
    {
      title: "Open Complaints",
      subtitle: `${formatNumber(dashboard?.metrics?.grievances?.byStatus?.OPEN ?? dashboard?.metrics?.grievances?.total)} unresolved`,
      description: "Monitor complaint backlog and response time.",
      button: "Inspect",
      icon: FaClipboardList,
      accent: "bg-amber-100",
    },
    {
      title: "Event Health",
      subtitle: `${formatNumber(dashboard?.metrics?.events?.totalEvents)} planned`,
      description: "Keep track of constituency events and turnout.",
      button: "Review",
      icon: FaCalendarAlt,
      accent: "bg-sky-100",
    },
  ];
};

const getMapInsight = (dashboard) => {
  const openComplaints = dashboard?.metrics?.grievances?.byStatus?.OPEN ?? dashboard?.metrics?.grievances?.total;
  const criticalAlerts = dashboard?.metrics?.alerts?.byPriority?.CRITICAL ?? dashboard?.metrics?.alerts?.total;

  if (openComplaints == null && criticalAlerts == null) {
    return "Map insights are unavailable until dashboard data loads.";
  }

  if (criticalAlerts > (openComplaints || 0) * 0.4) {
    return `Critical alerts are concentrated in high-priority zones; review the map for urgent action.`;
  }

  if (openComplaints > 0 || criticalAlerts > 0) {
    return `There are ${formatNumber(openComplaints)} open complaints and ${formatNumber(criticalAlerts)} critical alerts reported on the map.`;
  }

  return "Map overview shows no active complaints or alerts at the moment.";
};

const getAiInsights = (dashboard) => {
  const insights = [];
  const openComplaints = dashboard?.metrics?.grievances?.byStatus?.OPEN ?? dashboard?.metrics?.grievances?.total;
  const criticalAlerts = dashboard?.metrics?.alerts?.byPriority?.CRITICAL ?? dashboard?.metrics?.alerts?.total;
  const satisfaction = dashboard?.summary?.citizenSatisfaction;

  if (criticalAlerts > 0) {
    insights.push({
      title: `${formatNumber(criticalAlerts)} critical alerts require immediate response.`,
      action: "Review urgent alert clusters.",
    });
  }

  if (openComplaints > 0) {
    insights.push({
      title: `${formatNumber(openComplaints)} open complaints are still unresolved.`,
      action: "Prioritize grievance triage.",
    });
  }

  if (typeof satisfaction === "number") {
    insights.push({
      title: `Citizen satisfaction is at ${formatNumber(satisfaction)} / 5.`,
      action: "Plan outreach and grievance camps.",
    });
  }

  if (!insights.length) {
    insights.push({
      title: "No AI-driven insights are available yet.",
      action: "Dashboard data is still loading.",
    });
  }

  return insights.slice(0, 2);
};


export default function CommandCenter({ title = "Dashboard", subtitle }) {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const role = getAuthRole();

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const result = await getDashboardForRole(role);
        setDashboard(result);
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
        setError(err?.response?.data?.message || err.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [role]);

  const summaryCards = getSummaryCards(dashboard, role);
  const actionItems = getActionItems(dashboard, role);
  const isCitizen = role === "CITIZEN";
  const mapInsightText = getMapInsight(dashboard);
  const aiInsights = getAiInsights(dashboard);
  const overviewItems = [
    {
      label: "Open Complaints",
      value: formatNumber(dashboard?.metrics?.grievances?.byStatus?.OPEN ?? dashboard?.metrics?.grievances?.total),
    },
    {
      label: "Critical Alerts",
      value: formatNumber(dashboard?.metrics?.alerts?.byPriority?.CRITICAL ?? dashboard?.metrics?.alerts?.total),
    },
    {
      label: "Total Users",
      value: formatNumber(dashboard?.metrics?.users?.total),
    },
  ];

  return (
    <div className="rep-dashboard-page min-h-screen bg-slate-50 pb-32">
      <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8" style={{ maxWidth: isCitizen ? '900px' : '1280px' }}>

        {loading && (
          <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-700 shadow-sm">
            Loading dashboard data from backend...
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-4 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">{card.label}</p>
                    <p className="mt-4 text-3xl font-semibold text-slate-900">{card.value}</p>
                  </div>
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-3xl ${card.accent} text-slate-900`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="mt-8 grid gap-4 xl:grid-cols-[2fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Action Center</h2>
                  <p className="mt-2 text-sm text-slate-500">Items requiring your immediate attention.</p>
                </div>
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-700">
                  {actionItems.length} priorities
                </span>
              </div>
              <div className="space-y-4">
                {actionItems.map((item) => {
                  const ActionIcon = item.icon;
                  return (
                    <div key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 inline-flex h-11 w-11 items-center justify-center rounded-3xl ${item.accent} text-slate-900`}>
                          <ActionIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{item.subtitle}</p>
                          <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <button className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
                          {item.button}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Constituency Overview</h2>
                  <p className="mt-2 text-sm text-slate-500">A quick briefing of the latest metrics and issue clusters.</p>
                </div>
                <FaMap className="h-5 w-5 text-slate-400" />
              </div>
              <div className="space-y-3">
                {overviewItems.map((item) => (
                  <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                    <span className="font-medium text-slate-900">{item.label}:</span> {item.value}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">GIS Map</h2>
                  <p className="mt-2 text-sm text-slate-500">Complaint heatmap, alert pins, event and team location layers.</p>
                </div>
                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  Live
                </span>
              </div>
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900/5 px-4 py-6 text-slate-700">
                <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
                  <span>Ward boundaries</span>
                  <span>Heatmap</span>
                </div>
                <div className="h-72 rounded-3xl bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)] p-4 shadow-inner">
                  <div className="pointer-events-none flex h-full items-end justify-between gap-4">
                    <div className="mt-auto w-1/2 rounded-3xl bg-white/70 p-4 text-sm text-slate-700 shadow-sm">
                      <p className="font-semibold text-slate-900">Heatmap layer</p>
                      <p className="mt-2 text-xs text-slate-500">Trending complaints by ward.</p>
                    </div>
                    <div className="grid gap-2 text-right text-xs text-slate-500">
                      <span>Alert pins</span>
                      <span>Event markers</span>
                      <span>Officer locations</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Map Insights</p>
                <p className="mt-2">{mapInsightText}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">AI Insights</h2>
            <p className="mt-2 text-sm text-slate-500">Actionable recommendations from constituent trends.</p>
            <div className="mt-6 space-y-4">
              {aiInsights.map((insight) => (
                <div key={insight.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-3 text-slate-900">
                    <FaLightbulb className="h-5 w-5 text-amber-500" />
                    <p className="font-semibold">AI Insight</p>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{insight.title}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">Recommended Action: {insight.action}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Quick Actions</h2>
                <p className="mt-2 text-sm text-slate-500">Fast paths for the most common tasks.</p>
              </div>
              <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700">
                Tap to act
              </span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {quickActions.slice(0, 4).map((action) => {
                const ActionIcon = action.icon;
                return (
                  <button key={action.label} className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm">
                      <ActionIcon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{action.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Tip:</span> Tap the floating action button for additional tasks and quick launches.
            </div>
          </div>
        </section>
      </div>

      <button className="dashboard-fab" onClick={() => setShowQuickActions((current) => !current)} aria-label="Open quick actions">
        <FaPlus className="h-5 w-5" />
      </button>
      {showQuickActions && (
        <div className="dashboard-fab-menu">
          <ul>
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <li key={action.label}>
                  <button type="button">
                    <Icon className="h-4 w-4 text-slate-700" />
                    {action.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <nav className="dashboard-bottom-nav">
        {navigationTabs.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button key={tab.label} type="button">
              <TabIcon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

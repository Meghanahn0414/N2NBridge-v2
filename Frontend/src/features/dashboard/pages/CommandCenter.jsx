import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../../styles/CommandCenter.css"
import { getAuthRole } from "../../../services/authStorage";
import { getDashboardForRole } from "../../../shared/services/dashboardService";
import { ROUTES } from "../../../app/routes/RouteConstants";
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
import PageHeader from "../../../components/PageHeader";

const getAdminQuickActions = (t) => [
  { label: t("create_event"), icon: FaCalendarAlt },
  { label: t("send_message"), icon: FaBell },
  { label: t("launch_survey"), icon: FaLightbulb },
  { label: t("review_complaints"), icon: FaClipboardList },
  { label: t("generate_report"), icon: FaChartLine },
];

const getOfficerQuickActions = (t) => [
  { label: t("my_grievances"), icon: FaClipboardList, route: ROUTES.fieldGrievances },
  { label: t("alerts"), icon: FaBell, route: ROUTES.fieldAlerts },
  { label: t("my_profile"), icon: FaShieldAlt, route: ROUTES.fieldProfile },
  { label: t("dashboard"), icon: FaHome, route: ROUTES.field },
];

const getNavigationTabs = (t) => [
  { label: t("home"), icon: FaHome },
  { label: t("complaints"), icon: FaClipboardList },
  { label: t("alerts"), icon: FaBell },
  { label: t("map"), icon: FaMap },
  { label: t("more"), icon: FaEllipsisH },
];

const formatNumber = (value) => (value == null ? "-" : value);

const getSummaryCards = (dashboard, role, t) => {
  const isOfficer = role === "FIELD_OFFICER";
  const isCitizen = role === "CITIZEN";

  if (isOfficer) {
    return [
      { label: t("pending_tasks"), value: formatNumber(dashboard?.pendingTasks), accent: "bg-emerald-50", icon: FaClipboardList },
      { label: t("pending_grievances"), value: formatNumber(dashboard?.pendingGrievances), accent: "bg-rose-50", icon: FaExclamationTriangle },
      { label: t("pending_alerts"), value: formatNumber(dashboard?.pendingAlerts), accent: "bg-sky-50", icon: FaBell },
      { label: t("assigned_items"), value: formatNumber((dashboard?.tasks?.length || 0) + (dashboard?.grievances?.length || 0)), accent: "bg-indigo-50", icon: FaChartLine },
    ];
  }

  if (isCitizen) {
    return [
      { label: t("total_grievances"), value: formatNumber(dashboard?.grievanceSummary?.total), accent: "bg-emerald-50", icon: FaClipboardList },
      { label: t("pending_grievances"), value: formatNumber(dashboard?.grievanceSummary?.pending), accent: "bg-rose-50", icon: FaExclamationTriangle },
      { label: t("registered_events"), value: formatNumber(dashboard?.registeredEvents?.length), accent: "bg-sky-50", icon: FaCalendarAlt },
      { label: t("recent_alerts"), value: formatNumber(dashboard?.recentNotifications?.length), accent: "bg-indigo-50", icon: FaBell },
    ];
  }

  return [
    { label: t("open_complaints"), value: formatNumber(dashboard?.metrics?.grievances?.total), accent: "bg-emerald-50", icon: FaClipboardList },
    { label: t("critical_alerts"), value: formatNumber(dashboard?.metrics?.alerts?.byPriority?.CRITICAL ?? dashboard?.metrics?.alerts?.total), accent: "bg-rose-50", icon: FaExclamationTriangle },
    { label: t("total_users"), value: formatNumber(dashboard?.metrics?.users?.total), accent: "bg-sky-50", icon: FaShieldAlt },
    { label: t("total_events"), value: formatNumber(dashboard?.metrics?.events?.totalEvents), accent: "bg-indigo-50", icon: FaChartLine },
  ];
};

const getActionItems = (dashboard, role, t) => {
  const isOfficer = role === "FIELD_OFFICER";
  const isCitizen = role === "CITIZEN";

  if (isOfficer) {
    return [
      {
        title: t("assigned_grievances"),
        subtitle: t("open_cases", { count: formatNumber(dashboard?.pendingGrievances) }),
        description: t("grievances_assigned_desc"),
        button: t("review"),
        icon: FaClipboardList,
        accent: "bg-amber-100",
        route: ROUTES.fieldGrievances,
      },
      {
        title: t("assigned_alerts"),
        subtitle: t("unresolved_count", { count: formatNumber(dashboard?.pendingAlerts) }),
        description: t("alerts_field_response"),
        button: t("manage"),
        icon: FaBell,
        accent: "bg-rose-100",
        route: ROUTES.fieldAlerts,
      },
    ];
  }

  if (isCitizen) {
    return [
      {
        title: t("open_grievances"),
        subtitle: t("pending_count", { count: formatNumber(dashboard?.grievanceSummary?.pending) }),
        description: t("track_grievances_desc"),
        button: t("view"),
        icon: FaClipboardList,
        accent: "bg-amber-100",
      },
      {
        title: t("recent_notifications"),
        subtitle: t("updates_count", { count: formatNumber(dashboard?.recentNotifications?.length) }),
        description: t("check_messages_desc"),
        button: t("open"),
        icon: FaBell,
        accent: "bg-rose-100",
      },
      {
        title: t("registered_events"),
        subtitle: t("events_count", { count: formatNumber(dashboard?.registeredEvents?.length) }),
        description: t("see_events_desc"),
        button: t("explore"),
        icon: FaCalendarAlt,
        accent: "bg-sky-100",
      },
    ];
  }

  return [
    {
      title: t("critical_alerts"),
      subtitle: t("active_count", { count: formatNumber(dashboard?.metrics?.alerts?.byPriority?.CRITICAL ?? dashboard?.metrics?.alerts?.total) }),
      description: t("critical_alerts_desc"),
      button: t("review"),
      icon: FaBell,
      accent: "bg-rose-100",
    },
    {
      title: t("open_complaints"),
      subtitle: t("open_unresolved", { count: formatNumber(dashboard?.metrics?.grievances?.byStatus?.OPEN ?? dashboard?.metrics?.grievances?.total) }),
      description: t("monitor_complaints_desc"),
      button: t("inspect"),
      icon: FaClipboardList,
      accent: "bg-amber-100",
    },
    {
      title: t("event_health"),
      subtitle: t("planned_count", { count: formatNumber(dashboard?.metrics?.events?.totalEvents) }),
      description: t("track_events_desc"),
      button: t("review"),
      icon: FaCalendarAlt,
      accent: "bg-sky-100",
    },
  ];
};

const getMapInsight = (dashboard, t) => {
  const openComplaints = dashboard?.metrics?.grievances?.byStatus?.OPEN ?? dashboard?.metrics?.grievances?.total;
  const criticalAlerts = dashboard?.metrics?.alerts?.byPriority?.CRITICAL ?? dashboard?.metrics?.alerts?.total;

  if (openComplaints == null && criticalAlerts == null) {
    return t("map_insights_unavailable");
  }
  if (criticalAlerts > (openComplaints || 0) * 0.4) {
    return t("map_insights_critical");
  }
  if (openComplaints > 0 || criticalAlerts > 0) {
    return t("map_insights_active", { open: formatNumber(openComplaints), critical: formatNumber(criticalAlerts) });
  }
  return t("map_insights_clear");
};

const getAiInsights = (dashboard, role, t) => {
  const insights = [];
  const isOfficer = role === "FIELD_OFFICER";

  if (isOfficer) {
    const pending = dashboard?.pendingGrievances ?? 0;
    const alerts = dashboard?.pendingAlerts ?? 0;

    if (pending > 5) {
      insights.push({
        title: t("ai_officer_many_grievances_title", { count: pending }),
        action: t("ai_officer_many_grievances_action"),
      });
    } else if (pending > 0) {
      insights.push({
        title: t(pending > 1 ? "ai_officer_few_grievances_title_other" : "ai_officer_few_grievances_title_one", { count: pending }),
        action: t("ai_officer_few_grievances_action"),
      });
    }

    if (alerts > 0) {
      insights.push({
        title: t(alerts > 1 ? "ai_officer_alerts_title_other" : "ai_officer_alerts_title_one", { count: alerts }),
        action: t("ai_officer_alerts_action"),
      });
    }

    if (!insights.length) {
      insights.push({
        title: t("ai_officer_clear_title"),
        action: t("ai_officer_clear_action"),
      });
    }
    return insights.slice(0, 2);
  }

  const openComplaints = dashboard?.metrics?.grievances?.byStatus?.OPEN ?? dashboard?.metrics?.grievances?.total;
  const criticalAlerts = dashboard?.metrics?.alerts?.byPriority?.CRITICAL ?? dashboard?.metrics?.alerts?.total;
  const satisfaction = dashboard?.summary?.citizenSatisfaction;

  if (criticalAlerts > 0) {
    insights.push({ title: t("ai_critical_alerts_title", { count: formatNumber(criticalAlerts) }), action: t("ai_critical_alerts_action") });
  }
  if (openComplaints > 0) {
    insights.push({ title: t("ai_open_complaints_title", { count: formatNumber(openComplaints) }), action: t("ai_open_complaints_action") });
  }
  if (typeof satisfaction === "number") {
    insights.push({ title: t("ai_satisfaction_title", { score: formatNumber(satisfaction) }), action: t("ai_satisfaction_action") });
  }
  if (!insights.length) {
    insights.push({ title: t("ai_no_data_title"), action: t("ai_no_data_action") });
  }
  return insights.slice(0, 2);
};


export default function CommandCenter({ title = "Dashboard", subtitle }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const role = getAuthRole();
  const isOfficerRole = role === "FIELD_OFFICER";

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

  const summaryCards = getSummaryCards(dashboard, role, t);
  const actionItems = getActionItems(dashboard, role, t);
  const isCitizen = role === "CITIZEN";
  const quickActions = isOfficerRole ? getOfficerQuickActions(t) : getAdminQuickActions(t);
  const navigationTabs = getNavigationTabs(t);
  const mapInsightText = getMapInsight(dashboard, t);
  const aiInsights = getAiInsights(dashboard, role, t);
  const overviewItems = isOfficerRole ? [
    { label: t("assigned_grievances"), value: formatNumber(dashboard?.pendingGrievances), route: ROUTES.fieldGrievances },
    { label: t("pending_alerts"), value: formatNumber(dashboard?.pendingAlerts), route: ROUTES.fieldAlerts },
    { label: t("my_profile"), value: t("view_arrow"), route: ROUTES.fieldProfile },
  ] : [
    { label: t("open_complaints"), value: formatNumber(dashboard?.metrics?.grievances?.byStatus?.OPEN ?? dashboard?.metrics?.grievances?.total) },
    { label: t("critical_alerts"), value: formatNumber(dashboard?.metrics?.alerts?.byPriority?.CRITICAL ?? dashboard?.metrics?.alerts?.total) },
    { label: t("total_users"), value: formatNumber(dashboard?.metrics?.users?.total) },
  ];

  return (
    <div className="rep-dashboard-page min-h-screen bg-slate-50 pb-32">
      <PageHeader subtitle={subtitle || title} />
      <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8" style={{ maxWidth: isCitizen ? '900px' : '1280px' }}>

        {loading && (
          <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-700 shadow-sm">
            {t("loading_dashboard")}
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
                  <h2 className="text-xl font-semibold text-slate-900">{t("action_center")}</h2>
                  <p className="mt-2 text-sm text-slate-500">{t("action_center_subtitle")}</p>
                </div>
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-700">
                  {t("priorities", { count: actionItems.length })}
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
                        <button
                          className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                          onClick={() => item.route && navigate(item.route)}
                        >
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
                  <h2 className="text-xl font-semibold text-slate-900">{t("constituency_overview")}</h2>
                  <p className="mt-2 text-sm text-slate-500">{t("constituency_overview_subtitle")}</p>
                </div>
                <FaMap className="h-5 w-5 text-slate-400" />
              </div>
              <div className="space-y-3">
                {overviewItems.map((item) => (
                  <div
                    key={item.label}
                    onClick={() => item.route && navigate(item.route)}
                    className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700"
                    style={{ cursor: item.route ? 'pointer' : 'default', transition: 'background 0.15s' }}
                    onMouseEnter={e => { if (item.route) e.currentTarget.style.background = '#f1f5f9'; }}
                    onMouseLeave={e => { if (item.route) e.currentTarget.style.background = ''; }}
                  >
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
                  <h2 className="text-xl font-semibold text-slate-900">{t("gis_map")}</h2>
                  <p className="mt-2 text-sm text-slate-500">{t("gis_map_subtitle")}</p>
                </div>
                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  {t("live")}
                </span>
              </div>
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900/5 px-4 py-6 text-slate-700">
                <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
                  <span>{t("ward_boundaries")}</span>
                  <span>{t("heatmap")}</span>
                </div>
                <div className="h-72 rounded-3xl bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)] p-4 shadow-inner">
                  <div className="pointer-events-none flex h-full items-end justify-between gap-4">
                    <div className="mt-auto w-1/2 rounded-3xl bg-white/70 p-4 text-sm text-slate-700 shadow-sm">
                      <p className="font-semibold text-slate-900">{t("heatmap_layer")}</p>
                      <p className="mt-2 text-xs text-slate-500">{t("trending_complaints_by_ward")}</p>
                    </div>
                    <div className="grid gap-2 text-right text-xs text-slate-500">
                      <span>{t("alert_pins")}</span>
                      <span>{t("event_markers")}</span>
                      <span>{t("officer_locations")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{t("map_insights")}</p>
                <p className="mt-2">{mapInsightText}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">{t("ai_insights")}</h2>
            <p className="mt-2 text-sm text-slate-500">{t("ai_insights_subtitle")}</p>
            <div className="mt-6 space-y-4">
              {aiInsights.map((insight) => (
                <div key={insight.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-3 text-slate-900">
                    <FaLightbulb className="h-5 w-5 text-amber-500" />
                    <p className="font-semibold">{t("ai_insight")}</p>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{insight.title}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{t("recommended_action")} {insight.action}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{t("quick_actions")}</h2>
                <p className="mt-2 text-sm text-slate-500">{t("quick_actions_subtitle")}</p>
              </div>
              <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700">
                {t("tap_to_act")}
              </span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {quickActions.slice(0, 4).map((action) => {
                const ActionIcon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => action.route && navigate(action.route)}
                    className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm">
                      <ActionIcon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{action.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
              {t("quick_actions_tip")}
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

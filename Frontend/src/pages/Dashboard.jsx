import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import ComplaintChart from "../components/ComplaintChart";
import AlertPanel from "../components/AlertPanel";
import AIInsights from "../components/AIInsights";
import EventList from "../components/EventList";
import TeamPerformance from "../components/TeamPerformance";
import CampaignAnalytics from "../components/CampaignAnalytics";
import api from "../shared/services/api";

export default function Dashboard() {
  const [stats, setStats] = useState([
    { title: "Total Complaints", value: 0, growth: 0 },
    { title: "Resolved Complaints", value: 0, growth: 0 },
    { title: "Active Alerts", value: 0, growth: 0 },
  ]);
  const [complaintPieData, setComplaintPieData] = useState([
    { name: "New", value: 0 },
    { name: "Assigned", value: 0 },
    { name: "In Progress", value: 0 },
    { name: "Resolved", value: 0 },
    { name: "Escalated", value: 0 },
  ]);
  const [alerts, setAlerts] = useState([]);
  const [events, setEvents] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch analytics data
      const [grievanceRes, alertRes, eventRes] = await Promise.all([
        api.get("/analytics/grievances"),
        api.get("/analytics/alerts"),
        api.get("/analytics/events"),
      ]);

      // Update stats
      const newStats = [
        { title: "Total Complaints", value: grievanceRes.total || 0, growth: grievanceRes.trend || 0 },
        { title: "Resolved Complaints", value: grievanceRes.byStatus?.RESOLVED || 0, growth: 0 },
        { title: "Active Alerts", value: alertRes.total || 0, growth: alertRes.trend || 0 },
      ];
      setStats(newStats);

      // Update complaint chart data
      const chartData = [
        { name: "New", value: grievanceRes.byStatus?.NEW || 0 },
        { name: "Assigned", value: grievanceRes.byStatus?.ASSIGNED || 0 },
        { name: "In Progress", value: grievanceRes.byStatus?.IN_PROGRESS || 0 },
        { name: "Resolved", value: grievanceRes.byStatus?.RESOLVED || 0 },
        { name: "Escalated", value: grievanceRes.byStatus?.ESCALATED || 0 },
      ];
      setComplaintPieData(chartData);

      // Fetch grievances, alerts, and events for panels
      const grievances = await api.get("/grievances?page=1&per_page=100");
      const alertsList = await api.get("/alerts?page=1&per_page=5");
      const eventsList = await api.get("/events?page=1&per_page=5");

      // Format alerts for AlertPanel
      const formattedAlerts = Array.isArray(alertsList)
        ? alertsList.slice(0, 3).map((alert) => ({
            id: alert.id || alert._id,
            title: alert.title || "Alert",
            level: alert.priority || "MEDIUM",
            time: new Date(alert.createdAt).toLocaleDateString(),
          }))
        : [];
      setAlerts(formattedAlerts);

      // Format events for EventList
      const formattedEvents = Array.isArray(eventsList)
        ? eventsList.slice(0, 3).map((event) => ({
            id: event.id || event._id,
            title: event.title || "Event",
            date: new Date(event.startDate).toLocaleDateString(),
            registered: event.registeredCount || 0,
          }))
        : [];
      setEvents(formattedEvents);

      // Set AI insights with complaint data
      const topCategory = Object.entries(grievanceRes.byCategory || {}).sort(([, a], [, b]) => b - a)[0];
      const topPriority = Object.entries(grievanceRes.byPriority || {}).sort(([, a], [, b]) => b - a)[0];

      setAiInsights([
        {
          id: 1,
          title: "Most Common Issue",
          detail: topCategory ? `${topCategory[0]} (${topCategory[1]} cases)` : "No data",
        },
        {
          id: 2,
          title: "Priority Alert",
          detail: topPriority ? `${topPriority[0]} Priority (${topPriority[1]} cases)` : "No data",
        },
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl">
          <div className="lg:flex">
            <Sidebar />
            <main className="flex-1 p-6 text-center">
              <p>Loading dashboard...</p>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl">
        <div className="lg:flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <Header title="Hon. Representative" />

            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stats.map((s) => (
                <StatCard key={s.title} title={s.title} value={s.value} growth={s.growth} />
              ))}
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ComplaintChart data={complaintPieData} />
              </div>
              <div className="space-y-4">
                <AlertPanel alerts={alerts} />
                <AIInsights items={aiInsights} />
              </div>
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-3">
              <EventList events={events} />
              <TeamPerformance />
              <CampaignAnalytics />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

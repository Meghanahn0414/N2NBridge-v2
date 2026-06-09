import React from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import ComplaintChart from "../components/ComplaintChart";
import AlertPanel from "../components/AlertPanel";
import AIInsights from "../components/AIInsights";
import EventList from "../components/EventList";
import TeamPerformance from "../components/TeamPerformance";
import CampaignAnalytics from "../components/CampaignAnalytics";
import useMlaDashboard from "../shared/hooks/useMlaDashboard";

export default function Dashboard() {
  const { dashboard, loading, error } = useMlaDashboard();
  const summary = dashboard?.summary || {};
  const stats = [
    { title: "Total Complaints", value: summary.totalComplaints || 0, growth: "+3.4%" },
    { title: "Resolved This Month", value: summary.resolvedThisMonth || 0, growth: "+2.1%" },
    { title: "Critical Alerts", value: summary.criticalAlerts || 0, growth: "-1.2%" },
  ];
  const alerts = (dashboard?.recentAlerts || []).map((item) => ({
    id: item._id || item.id,
    title: item.alertType || item.type || "New alert",
    time: item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
    level: item.priority || "LOW",
  }));
  const events = (dashboard?.metrics?.events?.recent || []).map((event) => ({
    id: event._id || event.id,
    title: event.title || "Constituency event",
    date: event.date ? new Date(event.date).toLocaleDateString() : "TBD",
    registered: event.attendees || 0,
  }));

  const complaintPieData = dashboard?.metrics?.grievances?.byCategory
    ? Object.entries(dashboard.metrics.grievances.byCategory).map(([name, value]) => ({ name, value }))
    : [];

  const aiInsights = [];

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

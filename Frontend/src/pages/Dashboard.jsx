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
import { stats, complaintPieData, alerts, events, aiInsights } from "../data/dashboardData";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl">
        <div className="lg:flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <Header title="Hon. Representative" />

            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stats.slice(0, 3).map((s) => (
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

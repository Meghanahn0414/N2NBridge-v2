import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../app/routes/RouteConstants";
import {
  getCitizenComplaints,
  fetchComplaintCategories,
  mapCategoryName,
} from "../../features/complaints/complaintService";
import "../../styles/citizen-dashboard.css";

const quickActions = [
  { title: "Raise Complaint", route: ROUTES.citizenCreateComplaint, color: "bg-blue-600", icon: "+" },
  { title: "My Complaints", route: ROUTES.citizenComplaintList, color: "bg-red-600", icon: "!" },
  { title: "View Events", route: ROUTES.citizen, color: "bg-purple-600", icon: "*" },
  { title: "Notifications", route: ROUTES.citizen, color: "bg-emerald-600", icon: "🔔" },
];

const sampleEvents = [
  { date: "15 JUN", title: "Health Camp", location: "Jayanagar Community Hall" },
  { date: "20 JUN", title: "Constituency Meeting", location: "Town Hall, Bangalore" },
  { date: "25 JUN", title: "Welfare Drive", location: "Constituency Ward 12" },
];

const sampleNotifications = [
  { label: "Complaint CMP-1001 assigned", time: "2 hrs ago" },
  { label: "New health camp announced", time: "5 hrs ago" },
  { label: "Survey available for your ward", time: "1 day ago" },
  { label: "Road maintenance scheduled", time: "2 days ago" },
];

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [complaintData, categoryData] = await Promise.all([
          getCitizenComplaints(),
          fetchComplaintCategories(),
        ]);
        setComplaints(complaintData);
        setCategories(categoryData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const openCount = complaints.filter((item) => !["RESOLVED", "CLOSED", "REJECTED"].includes(item.status)).length;
  const resolvedCount = complaints.filter((item) => item.status === "RESOLVED").length;
  const avgRating = 4.5;
  const eventsJoined = 5;

  const statusBreakdown = {
    InProgress: complaints.filter((item) => item.status === "IN_PROGRESS").length,
    Assigned: complaints.filter((item) => item.status === "ASSIGNED").length,
    Resolved: resolvedCount,
    Closed: complaints.filter((item) => item.status === "CLOSED").length,
  };

  return (
    <div className="citizen-dashboard-page">
      <div className="citizen-dashboard-wrapper xl:grid-cols-[280px_1fr]">
        <div className="citizen-dashboard-sidebar">
          <div className="citizen-dashboard-sidebar-card">
            <div className="citizen-dashboard-brand">
              <div className="citizen-dashboard-brand-logo">MC</div>
              <div>
                <p className="text-sm uppercase tracking-[.2em] text-slate-500">MyCity</p>
                <h2 className="text-xl font-semibold text-slate-900">Citizen Portal</h2>
              </div>
            </div>
            <nav className="dashboard-nav">
              <button onClick={() => navigate(ROUTES.citizen)} className="dashboard-nav-button dashboard-nav-button--active">
                <span className="text-lg">🏠</span>
                Dashboard
              </button>
              <button onClick={() => navigate(ROUTES.citizenCreateComplaint)} className="dashboard-nav-button">
                <span className="text-lg">✏️</span>
                Raise Complaint
              </button>
              <button onClick={() => navigate(ROUTES.citizenComplaintList)} className="dashboard-nav-button">
                <span className="text-lg">📄</span>
                My Complaints
              </button>
              <button className="dashboard-nav-button">
                <span className="text-lg">🔔</span>
                Notifications
              </button>
            </nav>
          </div>
        </div>

        <div className="space-y-6">
          <div className="dashboard-main-card">
            <div className="dashboard-main-header">
              <div>
                <h1 className="dashboard-main-title">Citizen Dashboard</h1>
                <p className="dashboard-main-copy">Manage your complaints, view status updates, and raise new issues.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => navigate(ROUTES.citizenCreateComplaint)} className="dashboard-action">
                  Raise Complaint
                </button>
                <button onClick={() => navigate(ROUTES.citizenComplaintList)} className="dashboard-secondary-action">
                  My Complaints
                </button>
              </div>
            </div>
          </div>

          <div className="dashboard-metrics-grid">
            <div className="dashboard-metric-card">
              <p className="dashboard-metric-label">Complaints</p>
              <p className="dashboard-metric-value">{complaints.length}</p>
              <p className="mt-2 text-sm text-slate-500">+2 this week</p>
            </div>
            <div className="dashboard-metric-card">
              <p className="dashboard-metric-label">Alerts</p>
              <p className="dashboard-metric-value">3</p>
              <p className="mt-2 text-sm text-rose-600">Active Alerts</p>
            </div>
            <div className="dashboard-metric-card">
              <p className="dashboard-metric-label">Events Joined</p>
              <p className="dashboard-metric-value">{eventsJoined}</p>
              <p className="mt-2 text-sm text-indigo-600">View Events</p>
            </div>
            <div className="dashboard-metric-card">
              <p className="dashboard-metric-label">Feedback Rating</p>
              <div className="mt-4 flex items-center gap-3">
                <p className="dashboard-metric-value">{avgRating}</p>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">⭐</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">Average Rating</p>
            </div>
          </div>

          <div className="dashboard-grid-two">
            <div className="dashboard-section-card">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="dashboard-section-title">Complaint Status Overview</h2>
                  <p className="dashboard-section-copy">Track how your complaints are progressing.</p>
                </div>
                <button onClick={() => navigate(ROUTES.citizenComplaintList)} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200">
                  See all
                </button>
              </div>

              <div className="dashboard-status-row">
                {Object.entries(statusBreakdown).map(([label, count]) => (
                  <div key={label} className="dashboard-status-item">
                    <div className="dashboard-status-label">
                      <span>{label.replace(/([A-Z])/g, " $1").trim()}</span>
                      <span>{count}</span>
                    </div>
                    <div className="dashboard-progress-track">
                      <div className="dashboard-progress-value" style={{ width: `${Math.min(100, count * 20)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="dashboard-section-card">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="dashboard-section-title">Quick Actions</h2>
                    <p className="dashboard-section-copy">Jump to the most common citizen tasks.</p>
                  </div>
                </div>
                <div className="dashboard-quick-actions-grid">
                  {quickActions.map((action) => (
                    <button
                      key={action.title}
                      onClick={() => navigate(action.route)}
                      className={`dashboard-quick-action ${action.color}`}
                    >
                      <div>
                        <p className="text-sm font-semibold">{action.title}</p>
                        <p className="mt-1 text-xs text-white/80">Open quickly</p>
                      </div>
                      <div className="rounded-2xl bg-white/20 px-3 py-2 text-sm">{action.icon}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="dashboard-section-card">
                <h2 className="dashboard-section-title">Upcoming Events</h2>
                <div className="mt-5 space-y-4">
                  {sampleEvents.map((event) => (
                    <div key={event.title} className="dashboard-event-card">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-indigo-600 text-sm font-semibold text-white">
                          {event.date}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{event.title}</p>
                          <p className="text-sm text-slate-500">{event.location}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-grid-three">
            <div className="dashboard-section-card">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="dashboard-section-title">Recent Complaints</h2>
                  <p className="dashboard-section-copy">Latest complaints from your account.</p>
                </div>
                <button onClick={() => navigate(ROUTES.citizenComplaintList)} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200">
                  View all
                </button>
              </div>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-sm text-slate-500">Loading complaints...</p>
                ) : complaints.length === 0 ? (
                  <p className="text-sm text-slate-500">No complaints yet. Raise one now.</p>
                ) : (
                  complaints.slice(0, 3).map((complaint) => (
                    <button
                      key={complaint.id}
                      onClick={() => navigate(`/citizen/complaints/${complaint.id}`)}
                      className="dashboard-complaint-card"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{complaint.complaintNumber}</p>
                          <p className="mt-1 text-sm text-slate-500">{mapCategoryName(complaint.categoryId, categories)}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {complaint.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">{complaint.description}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="dashboard-section-card">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="dashboard-section-title">Notifications</h2>
                  <p className="dashboard-section-copy">Recent updates and alerts.</p>
                </div>
                <button className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200">
                  Mark all read
                </button>
              </div>
              <div className="space-y-3">
                {sampleNotifications.map((item) => (
                  <div key={item.label} className="dashboard-notification-card">
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

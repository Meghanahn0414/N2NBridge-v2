import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCitizenProfile } from "../../shared/services/citizenService";
import eventService from "../../services/eventService";
import complaintService from "../../services/complaintService";
import { fetchCampaigns } from "../../features/campaigns/campaignService";
import "./dashboard-mobile.css";

export default function CitizenDashboardNew() {
  const [profile, setProfile]                         = useState(null);
  const [stats, setStats]                             = useState({ open: 0, inProgress: 0, resolved: 0 });
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [recentComplaints, setRecentComplaints]       = useState([]);
  const [campaigns, setCampaigns]                     = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadProfileData();
    loadStats();
    loadNotifications();
    loadRecentComplaints();
    fetchCampaigns(1, 10, { status: 'ACTIVE' })
      .then(data => setCampaigns(Array.isArray(data) ? data : []))
      .catch(() => setCampaigns([]));
  }, []);

  const getInitials = (name) =>
    name.split(" ").filter(Boolean).map((p) => p[0]?.toUpperCase()).slice(0, 2).join("");

  const loadProfileData = async () => {
    try { setProfile(await getCitizenProfile()); }
    catch (e) { console.error("profile:", e); }
  };

  const loadStats = async () => {
    try {
      const r = await complaintService.getMyComplaints(1, 200);
      const complaints = r.complaints || [];
      setStats({
        open:       complaints.filter(c => ['NEW', 'OPEN'].includes(c.status)).length,
        inProgress: complaints.filter(c => ['IN_PROGRESS', 'ASSIGNED', 'ON_HOLD'].includes(c.status)).length,
        resolved:   complaints.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status)).length,
      });
    } catch { setStats({ open: 0, inProgress: 0, resolved: 0 }); }
  };

  const loadNotifications = async () => {
    try { const a = await eventService.getAlertStats(); setUnreadNotifications(a.unread || 0); }
    catch { /* silent */ }
  };

  const loadRecentComplaints = async () => {
    try { const r = await complaintService.getMyComplaints(1, 3); setRecentComplaints(r.complaints || []); }
    catch { setRecentComplaints([]); }
  };

  const handleComplaintClick = (c) => {
    const id = c.id || c._id || c.complaintId;
    if (id) navigate(`/citizen/complaints/${id}`);
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const displayName = profile?.fullName || profile?.mobile || "Citizen";

  if (!profile) return <div className="dashboard-loading">Loading…</div>;

  return (
    <div className="dashboard-mobile-container">

      {/* ══ TOP BAR — flat box, greeting inside ══ */}
      <header className="dashboard-topbar">
        <div className="topbar-inner">

          {/* Greeting replaces brand logo+title */}
          <div className="topbar-greeting">
            <span className="topbar-namaste">Namaste,</span>
            <span className="topbar-username">{displayName}</span>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="icon-button"
              onClick={() => navigate("/citizen/notifications")}
              aria-label="Notifications"
            >
              <span className="topbar-icon">🔔</span>
              {unreadNotifications > 0 && (
                <span className="notification-dot">{unreadNotifications}</span>
              )}
            </button>
            <button
              type="button"
              className="avatar-button"
              onClick={() => navigate("/citizen/profile")}
              aria-label="Profile"
            >
              {profile?.profileImage ? (
                <img
                  src={profile.profileImage.startsWith("http")
                    ? profile.profileImage
                    : `${import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000"}/${profile.profileImage}`}
                  alt="Profile"
                  className="topbar-avatar-img"
                />
              ) : (
                getInitials(displayName)
              )}
            </button>
          </div>

        </div>
      </header>

      {/* ══ MAIN CONTENT — white page ══ */}
      <main className="dashboard-main-card">

        {/* Stats */}
        <section className="stats-summary-row" aria-label="Complaint statistics">
          <div
            className="stat-item"
            role="button" tabIndex={0}
            onClick={() => navigate("/citizen/complaints?status=open")}
            onKeyDown={(e) => e.key === "Enter" && navigate("/citizen/complaints?status=open")}
          >
            <span className="stat-value">{stats.open}</span>
            <span className="stat-label">Open</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.inProgress}</span>
            <span className="stat-label">In{"\n"}Progress</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.resolved}</span>
            <span className="stat-label">Resolved</span>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions-section">
          <h2 className="section-heading">Quick Actions</h2>
          <div className="action-grid">
            <button type="button" className="action-card action-file"
              onClick={() => navigate("/citizen/create-complaint")}>
              <span className="action-icon">📝</span>
              <span className="action-title">File Complaint</span>
            </button>
            <button type="button" className="action-card action-alert"
              onClick={() => navigate("/citizen/sos")}>
              <span className="action-icon">🚨</span>
              <span className="action-title">Raise Alert</span>
            </button>
            <button type="button" className="action-card action-events"
              onClick={() => navigate("/citizen/events")}>
              <span className="action-icon">📅</span>
              <span className="action-title">Events</span>
            </button>
            <button type="button" className="action-card action-contact"
              onClick={() => navigate("/citizen/feedback")}>
              <span className="action-icon">💬</span>
              <span className="action-title">Feedback</span>
            </button>
          </div>
        </section>

        {/* Recent Complaints */}
        <section className="recent-complaints-section">
          <div className="recent-heading-row">
            <h2 className="section-heading">Recent Complaints</h2>
          </div>

          {recentComplaints.length > 0 ? recentComplaints.map((complaint) => {
            const id = complaint.id || complaint._id || complaint.complaintId || complaint.reference;
            const rawStatus = complaint.status?.toLowerCase().replace(/\s+/g, "") || "open";
            const statusKey = rawStatus;
            const displayStatus =
              statusKey === "inprogress" || statusKey === "assigned" ? "In Progress" :
              statusKey === "resolved" ? "Resolved" : "Open";

            return (
              <button
                key={id || complaint.title}
                type="button"
                className="recent-card"
                onClick={() => handleComplaintClick(complaint)}
              >
                <span className={`recent-card-accent ${statusKey}`} />
                <div className="recent-card-text">
                  <p className="recent-card-title">
                    {complaint.title || complaint.subject || "Complaint"}
                  </p>
                  <p className="recent-card-subtitle">
                    #{id || "N/A"} &bull; {complaint.age || "recently"}
                  </p>
                </div>
                <span className={`complaint-status ${statusKey}`}>{displayStatus}</span>
              </button>
            );
          }) : (
            <div className="recent-empty">No recent complaints yet.</div>
          )}
        </section>

        {/* Active Campaigns */}
        {campaigns.length > 0 && (
          <section className="recent-complaints-section">
            <div className="recent-heading-row">
              <h2 className="section-heading">📢 Active Programs</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {campaigns.map(c => (
                <div key={c._id || c.id} style={{
                  background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)',
                  borderRadius: 12, padding: '12px 14px',
                  border: '1px solid #dbeafe',
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1e3a8a' }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>
                    {c.type} &bull; via {(c.channels || []).join(', ') || 'announcement'}
                  </div>
                  {c.message && (
                    <div style={{ fontSize: 12, color: '#334155', marginTop: 6, lineHeight: 1.5 }}>
                      {c.message.length > 120 ? c.message.slice(0, 120) + '…' : c.message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* ══ BOTTOM NAV — flat top, full width ══ */}
      <nav className="bottom-nav" aria-label="Main navigation">
        {[
          { icon: "🏠", label: "Home",       path: "/citizen/dashboard" },
          { icon: "📋", label: "Complaints", path: "/citizen/complaints" },
          { icon: "📅", label: "Events",     path: "/citizen/events" },
          { icon: "📢", label: "Campaigns",  path: "/citizen/campaigns" },
        ].map(({ icon, label, path }) => (
          <button
            key={label}
            type="button"
            className={`nav-item${isActive(path) ? " active" : ""}`}
            onClick={() => navigate(path)}
            aria-label={label}
            aria-current={isActive(path) ? "page" : undefined}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

    </div>
  );
}

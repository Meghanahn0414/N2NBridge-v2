import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardForRole } from "../../../shared/services/dashboardService";
import { getAuthUser } from "../../../services/authStorage";
import { ROUTES } from "../../../app/routes/RouteConstants";
import "../../../styles/field-officer.css";

const STATUS_META = {
  NEW:         { bg: "#dbeafe", text: "#1d4ed8", dot: "#3b82f6" },
  OPEN:        { bg: "#fef3c7", text: "#b45309", dot: "#f59e0b" },
  ASSIGNED:    { bg: "#ede9fe", text: "#6d28d9", dot: "#8b5cf6" },
  IN_PROGRESS: { bg: "#e0f2fe", text: "#0369a1", dot: "#0ea5e9" },
  ON_HOLD:     { bg: "#fff7ed", text: "#c2410c", dot: "#f97316" },
  RESOLVED:    { bg: "#dcfce7", text: "#166534", dot: "#22c55e" },
  CLOSED:      { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8" },
  REJECTED:    { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444" },
};

const PRIORITY_META = {
  LOW:      { bg: "#f0fdf4", text: "#166534" },
  MEDIUM:   { bg: "#fff7ed", text: "#c2410c" },
  HIGH:     { bg: "#fef2f2", text: "#b91c1c" },
  CRITICAL: { bg: "#fdf2f8", text: "#9d174d" },
};

const CATEGORY_ICONS = {
  ROAD_ISSUE:      "🛣️",
  WATER_SUPPLY:    "💧",
  ELECTRICITY:     "⚡",
  GARBAGE:         "🗑️",
  NOISE_POLLUTION: "🔊",
  OTHER:           "📌",
};

export default function FieldDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = getAuthUser();
  const officerName = user?.fullName || user?.name || "Officer";
  const firstName = officerName.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    getDashboardForRole("FIELD_OFFICER")
      .then(setDashboard)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const grievances = dashboard?.grievances || [];
  const alerts = dashboard?.alerts || [];
  const total = grievances.length;
  const open = grievances.filter(g => ["NEW", "OPEN", "ASSIGNED"].includes(g.status)).length;
  const inProgress = grievances.filter(g => g.status === "IN_PROGRESS").length;
  const resolved = grievances.filter(g => g.status === "RESOLVED").length;
  const pendingAlerts = alerts.filter(a => a.status !== "RESOLVED" && a.status !== "CLOSED").length;
  const recentGrievances = grievances.slice(0, 8);

  const stats = [
    { label: "Total Assigned", value: total,         icon: "📋", iconBg: "#EEF2FF", sub: "Grievances assigned to you",  route: ROUTES.fieldGrievances },
    { label: "In Progress",    value: inProgress,    icon: "⚙️",  iconBg: "#FDF4FF", sub: "Actively being worked on",    route: ROUTES.fieldGrievances },
    { label: "Resolved",       value: resolved,      icon: "✅",  iconBg: "#F0FDF4", sub: "Successfully closed",          route: ROUTES.fieldGrievances },
    { label: "Active Alerts",  value: pendingAlerts, icon: "🚨",  iconBg: "#FEF2F2", sub: pendingAlerts > 0 ? "Require immediate attention" : "All clear", route: ROUTES.fieldAlerts },
  ];

  return (
    <div style={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column", background: "#F3F5FA", fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>

      {/* ── Topbar ── */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 34px", background: "#F3F5FA", position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid #E5E9F1", flexShrink: 0 }}>
        <div>
          <div style={{ font: "500 13px 'Hanken Grotesk', system-ui, sans-serif", color: "#8590A6", marginBottom: 3 }}>
            {today}
          </div>
          <h1 style={{ font: "400 28px 'Newsreader', Georgia, serif", color: "#16233C", margin: 0, letterSpacing: "-.01em" }}>
            {greeting}, {firstName}
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ height: 44, background: "#fff", border: "1px solid #E1E6F0", borderRadius: 13, display: "flex", alignItems: "center", gap: 9, padding: "0 16px" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: open > 0 ? "#C8453A" : "#1E8A5B", fontFamily: "'Hanken Grotesk', system-ui" }}>
              {loading ? "Loading…" : open > 0 ? `${open} open grievance${open > 1 ? "s" : ""} awaiting action` : "All grievances up to date"}
            </span>
          </div>
        </div>
      </header>

      {/* ── Stat Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", padding: "16px 32px 0", flexShrink: 0 }}>
        {stats.map(s => (
          <div
            key={s.label}
            onClick={() => navigate(s.route)}
            style={{
              background: "#fff",
              border: "1px solid #EAEDF4",
              borderRadius: 18,
              padding: "18px 20px",
              boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)",
              cursor: "pointer",
              transition: "transform 0.12s, box-shadow 0.12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 18px 36px -18px rgba(20,35,60,.36)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 14px 30px -22px rgba(20,35,60,.3)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>
                {s.icon}
              </div>
              <span style={{ font: "600 12px 'Hanken Grotesk',system-ui,sans-serif", color: "#8590A6" }}>{s.label}</span>
            </div>
            <div style={{ fontFamily: "'Newsreader','Georgia',serif", fontSize: "clamp(22px,2.5vw,32px)", fontWeight: 400, color: "#16233C", lineHeight: 1.2, marginBottom: 4 }}>
              {loading ? "—" : s.value}
            </div>
            <div style={{ font: "500 12px 'Hanken Grotesk',system-ui,sans-serif", color: "#8590A6" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Content (fills remaining height, no scroll on page) ── */}
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 320px", gap: "12px", padding: "12px 32px 16px" }}>

        {/* ── Recent Grievances (scrollable inside card) ── */}
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Recent Grievances</h2>
              <p style={{ margin: "1px 0 0", fontSize: "11px", color: "#94a3b8" }}>Latest cases assigned to you</p>
            </div>
            <button onClick={() => navigate(ROUTES.fieldGrievances)} style={{ padding: "5px 14px", borderRadius: "7px", background: "#eff6ff", border: "none", color: "#2563eb", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
              View all →
            </button>
          </div>

          {/* Scrollable list */}
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {loading && <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>Loading...</div>}
            {!loading && recentGrievances.length === 0 && (
              <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                <div style={{ fontSize: "36px" }}>📭</div>
                <p style={{ margin: "8px 0 0", fontSize: "13px" }}>No grievances assigned</p>
              </div>
            )}
            {!loading && recentGrievances.map((g, i) => {
              const sm = STATUS_META[g.status] || STATUS_META.CLOSED;
              const pm = PRIORITY_META[g.priority];
              const catIcon = CATEGORY_ICONS[g.category] || "📌";
              const category = g.category ? g.category.replace(/_/g, " ") : "General";
              return (
                <div key={g._id || i} style={{ padding: "9px 16px", borderBottom: "1px solid #f8fafc", display: "flex", gap: "10px", alignItems: "center", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ width: "30px", height: "30px", borderRadius: "7px", background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
                    {catIcon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                      <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {g.description ? (g.description.length > 55 ? g.description.slice(0, 55) + "…" : g.description) : "No description"}
                      </p>
                      <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
                        <span style={{ padding: "1px 7px", borderRadius: "12px", fontSize: "10px", fontWeight: 700, background: sm.bg, color: sm.text, display: "flex", alignItems: "center", gap: "3px" }}>
                          <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: sm.dot, display: "inline-block" }} />
                          {g.status?.replace("_", " ")}
                        </span>
                        {pm && <span style={{ padding: "1px 7px", borderRadius: "12px", fontSize: "10px", fontWeight: 600, background: pm.bg, color: pm.text }}>{g.priority}</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "1px", display: "flex", gap: "6px" }}>
                      <span>{category}</span>
                      {g.address && <span>📍 {g.address.length > 20 ? g.address.slice(0, 20) + "…" : g.address}</span>}
                      {g.createdAt && <span>{new Date(g.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right Column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", minHeight: 0 }}>

          {/* Progress */}
          <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)", borderRadius: "12px", padding: "14px 16px", color: "#fff", boxShadow: "0 3px 10px rgba(15,23,42,0.25)", flexShrink: 0 }}>
            <p style={{ margin: "0 0 10px", fontSize: "10px", fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", letterSpacing: "0.08em" }}>Your Progress</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { label: "Open",     value: open,         color: "#60a5fa" },
                { label: "Working",  value: inProgress,   color: "#a78bfa" },
                { label: "Resolved", value: resolved,     color: "#34d399" },
                { label: "Alerts",   value: pendingAlerts, color: pendingAlerts > 0 ? "#f87171" : "#34d399" },
              ].map(p => (
                <div key={p.label} style={{ background: "rgba(255,255,255,0.07)", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: p.color, lineHeight: 1 }}>{loading ? "—" : p.value}</div>
                  <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "3px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{p.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Alerts */}
          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", flex: 1, minHeight: 0 }}>
            <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>Active Alerts</h2>
                <p style={{ margin: "1px 0 0", fontSize: "11px", color: "#94a3b8" }}>Emergency incidents</p>
              </div>
              <button onClick={() => navigate(ROUTES.fieldAlerts)} style={{ fontSize: "11px", color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>View all</button>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "10px 14px" }}>
              {loading && <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>Loading...</p>}
              {!loading && alerts.length === 0 && (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div style={{ fontSize: "28px" }}>🟢</div>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", fontWeight: 700, color: "#166534" }}>All clear</p>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#94a3b8" }}>No active alerts</p>
                </div>
              )}
              {!loading && alerts.slice(0, 4).map((a, i) => (
                <div key={a._id || i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px", borderRadius: "8px", background: "#fff5f5", border: "1px solid #fecaca", marginBottom: "6px" }}>
                  <span style={{ fontSize: "14px", flexShrink: 0 }}>🚨</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "12px", color: "#0f172a" }}>{a.emergencyType || a.type || "Emergency"}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>{(a.description || a.message || "No details").slice(0, 50)}…</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "12px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", flexShrink: 0 }}>
            <p style={{ margin: "0 0 8px", fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Quick Actions</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {[
                { label: "All Grievances",   icon: "📋", color: "#2563eb", bg: "#eff6ff", route: ROUTES.fieldGrievances },
                { label: "Emergency Alerts", icon: "🚨", color: "#dc2626", bg: "#fef2f2", route: ROUTES.fieldAlerts },
                { label: "Events",           icon: "📅", color: "#059669", bg: "#ecfdf5", route: ROUTES.fieldEvents },
                { label: "My Profile",       icon: "👤", color: "#7c3aed", bg: "#f5f3ff", route: ROUTES.fieldProfile },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.route)}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 12px", borderRadius: "8px", background: a.bg, border: "none", cursor: "pointer", transition: "transform 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateX(3px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}
                >
                  <span style={{ fontSize: "14px" }}>{a.icon}</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: a.color, flex: 1 }}>{a.label}</span>
                  <span style={{ color: a.color, fontWeight: 700, fontSize: "13px" }}>→</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

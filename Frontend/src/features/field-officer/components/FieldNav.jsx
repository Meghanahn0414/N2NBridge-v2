import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../../../app/routes/RouteConstants";
import { getAuthUser } from "../../../services/authStorage";

const NAV_ITEMS = [
  { label: "Dashboard",   icon: "📊", route: ROUTES.field },
  { label: "Grievances",  icon: "📋", route: ROUTES.fieldGrievances },
  { label: "Alerts",      icon: "🚨", route: ROUTES.fieldAlerts },
  { label: "Profile",     icon: "👤", route: ROUTES.fieldProfile },
];

export default function FieldNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getAuthUser();
  const name = user?.fullName || user?.name || "Officer";

  return (
    <nav style={{
      display: "flex", alignItems: "center",
      background: "linear-gradient(135deg, #1e293b 0%, #0f4c81 100%)",
      padding: "0 32px", height: "60px",
      boxShadow: "0 2px 12px rgba(15,23,42,0.25)",
      position: "sticky", top: 0, zIndex: 100,
    }}>
      {/* Brand */}
      <div
        style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginRight: "32px" }}
        onClick={() => navigate(ROUTES.field)}
      >
        <span style={{ fontSize: "20px" }}>🏛️</span>
        <span style={{ color: "#fff", fontWeight: 800, fontSize: "15px", letterSpacing: "-0.02em" }}>Field Portal</span>
      </div>

      {/* Nav links */}
      <div style={{ display: "flex", gap: "4px", flex: 1 }}>
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.route;
          return (
            <button
              key={item.route}
              onClick={() => navigate(item.route)}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 14px", borderRadius: "8px", border: "none",
                background: active ? "rgba(255,255,255,0.15)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.65)",
                fontSize: "13px", fontWeight: active ? 700 : 500,
                cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: "14px" }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </div>

      {/* User badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{
          width: "32px", height: "32px", borderRadius: "50%",
          background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 800, fontSize: "14px",
        }}>
          {name[0].toUpperCase()}
        </div>
        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", fontWeight: 600 }}>{name}</span>
      </div>
    </nav>
  );
}

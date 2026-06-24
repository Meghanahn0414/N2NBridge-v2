import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  RiDashboardLine,
  RiBarChart2Line,
  RiTimeLine,
  RiGroupLine,
  RiMegaphoneLine,
  RiFileWarningLine,
  RiMessage3Line,
  RiSettings4Line,
  RiExpandUpDownLine,
} from "react-icons/ri";
import { ROUTES } from "../../../app/routes/RouteConstants";
import "../styles/mla-layout.css";

/* ── nav items config ────────────────── */
const INSIGHTS = [
  { label: "Overview",       icon: <RiDashboardLine />,    to: ROUTES.mlaExecutiveDashboard },
  { label: "Popularity",     icon: <RiBarChart2Line />,    to: ROUTES.mlaCitizenSentiment },
  { label: "Career outlook", icon: <RiTimeLine />,         to: null },
  { label: "Constituents",   icon: <RiGroupLine />,        to: ROUTES.mlaConstituents },
];

const ENGAGE = [
  { label: "Broadcasts", icon: <RiMegaphoneLine />, to: ROUTES.mlaCommunications },
  { label: "Reports",    icon: <RiFileWarningLine />, to: ROUTES.mlaReports },
  { label: "Messages",   icon: <RiMessage3Line />,   to: null },
  { label: "Settings",   icon: <RiSettings4Line />,  to: ROUTES.mlaSettings },
];

/* ── Single nav item ─────────────────── */
function NavItem({ icon, label, to, badge, badgeCount }) {
  const disabled = !to;

  if (disabled) {
    return (
      <div className="mla-nav-item mla-nav-item--disabled" style={{ opacity: 0.45, cursor: "default" }}>
        <span className="mla-nav-icon">{icon}</span>
        <span className="mla-nav-text">{label}</span>
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      end={to === ROUTES.mlaExecutiveDashboard}
      className={({ isActive }) => "mla-nav-item" + (isActive ? " active" : "")}
    >
      <span className="mla-nav-icon">{icon}</span>
      <span className="mla-nav-text">{label}</span>
      {badge && badgeCount > 0 && (
        <span className="mla-nav-badge">{badgeCount > 99 ? "99+" : badgeCount}</span>
      )}
    </NavLink>
  );
}

/* ── Main sidebar ────────────────────── */
export default function MLASidebar({ user, openComplaints = 0 }) {
  const [showLogout, setShowLogout] = useState(false);
  const navigate = useNavigate();

  const displayName = user?.name || user?.fullName || user?.username || "Representative";
  const constituency = user?.constituency || user?.ward || "Constituency";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleLogout() {
    // Clear from both storages (authStorage.js writes to sessionStorage first)
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("authValue");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/admin-login", { replace: true });
  }

  return (
    <nav className="mla-sidebar">
      {/* Brand */}
      <div className="mla-brand">
        <div className="mla-brand-icon">
          <RiSettings4Line style={{ fontSize: 20 }} />
        </div>
        <div>
          <div className="mla-brand-name">CRM Portal</div>
          <div className="mla-brand-sub">REPRESENTATIVE</div>
        </div>
      </div>

      {/* Insights */}
      <div className="mla-nav-label">Insights</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {INSIGHTS.map((item) => (
          <NavItem key={item.label} {...item} />
        ))}
      </div>

      {/* Engage */}
      <div className="mla-nav-label">Engage</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {ENGAGE.map((item) => (
          <NavItem key={item.label} {...item} badgeCount={item.badge ? openComplaints : 0} />
        ))}
      </div>

      {/* User card */}
      <div style={{ position: "relative", marginTop: "auto" }}>
        {showLogout && (
          <div className="mla-logout-popup">
            <p className="mla-logout-prompt">Sign out?</p>
            <p className="mla-logout-sub notranslate" translate="no">{displayName}</p>
            <div className="mla-logout-btns">
              <button className="mla-logout-cancel" onClick={() => setShowLogout(false)}>Cancel</button>
              <button className="mla-logout-confirm" onClick={handleLogout}>Sign out</button>
            </div>
          </div>
        )}
        <div className="mla-user-card" onClick={() => setShowLogout((v) => !v)}>
          <div className="mla-user-avatar notranslate" translate="no">
            {user?.profilePhoto ? <img src={user.profilePhoto} alt={displayName} /> : initials}
          </div>
          <div className="mla-user-info">
            <div className="mla-user-name notranslate" translate="no">{displayName}</div>
            <div className="mla-user-role notranslate" translate="no">MLA · {constituency}</div>
          </div>
          <span className="mla-user-expand"><RiExpandUpDownLine /></span>
        </div>
      </div>
    </nav>
  );
}

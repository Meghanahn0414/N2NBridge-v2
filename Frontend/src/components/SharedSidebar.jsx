import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { RiExpandUpDownLine } from "react-icons/ri";
import { clearAuth, getAuthRole } from "../services/authStorage";
import n2nLogo from "../assets/images/n2n-bridge-logo.png";
import "../features/mla-dashboard/styles/mla-layout.css";

function NavItem({ icon, label, to, badge, badgeCount, exact = true }) {
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
      end={exact}
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

export default function SharedSidebar({ user, roleSub = "STAFF", roleLabel = "Staff", sections = [] }) {
  const [showLogout, setShowLogout] = useState(false);
  const navigate = useNavigate();

  const displayName = user?.name || user?.fullName || user?.username || roleLabel;
  const constituency = user?.constituency || user?.ward || "";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleLogout() {
    const role = getAuthRole();
    clearAuth();
    const loginPath =
      role === "CITIZEN" || role === "citizen"
        ? "/citizen-login"
        : "/login";
    window.location.replace(loginPath);
  }

  return (
    <nav className="mla-sidebar">
      <div className="mla-brand">
        <div className="mla-brand-icon" style={{ background: "none", padding: 0 }}>
          <img src={n2nLogo} alt="N2N Bridge" style={{ width: 38, height: 38, borderRadius: 11, display: "block" }} />
        </div>
        <div>
          <div className="mla-brand-name">N2N Bridge</div>
          <div className="mla-brand-sub">{roleSub}</div>
        </div>
      </div>

      {/* Scrollable nav body — brand above stays fixed */}
      <div className="mla-nav-body">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="mla-nav-label">{section.label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {section.items.map((item) => (
                <NavItem key={item.label} {...item} />
              ))}
            </div>
          </div>
        ))}

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
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={displayName} />
              ) : (
                initials
              )}
            </div>
            <div className="mla-user-info">
              <div className="mla-user-name notranslate" translate="no">{displayName}</div>
              <div className="mla-user-role notranslate" translate="no">
                {roleLabel}{constituency ? ` · ${constituency}` : ""}
              </div>
            </div>
            <span className="mla-user-expand"><RiExpandUpDownLine /></span>
          </div>
        </div>
      </div>
    </nav>
  );
}

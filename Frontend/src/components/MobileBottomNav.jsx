import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./mobile-bottom-nav.css";

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: "Home", icon: "🏠", path: "/citizen", id: "home" },
    { label: "Complain", icon: "✎", path: "/citizen/complaints", id: "complain" },
    { label: "Map", icon: "📍", path: "/citizen/map", id: "map" },
    { label: "Alerts", icon: "🔔", path: "/citizen/alerts", id: "alerts" },
    { label: "Profile", icon: "👤", path: "/citizen/profile", id: "profile" },
  ];

  const isActive = (path) => {
    if (path === "/citizen") {
      return location.pathname === "/citizen" || location.pathname === "/citizen/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${isActive(item.path) ? "active" : ""}`}
          onClick={() => navigate(item.path)}
          title={item.label}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthUser, clearAuth } from "../../../services/authStorage";

export default function FieldPageHeader({ subtitle }) {
  const user = getAuthUser();
  const name = user?.fullName || user?.name || "Officer";
  const firstName = name.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const [showLogout, setShowLogout] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowLogout(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate("/admin-login");
  };

  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{
      background: "#1a5290",
      padding: "14px 32px 16px",
      flexShrink: 0,
      position: "relative",
      overflow: "visible",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      {/* Decorative circle */}
      <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />

      {/* Left: greeting */}
      <div>
        <p style={{ margin: 0, fontSize: "10px", fontWeight: 600, color: "#93c5fd", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {today}
        </p>
        <div style={{ marginTop: "4px" }}>
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
            {greeting}, {firstName} 👋
          </h1>
          {subtitle && (
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#93c5fd" }}>{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: avatar pill + logout dropdown */}
      <div style={{ position: "relative", zIndex: 10 }} ref={dropdownRef}>
        <button
          onClick={() => setShowLogout(s => !s)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "40px",
            padding: "6px 14px 6px 6px",
            cursor: "pointer",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 600,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
        >
          <span style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            {initials}
          </span>
          {firstName}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.7, marginLeft: 2 }}>
            <path d="M2 4l4 4 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {showLogout && (
          <div style={{
            position: "absolute", top: "calc(100% + 10px)", right: 0,
            width: 240, background: "#fff", borderRadius: 16,
            boxShadow: "0 16px 48px rgba(15,23,42,0.18)", overflow: "hidden", zIndex: 999,
          }}>
            <div style={{ background: "linear-gradient(135deg, #2E63B6, #2FB1D4)", padding: "14px 18px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#fff" }}>Sign Out</p>
            </div>
            <div style={{ padding: "14px 18px" }}>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>{name}</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: 2 }}>{user?.email || ""}</div>
            </div>
            <div style={{ display: "flex", gap: 10, padding: "0 18px 16px" }}>
              <button
                onClick={() => setShowLogout(false)}
                style={{ flex: 1, padding: "10px", border: "2px solid #e2e8f0", borderRadius: 10, background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                style={{ flex: 1, padding: "10px", border: "none", borderRadius: 10, background: "linear-gradient(135deg, #2F5FB1, #32B6D6)", color: "#fff", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

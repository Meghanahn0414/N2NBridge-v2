import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./emergency-sos.css";

// Map UI labels → backend AlertType enum values
const EMERGENCY_TYPE_MAP = {
  Medical:  "HEALTH",
  Fire:     "EMERGENCY",
  Flood:    "EMERGENCY",
  Accident: "EMERGENCY",
  Security: "SECURITY",
  Other:    "OTHER",
};

// Default priority per type
const PRIORITY_MAP = {
  Medical:  "HIGH",
  Fire:     "CRITICAL",
  Flood:    "CRITICAL",
  Accident: "HIGH",
  Security: "CRITICAL",
  Other:    "MEDIUM",
};

export default function EmergencySOS() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedEmergency, setSelectedEmergency] = useState("Medical");
  const [details, setDetails]                     = useState("");
  const [shareLocation, setShareLocation]         = useState(true);
  const [loading, setLoading]                     = useState(false);
  const [locationWarning, setLocationWarning]     = useState("");

  const emergencyTypes = ["Medical", "Fire", "Flood", "Accident", "Security", "Other"];

  const isActive = (path) => location.pathname.startsWith(path);

  const handleSendAlert = async () => {
    if (!selectedEmergency) { alert("Please select an emergency type"); return; }
    setLoading(true);
    try {
      // Get JWT token from localStorage
      const token = (typeof sessionStorage !== "undefined" && sessionStorage.getItem("token")) || localStorage.getItem("token");
      const userStr = (typeof sessionStorage !== "undefined" && sessionStorage.getItem("user")) || localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;

      if (!token || !user) {
        alert("Please login first");
        navigate("/citizen-login");
        return;
      }

      // Get location if user wants to share it

      let latitude = null, longitude = null;
      setLocationWarning("");
      if (shareLocation) {
        if (!navigator.geolocation) {
          setLocationWarning("Geolocation not supported by this browser.");
        } else {
          try {
            const pos = await new Promise((res, rej) => {
              // Try high accuracy first, fall back to low accuracy on failure
              navigator.geolocation.getCurrentPosition(res,
                () => {
                  // Retry with low accuracy (works better on HTTP)
                  navigator.geolocation.getCurrentPosition(res, rej, {
                    enableHighAccuracy: false, timeout: 10000, maximumAge: 60000,
                  });
                },
                { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
              );
            });
            latitude  = pos.coords.latitude;
            longitude = pos.coords.longitude;
          } catch {
            setLocationWarning("GPS unavailable — alert sent without location.");
          }
        }
      }

      const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

      // Build payload matching backend AlertCreate schema
      const payload = {
        alertType: EMERGENCY_TYPE_MAP[selectedEmergency] || "EMERGENCY",
        priority:  PRIORITY_MAP[selectedEmergency] || "HIGH",
        description: details.trim() || `${selectedEmergency} emergency reported`,
        citizenId: user._id || user.citizenId || user.id || null,
      };

      // Attach GeoJSON location only when coordinates were captured
      if (shareLocation && latitude !== null && longitude !== null) {
        payload.location = {
          type: "Point",
          coordinates: [longitude, latitude], // GeoJSON order: [lng, lat]
        };
      }

      const response = await fetch(`${baseUrl}/api/alerts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const detail = err.detail;
        throw new Error(
          typeof detail === "string" ? detail
          : Array.isArray(detail) ? detail.map((d) => d.msg).join(", ")
          : "Failed to send emergency alert"
        );
      }

      const data = await response.json();
      const ticketId = data.alertNumber || data.data?.alertNumber || "SOS-" + Date.now();
      alert(`Emergency alert sent!\nAlert #: ${ticketId}\n\nWard officers have been notified.`);
      navigate("/citizen");
    } catch (error) {
      console.error("Error sending emergency alert:", error);
      alert("Failed to send emergency alert: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="emergency-sos-container">

      {/* ══ HEADER — flat box, back + title + subtitle ══ */}
      <header className="sos-header">
        <button
          type="button"
          className="sos-back-btn"
          onClick={() => navigate("/citizen")}
          aria-label="Go back"
        >
          ←
        </button>
        <div className="sos-header-text">
          <span className="sos-header-title">Emergency Alert</span>
          <span className="sos-header-subtitle">Broadcast to ward officers</span>
        </div>
      </header>

      {/* ══ CONTENT ══ */}
      <div className="sos-content">

        {/* Warning box */}
        <div className="warning-box">
          <p className="warning-title">Send emergency alert</p>
          <p className="warning-text">Your location will be shared with authorities</p>
        </div>

        {/* Form card */}
        <div className="sos-form-card">
          <form className="sos-form">

            {/* Emergency type */}
            <div className="form-section">
              <label className="form-label">Type of Emergency</label>
              <div className="emergency-types">
                {emergencyTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`emergency-btn${selectedEmergency === type ? " active" : ""}`}
                    onClick={() => setSelectedEmergency(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional details */}
            <div className="form-section">
              <label className="form-label">Additional Details (Optional)</label>
              <textarea
                className="details-input"
                placeholder="Person collapsed near..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
              />
            </div>

            {/* Location sharing */}
            <div className="form-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={shareLocation}
                  onChange={(e) => setShareLocation(e.target.checked)}
                />
                <span className="checkbox-text">Share my live location with responders</span>
              </label>
            </div>

            {locationWarning && (
              <p style={{ color: '#d97706', fontSize: 13, margin: '0 0 8px' }}>
                ⚠️ {locationWarning}
              </p>
            )}

            {/* Send button */}
            <button
              type="button"
              className="send-alert-btn"
              onClick={handleSendAlert}
              disabled={loading}
            >
              {loading ? "Sending…" : "Send emergency alert now"}
            </button>

          </form>
        </div>
      </div>

      {/* ══ BOTTOM NAV ══ */}
      <nav className="bottom-nav" aria-label="Main navigation">
        {[
          { icon: "🏠", label: "Home",    path: "/citizen/dashboard" },
          { icon: "📋", label: "Cases",   path: "/citizen/complaints" },
          { icon: "📅", label: "Events",  path: "/citizen/events" },
          { icon: "👤", label: "Profile", path: "/citizen/profile" },
        ].map(({ icon, label, path }) => (
          <button
            key={label}
            type="button"
            className={`nav-item${isActive(path) ? " active" : ""}`}
            onClick={() => navigate(path)}
            aria-label={label}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

    </div>
  );
}

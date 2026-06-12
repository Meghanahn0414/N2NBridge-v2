import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./emergency-sos.css";

export default function EmergencySOS() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedEmergency, setSelectedEmergency] = useState("Medical");
  const [details, setDetails]                     = useState("");
  const [shareLocation, setShareLocation]         = useState(true);
  const [loading, setLoading]                     = useState(false);

  const emergencyTypes = ["Medical", "Fire", "Flood", "Accident", "Other"];

  const isActive = (path) => location.pathname.startsWith(path);

  const handleSendAlert = async () => {
    if (!selectedEmergency) { alert("Please select an emergency type"); return; }
    setLoading(true);
    try {
      const token   = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      const user    = userStr ? JSON.parse(userStr) : null;
      if (!token || !user) { alert("Please login first"); navigate("/citizen-login"); return; }

      let latitude = null, longitude = null;
      if (shareLocation) {
        try {
          const pos = await new Promise((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, {
              enableHighAccuracy: true, timeout: 10000, maximumAge: 0,
            })
          );
          latitude  = pos.coords.latitude;
          longitude = pos.coords.longitude;
        } catch {
          alert("Warning: Could not access your location. Alert will still be sent.");
        }
      }

      const response = await fetch("http://10.62.179.92:8000/api/emergency/send-alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          citizenId: user._id || user.citizenId || user.id,
          type: selectedEmergency,
          details: details || "No additional details provided",
          latitude, longitude, shareLocation,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to send emergency alert");
      }

      const data       = await response.json();
      const sosTicketId = data.data?.sosTicketId || "SOS-" + Date.now();
      alert(`Emergency alert sent successfully!\nTicket ID: ${sosTicketId}\n\nWard officers have been notified.`);
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

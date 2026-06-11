import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./emergency-sos.css";

export default function EmergencySOS() {
  const navigate = useNavigate();
  const [selectedEmergency, setSelectedEmergency] = useState("Medical");
  const [details, setDetails] = useState("");
  const [shareLocation, setShareLocation] = useState(true);
  const [loading, setLoading] = useState(false);

  const emergencyTypes = ["Medical", "Fire", "Flood", "Accident", "Other"];

  const handleSendAlert = async () => {
    if (!selectedEmergency) {
      alert("Please select an emergency type");
      return;
    }

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
      let latitude = null;
      let longitude = null;

      if (shareLocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (locationError) {
          console.warn("Could not get location:", locationError);
          alert("Warning: Could not access your location. Alert will still be sent.");
        }
      }

      // Prepare alert data for backend
      const alertPayload = {
        citizenId: user.citizenId,
        type: selectedEmergency,
        details: details || "No additional details provided",
        latitude: latitude,
        longitude: longitude,
        shareLocation: shareLocation,
      };

      const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

      // Submit to backend
      const response = await fetch(`${baseUrl}/api/emergency/send-alert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(alertPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to send emergency alert");
      }

      const data = await response.json();
      const sosTicketId = data.data?.sosTicketId || "SOS-" + Date.now();

      // Show success message
      alert(`Emergency alert sent successfully!\nTicket ID: ${sosTicketId}\n\nWard officers have been notified.`);
      
      // Navigate back to dashboard
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
      {/* Header */}
      <div className="sos-header">
        <button 
          className="sos-back-btn"
          onClick={() => navigate("/citizen")}
        >
          ← Back
        </button>
      </div>

      {/* Main Content */}
      <div className="sos-content">
        {/* Emergency Alert Section */}
        <div className="emergency-alert-banner">
          <h1 className="alert-title">Emergency alert</h1>
          <p className="alert-subtitle">Broadcast to ward officers</p>
        </div>

        {/* Warning Box */}
        <div className="warning-box">
          <h2 className="warning-title">Send emergency alert</h2>
          <p className="warning-text">Your location will be shared with authorities</p>
        </div>

        {/* Form */}
        <form className="sos-form">
          {/* Emergency Type Selection */}
          <div className="form-section">
            <label className="form-label">TYPE OF EMERGENCY</label>
            <div className="emergency-types">
              {emergencyTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`emergency-btn ${selectedEmergency === type ? "active" : ""}`}
                  onClick={() => setSelectedEmergency(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          <div className="form-section">
            <label className="form-label">ADDITIONAL DETAILS (OPTIONAL)</label>
            <textarea
              className="details-input"
              placeholder="Person collapsed near..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows="3"
            />
          </div>

          {/* Location Sharing Checkbox */}
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

          {/* Send Button */}
          <button
            type="button"
            className="send-alert-btn"
            onClick={handleSendAlert}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send emergency alert now"}
          </button>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCitizenProfile } from "../../shared/services/citizenService";
import eventService from "../../services/eventService";
import "./dashboard-mobile.css";

export default function CitizenDashboardNew() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    complaints: 0,
    alerts: 0,
    events: 0,
  });
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [activeTab, setActiveTab] = useState("home");
  const navigate = useNavigate();

  useEffect(() => {
    loadProfileData();
    loadStats();
    loadNotifications();
  }, []);

  const loadProfileData = async () => {
    try {
      const data = await getCitizenProfile();
      setProfile(data);
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  const loadStats = async () => {
    try {
      // Fetch stats from backend APIs
      const complaintStats = await eventService.getComplaintStats();
      const alertStats = await eventService.getAlertStats();
      const eventStats = await eventService.getEventStats();

      setStats({
        complaints: complaintStats.total || complaintStats.open || 0,
        alerts: alertStats.unread || 0,
        events: eventStats.registered || 0,
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
      // Keep default values on error
      setStats({
        complaints: 0,
        alerts: 0,
        events: 0,
      });
    }
  };

  const loadNotifications = async () => {
    try {
      // Fetch notifications/alerts from backend
      const alertStats = await eventService.getAlertStats();
      setUnreadNotifications(alertStats.unread || 0);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    switch (tab) {
      case "home":
        navigate("/citizen");
        break;
      case "complain":
        navigate("/citizen/create-complaint");
        break;
      case "map":
        navigate("/citizen/map");
        break;
      case "alerts":
        navigate("/citizen/notifications");
        break;
      case "profile":
        navigate("/citizen/profile");
        break;
      default:
        break;
    }
  };

  const handleEmergency = () => {
    navigate("/citizen/sos");
  };

  if (!profile) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  return (
    <div className="dashboard-mobile-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="greeting">
            <h1 className="greeting-text">Good morning, {profile.fullName || "Citizen"}</h1>
            <p className="header-meta">
              {profile.ward || "Ward"} - {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="header-actions">
            <div className="notification-badge">
              <span className="badge-count">{unreadNotifications}</span>
              <span className="badge-icon">🔔</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Alert Banner */}
        <div className="alert-banner">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <p className="alert-title">Water cut today</p>
            <p className="alert-time">9AM-5PM - {profile.ward || "Ward"}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div 
            className="stat-card"
            onClick={() => navigate("/citizen/complaints")}
            style={{ cursor: "pointer" }}
          >
            <span className="stat-number">{stats.complaints}</span>
            <span className="stat-label">Complaints</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.alerts}</span>
            <span className="stat-label">Alerts</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.events}</span>
            <span className="stat-label">Events</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h3 className="section-title">QUICK ACTIONS</h3>
          <div className="actions-grid">
            <div
              className="action-card action-complain"
              onClick={() => navigate("/citizen/create-complaint")}
            >
              <span className="action-icon">📝</span>
              <span className="action-label">File complaint</span>
            </div>
            <div
              className="action-card action-sos"
              onClick={handleEmergency}
            >
              <span className="action-icon">🚨</span>
              <span className="action-label">SOS</span>
            </div>
            <div
              className="action-card action-events"
              onClick={() => navigate("/citizen/events")}
            >
              <span className="action-icon">📅</span>
              <span className="action-label">Events</span>
            </div>
            <div
              className="action-card action-feedback"
              onClick={() => navigate("/citizen/feedback")}
            >
              <span className="action-icon">💬</span>
              <span className="action-label">Feedback</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button
          className={`nav-item ${activeTab === "home" ? "active" : ""}`}
          onClick={() => handleTabClick("home")}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </button>
        <button
          className={`nav-item ${activeTab === "complain" ? "active" : ""}`}
          onClick={() => handleTabClick("complain")}
        >
          <span className="nav-icon">📝</span>
          <span className="nav-label">Complain</span>
        </button>
        <button
          className={`nav-item ${activeTab === "map" ? "active" : ""}`}
          onClick={() => handleTabClick("map")}
        >
          <span className="nav-icon">🗺️</span>
          <span className="nav-label">Map</span>
        </button>
        <button
          className={`nav-item ${activeTab === "alerts" ? "active" : ""}`}
          onClick={() => handleTabClick("alerts")}
        >
          <span className="nav-icon">🔔</span>
          <span className="nav-label">Alerts</span>
        </button>
        <button
          className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => handleTabClick("profile")}
        >
          <span className="nav-icon">👤</span>
          <span className="nav-label">Profile</span>
        </button>
      </div>
    </div>
  );
}

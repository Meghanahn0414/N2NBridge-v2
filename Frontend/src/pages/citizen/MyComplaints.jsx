import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import complaintService from "../../services/complaintService";
import "./my-complaints.css";

export default function MyComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, open, assigned, pending, resolved

  useEffect(() => {
    const fetchComplaints = async () => {
      setLoading(true);
      try {
        const data = await complaintService.getMyComplaints();
        if (data && data.complaints && data.complaints.length > 0) {
          setComplaints(data.complaints);
        } else {
          setComplaints([]);
        }
      } catch (error) {
        console.error("Error fetching complaints from API:", error);
        setComplaints([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "status-open";
      case "Assigned":
        return "status-assigned";
      case "Pending":
        return "status-pending";
      case "Resolved":
        return "status-resolved";
      default:
        return "status-open";
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      Roads: "🛣️",
      Water: "💧",
      Waste: "🗑️",
      Electricity: "⚡",
      Parks: "🌳",
      Drainage: "🌊",
      "Street Light": "💡",
      Other: "📝",
    };
    return icons[category] || "📝";
  };

  const filteredComplaints = complaints.filter((complaint) => {
    if (filter === "all") return true;
    if (filter === "open") return complaint.status === "Open";
    if (filter === "assigned") return complaint.status === "Assigned";
    if (filter === "pending") return complaint.status === "Pending";
    if (filter === "resolved") return complaint.status === "Resolved";
    return true;
  });

  return (
    <div className="my-complaints-container">
      {/* Header */}
      <div className="complaints-header">
        <button
          className="complaints-back-btn"
          onClick={() => navigate("/citizen")}
        >
          ←
        </button>
        <div className="complaints-header-content">
          <h1 className="complaints-title">My Complaints</h1>
          <p className="complaints-subtitle">Track and manage your complaints</p>
        </div>
        <div className="complaints-header-icon">📋</div>
      </div>

      {/* Filter Tabs */}
      <div className="complaints-filters">
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({complaints.length})
        </button>
        <button
          className={`filter-btn ${filter === "open" ? "active" : ""}`}
          onClick={() => setFilter("open")}
        >
          Open ({complaints.filter((c) => c.status === "Open").length})
        </button>
        <button
          className={`filter-btn ${filter === "assigned" ? "active" : ""}`}
          onClick={() => setFilter("assigned")}
        >
          Assigned ({complaints.filter((c) => c.status === "Assigned").length})
        </button>
        <button
          className={`filter-btn ${filter === "resolved" ? "active" : ""}`}
          onClick={() => setFilter("resolved")}
        >
          Resolved ({complaints.filter((c) => c.status === "Resolved").length})
        </button>
      </div>

      {/* Complaints List */}
      <div className="complaints-list">
        {loading ? (
          <div className="loading-state">
            <p>Loading your complaints...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">📭</p>
            <p className="empty-text">No complaints found</p>
          </div>
        ) : (
          filteredComplaints.map((complaint) => (
            <div
              key={complaint.id}
              className="complaint-card"
              onClick={() => navigate(`/citizen/complaints/${complaint.id}`)}
            >
              <div className="complaint-header-row">
                <div className="complaint-id-section">
                  <h3 className="complaint-id">{complaint.complaintId}</h3>
                  <span className={`complaint-status ${getStatusColor(complaint.status)}`}>
                    {complaint.status}
                  </span>
                </div>
                <p className="complaint-time">Submitted {getTimeAgo(complaint.submittedDate)}</p>
              </div>

              <div className="complaint-title">
                {getCategoryIcon(complaint.category)} {complaint.title}
              </div>

              <div className="complaint-details">
                <p className="detail-line">
                  {complaint.category} · Ward {complaint.ward} · {complaint.location}
                </p>
              </div>

              <div className="complaint-priority">
                <span className={`priority-badge priority-${complaint.priority.toLowerCase()}`}>
                  {complaint.priority} Priority
                </span>
              </div>

              <div className="complaint-footer">
                <div className="rating-preview">
                  {complaint.rating > 0 ? (
                    <>
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`star-small ${i < complaint.rating ? "filled" : ""}`}
                        >
                          ★
                        </span>
                      ))}
                      <span className="rating-value">({complaint.rating}/5)</span>
                    </>
                  ) : (
                    <span className="no-rating">No rating yet</span>
                  )}
                </div>
                <span className="arrow-icon">→</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date("2026-06-10"); // Using the app's current date
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

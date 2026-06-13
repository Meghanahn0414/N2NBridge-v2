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

  const STATUS_OPEN    = ["NEW", "IN_PROGRESS", "ON_HOLD"];
  const STATUS_ASSIGNED = ["ASSIGNED"];
  const STATUS_RESOLVED = ["RESOLVED", "CLOSED"];

  const getStatusColor = (status) => {
    if (STATUS_RESOLVED.includes(status)) return "status-resolved";
    if (STATUS_ASSIGNED.includes(status)) return "status-assigned";
    return "status-open";
  };

  const getStatusLabel = (status) => {
    const map = {
      NEW: "New",
      ASSIGNED: "Assigned",
      IN_PROGRESS: "In Progress",
      ON_HOLD: "On Hold",
      RESOLVED: "Resolved",
      CLOSED: "Closed",
      REJECTED: "Rejected",
    };
    return map[status] || status;
  };

  const getCategoryIcon = (category) => {
    const s = (category || "").toUpperCase();
    if (s.includes("ROAD")) return "🛣️";
    if (s.includes("WATER")) return "💧";
    if (s.includes("ELECTRIC")) return "⚡";
    if (s.includes("GARBAGE") || s.includes("WASTE")) return "🗑️";
    if (s.includes("NOISE")) return "🔊";
    return "📝";
  };

  const filteredComplaints = complaints.filter((complaint) => {
    if (filter === "all") return true;
    if (filter === "open") return STATUS_OPEN.includes(complaint.status);
    if (filter === "assigned") return STATUS_ASSIGNED.includes(complaint.status);
    if (filter === "resolved") return STATUS_RESOLVED.includes(complaint.status);
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
          Open ({complaints.filter((c) => STATUS_OPEN.includes(c.status)).length})
        </button>
        <button
          className={`filter-btn ${filter === "assigned" ? "active" : ""}`}
          onClick={() => setFilter("assigned")}
        >
          Assigned ({complaints.filter((c) => STATUS_ASSIGNED.includes(c.status)).length})
        </button>
        <button
          className={`filter-btn ${filter === "resolved" ? "active" : ""}`}
          onClick={() => setFilter("resolved")}
        >
          Resolved ({complaints.filter((c) => STATUS_RESOLVED.includes(c.status)).length})
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
              key={complaint.id || complaint._id || complaint.complaintNumber}
              className="complaint-card"
              onClick={() => {
                const cid = complaint.id || complaint._id;
                if (cid) navigate(`/citizen/complaints/${cid}`);
              }}
            >
              <div className="complaint-header-row">
                <div className="complaint-id-section">
                  <h3 className="complaint-id">{complaint.complaintNumber}</h3>
                  <span className={`complaint-status ${getStatusColor(complaint.status)}`}>
                    {getStatusLabel(complaint.status)}
                  </span>
                </div>
                <p className="complaint-time">Submitted {getTimeAgo(complaint.createdAt)}</p>
              </div>

              <div className="complaint-title">
                {getCategoryIcon(complaint.category || complaint.categoryId)} {complaint.description}
              </div>

              <div className="complaint-details">
                <p className="detail-line">
                  {complaint.category || complaint.categoryId || "General"}
                  {complaint.wardId ? ` · Ward ${complaint.wardId}` : ""}
                  {complaint.address ? ` · ${complaint.address}` : ""}
                </p>
              </div>

              <div className="complaint-priority">
                <span className={`priority-badge priority-${(complaint.priority || "medium").toLowerCase()}`}>
                  {complaint.priority || "MEDIUM"} Priority
                </span>
              </div>

              <div className="complaint-footer">
                <div className="rating-preview">
                  {complaint.feedback?.rating > 0 ? (
                    <>
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`star-small ${i < complaint.feedback.rating ? "filled" : ""}`}
                        >
                          ★
                        </span>
                      ))}
                      <span className="rating-value">({complaint.feedback.rating}/5)</span>
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
  if (!dateString) return "unknown date";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "unknown date";
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

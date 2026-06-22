import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import complaintService from "../../services/complaintService";
import api from "../../shared/services/api";
import "./complaint-detail.css";

const STATUS_COLORS = {
  NEW: "#6366f1",
  ASSIGNED: "#f59e0b",
  IN_PROGRESS: "#3b82f6",
  ON_HOLD: "#f97316",
  RESOLVED: "#10b981",
  CLOSED: "#10b981",
  REJECTED: "#ef4444",
};

const STATUS_LABELS = {
  NEW: "New",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REJECTED: "Rejected",
};

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [ratingSaved, setRatingSaved] = useState(false);

  useEffect(() => {
    const fetchComplaint = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await complaintService.getComplaintDetail(id);
        if (data) {
          setComplaint(data);
          const existingRating = data.feedback?.rating || 0;
          setRating(existingRating);
          setRatingSaved(existingRating > 0);
        }
      } catch (error) {
        console.error("Error fetching complaint:", error);
        setComplaint(null);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [id]);

  const handleRating = async (value) => {
    if (ratingSaved) return; // already submitted
    setRating(value);
    try {
      await api.post(`/api/grievances/${id}/feedback`, {
        rating: value,
        comments: "",
        submittedAt: new Date().toISOString(),
      });
      setRatingSaved(true);
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  const getRatingLabel = (r) => {
    const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
    return labels[r] || "";
  };

  if (loading) {
    return (
      <div className="complaint-detail-container">
        <div className="loading-state">Loading complaint details...</div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="complaint-detail-container">
        <div className="error-state">
          <p>Complaint not found</p>
          <button className="go-back-btn" onClick={() => navigate("/citizen/complaints")}>
            ←
          </button>
        </div>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[complaint.status] || "#6b7280";
  const statusLabel = STATUS_LABELS[complaint.status] || complaint.status;

  const timeline = [
    {
      title: "Complaint Submitted",
      date: complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : "-",
      details: "Your complaint has been received.",
    },
    ...(Array.isArray(complaint.history) ? complaint.history.map((entry) => ({
      title: STATUS_LABELS[entry.newStatus] || entry.newStatus,
      date: entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "-",
      details: entry.remarks || "Status updated.",
    })) : []),
  ];

  return (
    <div className="complaint-detail-container">
      {/* Header */}
      <div className="detail-header">
        <button className="detail-back-btn" onClick={() => navigate("/citizen/complaints")}>
          ←
        </button>
        <div className="detail-header-content">
          <div className="detail-title-section">
            <h1 className="detail-complaint-id">{complaint.complaintNumber}</h1>
            <span className="detail-status" style={{ backgroundColor: statusColor }}>
              {statusLabel}
            </span>
          </div>
          <p className="detail-submitted">
            Submitted {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : "-"}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="detail-content">
        {/* Description */}
        <div className="detail-section">
          <h2 className="detail-main-title">{complaint.description}</h2>
          <p className="detail-location">
            {complaint.category || complaint.categoryId || "General"}
            {complaint.wardId ? ` · Ward ${complaint.wardId}` : ""}
            {complaint.address ? ` · ${complaint.address}` : ""}
          </p>
        </div>

        {/* Timeline */}
        <div className="detail-section">
          <h3 className="section-title">TIMELINE</h3>
          <div className="timeline">
            {timeline.map((event, index) => (
              <div key={index} className="timeline-event">
                <div className="timeline-marker">📌</div>
                <div className="timeline-content">
                  <h4 className="timeline-event-title">{event.title}</h4>
                  <p className="timeline-date">{event.date}</p>
                  {event.details && <p className="timeline-details">{event.details}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div className="detail-section">
          <h3 className="section-title">RATE THIS RESPONSE</h3>
          <div className="rating-section">
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`rating-star ${star <= ((!ratingSaved && hoveredRating) || rating) ? "filled" : "empty"}`}
                  onMouseEnter={() => { if (!ratingSaved) setHoveredRating(star); }}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => handleRating(star)}
                  disabled={ratingSaved}
                  style={{ cursor: ratingSaved ? "default" : "pointer" }}
                >
                  ★
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="rating-label">
                {getRatingLabel(rating)}
                {ratingSaved && <span style={{ marginLeft: 8, fontSize: 12, color: "#15803d", fontWeight: 600 }}>✓ Saved</span>}
              </p>
            )}
          </div>
        </div>

        {/* Details grid */}
        <div className="detail-section">
          <h3 className="section-title">DETAILS</h3>
          <div className="detail-description">
            <p>{complaint.description}</p>
          </div>
          <div className="detail-info-grid">
            <div className="info-item">
              <span className="info-label">Category</span>
              <span className="info-value">{complaint.category || complaint.categoryId || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Priority</span>
              <span className="info-value">{complaint.priority || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Ward</span>
              <span className="info-value">{complaint.wardId || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Status</span>
              <span className="info-value" style={{ color: statusColor }}>{statusLabel}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Address</span>
              <span className="info-value">{complaint.address || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Attachments */}
        {Array.isArray(complaint.attachments) && complaint.attachments.length > 0 && (
          <div className="detail-section">
            <h3 className="section-title">ATTACHMENTS</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {complaint.attachments.map((att) => (
                <li key={att.fileUrl} style={{ marginBottom: 8 }}>
                  <a href={att.fileUrl} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>
                    {att.fileName}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

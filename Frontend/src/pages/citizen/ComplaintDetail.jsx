import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import complaintService from "../../services/complaintService";
import "./complaint-detail.css";

export default function ComplaintDetail() {
  const { complaintId } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    const fetchComplaint = async () => {
      setLoading(true);
      try {
        // Fetch from API
        const data = await complaintService.getComplaintDetail(complaintId);
        if (data) {
          setComplaint(data);
          setRating(data.rating || 0);
        } else {
          setComplaint(null);
        }
      } catch (error) {
        console.error("Error fetching complaint from API:", error);
        setComplaint(null);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [complaintId]);

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

  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "#ef4444";
      case "Assigned":
        return "#f59e0b";
      case "Pending":
        return "#f97316";
      case "Resolved":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const handleRating = async (value) => {
    setRating(value);
    
    // Submit rating to backend
    if (complaint) {
      try {
        await complaintService.updateComplaint(complaint.complaintId, { rating: value });
        console.log("Rating submitted successfully");
      } catch (error) {
        console.error("Error submitting rating:", error);
        // Rating is still updated locally even if API fails
      }
    }
  };

  const getRatingLabel = (rating) => {
    if (rating === 0) return "";
    if (rating === 1) return "Poor";
    if (rating === 2) return "Fair";
    if (rating === 3) return "Good";
    if (rating === 4) return "Very Good";
    if (rating === 5) return "Excellent";
  };

  return (
    <div className="complaint-detail-container">
      {/* Header */}
      <div className="detail-header">
        <button className="detail-back-btn" onClick={() => navigate("/citizen/complaints")}>
          ← Back
        </button>
        <div className="detail-header-content">
          <div className="detail-title-section">
            <h1 className="detail-complaint-id">{complaint.complaintId}</h1>
            <span className="detail-status" style={{ backgroundColor: getStatusColor(complaint.status) }}>
              {complaint.status}
            </span>
          </div>
          <p className="detail-submitted">Submitted 3 days ago</p>
        </div>
      </div>

      {/* Content */}
      <div className="detail-content">
        {/* Complaint Title */}
        <div className="detail-section">
          <h2 className="detail-main-title">{complaint.title}</h2>
          <p className="detail-location">
            {complaint.category} · Ward {complaint.ward} · {complaint.location}
          </p>
        </div>

        {/* Timeline Section */}
        <div className="detail-section">
          <h3 className="section-title">TIMELINE</h3>
          <div className="timeline">
            {complaint.timeline.map((event, index) => (
              <div key={index} className="timeline-event">
                <div className="timeline-marker" title={event.type}>
                  {event.icon}
                </div>
                <div className="timeline-content">
                  <h4 className="timeline-event-title">{event.title}</h4>
                  <p className="timeline-date">{event.date}</p>
                  {event.details && <p className="timeline-details">{event.details}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Section */}
        <div className="detail-section">
          <h3 className="section-title">RATE THIS RESPONSE</h3>
          <div className="rating-section">
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`rating-star ${
                    star <= (hoveredRating || rating) ? "filled" : "empty"
                  }`}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => handleRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="rating-label">{getRatingLabel(rating)}</p>
            )}
          </div>
        </div>

        {/* Description Section */}
        <div className="detail-section">
          <h3 className="section-title">DETAILS</h3>
          <div className="detail-description">
            <p>{complaint.description}</p>
          </div>

          <div className="detail-info-grid">
            <div className="info-item">
              <span className="info-label">Category</span>
              <span className="info-value">{complaint.category}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Priority</span>
              <span className={`info-value priority-${complaint.priority.toLowerCase()}`}>
                {complaint.priority}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Ward</span>
              <span className="info-value">{complaint.ward}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Status</span>
              <span className="info-value" style={{ color: getStatusColor(complaint.status) }}>
                {complaint.status}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="detail-actions">
          <button className="action-btn primary-btn">View Photos</button>
          <button className="action-btn secondary-btn">Contact Officer</button>
        </div>
      </div>
    </div>
  );
}

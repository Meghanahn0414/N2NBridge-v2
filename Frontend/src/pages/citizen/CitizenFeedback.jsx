import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import complaintService from "../../services/complaintService";
import { fetchEvents } from "../../features/events/eventService";
import api from "../../shared/services/api";
import "./citizen-feedback.css";

const CATEGORY_ICONS = {
  "Garbage": "🗑️", "Sanitation": "🗑️", "Road": "🛣️", "Roads": "🛣️",
  "Water": "💧", "Electricity": "💡", "Health": "🏥", "Education": "📚",
  "Street Light": "💡", "Drainage": "🌊", "Park": "🌳", "Noise": "🔊",
  "Infrastructure": "🏗️", "Transport": "🚌",
};

function categoryIcon(name) {
  if (!name) return "📋";
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return "📋";
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function CitizenFeedback() {
  const navigate = useNavigate();
  const [resolvedComplaints, setResolvedComplaints] = useState([]);
  const [surveys, setSurveys]                       = useState([]);
  const [ratings, setRatings]                       = useState({});
  const [submitted, setSubmitted]                   = useState({});
  const [hoveredService, setHoveredService]         = useState(null);
  const [tempRating, setTempRating]                 = useState(null);
  const [loading, setLoading]                       = useState(true);
  const [saving, setSaving]                         = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load resolved/closed complaints to rate
      const result = await complaintService.getMyComplaints(1, 20, "RESOLVED");
      const list = result?.complaints || result || [];
      const resolved = list.filter(
        c => ["RESOLVED", "CLOSED", "resolved", "closed"].includes(c.status)
      );
      setResolvedComplaints(resolved);

      // Pre-fill ratings from existing feedback
      const prefilled = {};
      const alreadyRated = {};
      resolved.forEach(c => {
        if (c.feedback?.rating) {
          prefilled[c._id || c.id] = c.feedback.rating;
          alreadyRated[c._id || c.id] = true;
        }
      });
      setRatings(prefilled);
      setSubmitted(alreadyRated);
    } catch {
      setResolvedComplaints([]);
    }

    try {
      // Use events as surveys (type SURVEY or title containing survey)
      const evData = await fetchEvents(1, 100);
      const surveyItems = (evData || []).filter(
        e => e.type?.toLowerCase() === "survey" ||
             e.title?.toLowerCase().includes("survey") ||
             e.title?.toLowerCase().includes("poll")
      );
      setSurveys(surveyItems);
    } catch {
      setSurveys([]);
    }

    setLoading(false);
  };

  const handleStarClick = (complaintId, star) => {
    if (submitted[complaintId]) return; // already rated
    setRatings(r => ({ ...r, [complaintId]: star }));
    setHoveredService(null);
  };

  const handleSubmitRating = async (complaint) => {
    const id = complaint._id || complaint.id;
    const rating = ratings[id];
    if (!rating) return;
    setSaving(id);
    try {
      await api.post(`/api/grievances/${id}/feedback`, {
        rating,
        comments: "",
        submittedAt: new Date().toISOString(),
      });
      setSubmitted(s => ({ ...s, [id]: true }));
    } catch {
      alert("Failed to save rating. Please try again.");
    } finally {
      setSaving(null);
    }
  };

  const StarRating = ({ id, currentRating, locked }) => {
    const display = (!locked && hoveredService === id) ? tempRating : currentRating;
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            className={`star-btn ${star <= display ? "filled" : ""}`}
            onMouseEnter={() => { if (!locked) { setHoveredService(id); setTempRating(star); } }}
            onMouseLeave={() => setHoveredService(null)}
            onClick={() => handleStarClick(id, star)}
            disabled={locked}
            style={{ cursor: locked ? "default" : "pointer" }}
            aria-label={`Rate ${star} stars`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="citizen-feedback-container">
      {/* Header */}
      <div className="feedback-header">
        <button className="feedback-back-btn" onClick={() => navigate("/citizen")}>←</button>
        <div className="feedback-header-content">
          <h1 className="feedback-title">Feedback & surveys</h1>
          <p className="feedback-subtitle">Help improve your ward</p>
        </div>
        <div className="header-star">⭐</div>
      </div>

      <div className="feedback-content">

        {/* Rate Recent Services */}
        <div className="feedback-section">
          <h2 className="section-title">RATE RECENT SERVICES</h2>

          {loading ? (
            <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
              Loading your resolved complaints…
            </div>
          ) : resolvedComplaints.length === 0 ? (
            <div style={{
              background: "#fff", borderRadius: 12, padding: "20px 16px",
              textAlign: "center", color: "#94a3b8", fontSize: 13,
              border: "1px solid #e8edf3",
            }}>
              No resolved complaints to rate yet. Resolved complaints will appear here.
            </div>
          ) : (
            <div className="services-list">
              {resolvedComplaints.map(c => {
                const id = c._id || c.id;
                const category = c.categoryName || c.category || c.categoryId || "Service";
                const resolvedDate = c.resolvedAt || c.updatedAt;
                const isRated = submitted[id];
                const hasRating = !!ratings[id];

                return (
                  <div key={id} className="service-card">
                    <div className="service-header">
                      <div className="service-info">
                        <div className="service-icon">{categoryIcon(category)}</div>
                        <div className="service-text">
                          <h3 className="service-name">
                            {c.title || c.subject || category}
                          </h3>
                          <p className="service-details">
                            {resolvedDate ? `Resolved: ${formatDate(resolvedDate)}` : category}
                          </p>
                        </div>
                      </div>
                      {isRated && (
                        <span style={{ fontSize: 11, color: "#15803d", fontWeight: 600, background: "#dcfce7", padding: "2px 8px", borderRadius: 20 }}>
                          Rated ✓
                        </span>
                      )}
                    </div>
                    <div className="service-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <StarRating id={id} currentRating={ratings[id] || 0} locked={isRated} />
                      {!isRated && hasRating && (
                        <button
                          onClick={() => handleSubmitRating(c)}
                          disabled={saving === id}
                          style={{
                            padding: "6px 14px", background: "#1a5290", color: "#fff",
                            border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {saving === id ? "Saving…" : "Submit"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Surveys */}
        <div className="feedback-section">
          <h2 className="section-title">ACTIVE SURVEY</h2>

          {loading ? (
            <div style={{ padding: "16px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Loading…</div>
          ) : surveys.length === 0 ? (
            <div style={{
              background: "#fff", borderRadius: 12, padding: "20px 16px",
              textAlign: "center", color: "#94a3b8", fontSize: 13,
              border: "1px solid #e8edf3",
            }}>
              No active surveys at the moment.
            </div>
          ) : (
            surveys.map(s => (
              <div key={s._id || s.id} className="survey-card">
                <div className="survey-header">
                  <div className="survey-icon">📋</div>
                  <div className="survey-info">
                    <h3 className="survey-title">{s.title}</h3>
                    <p className="survey-duration">
                      {s.description || `${s.type || "Survey"} • ${s.date ? formatDate(s.date) : ""}`}
                    </p>
                  </div>
                </div>
                <button className="survey-btn" onClick={() => alert("Survey launching soon!")}>
                  Start survey
                </button>
              </div>
            ))
          )}
        </div>

        <div className="feedback-prompt">
          <p className="prompt-text">
            Your feedback helps us improve services in your ward. Thank you!
          </p>
        </div>
      </div>
    </div>
  );
}

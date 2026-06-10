import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./citizen-feedback.css";

export default function CitizenFeedback() {
  const navigate = useNavigate();
  const [ratings, setRatings] = useState({
    garbage_collection: 4,
    road_maintenance: 2,
  });

  const [hoveredService, setHoveredService] = useState(null);
  const [tempRating, setTempRating] = useState(null);

  const recentServices = [
    {
      id: "garbage_collection",
      name: "Garbage collection",
      details: "Last pickup: Jun 9",
      icon: "🗑️",
    },
    {
      id: "road_maintenance",
      name: "Road maintenance",
      details: "Ward officer: Ramesh K.",
      icon: "🛣️",
    },
  ];

  const activeSurvey = {
    id: 1,
    title: "Ward satisfaction survey 2026",
    questions: 5,
    duration: "~2 min",
    icon: "📋",
  };

  const handleStarHover = (serviceId, rating) => {
    setHoveredService(serviceId);
    setTempRating(rating);
  };

  const handleStarClick = (serviceId, rating) => {
    setRatings({
      ...ratings,
      [serviceId]: rating,
    });
    setHoveredService(null);
    setTempRating(null);
  };

  const handleSurveyStart = () => {
    alert("Survey will launch soon! Thank you for your interest.");
  };

  const StarRating = ({ serviceId, currentRating }) => {
    const displayRating =
      hoveredService === serviceId ? tempRating : currentRating;

    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className={`star-btn ${star <= displayRating ? "filled" : ""}`}
            onMouseEnter={() => handleStarHover(serviceId, star)}
            onMouseLeave={() => setHoveredService(null)}
            onClick={() => handleStarClick(serviceId, star)}
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
        <button
          className="feedback-back-btn"
          onClick={() => navigate("/citizen")}
        >
          ← Back
        </button>
        <div className="header-content">
          <h1 className="header-title">Feedback & surveys</h1>
          <p className="header-subtitle">Help improve your ward</p>
        </div>
        <div className="header-star">⭐</div>
      </div>

      {/* Content */}
      <div className="feedback-content">
        {/* Rate Recent Services Section */}
        <div className="feedback-section">
          <h2 className="section-title">RATE RECENT SERVICES</h2>

          <div className="services-list">
            {recentServices.map((service) => (
              <div key={service.id} className="service-card">
                <div className="service-header">
                  <div className="service-info">
                    <div className="service-icon">{service.icon}</div>
                    <div className="service-text">
                      <h3 className="service-name">{service.name}</h3>
                      <p className="service-details">{service.details}</p>
                    </div>
                  </div>
                </div>
                <div className="service-footer">
                  <StarRating
                    serviceId={service.id}
                    currentRating={ratings[service.id] || 0}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Survey Section */}
        <div className="feedback-section">
          <h2 className="section-title">ACTIVE SURVEY</h2>

          <div className="survey-card">
            <div className="survey-header">
              <div className="survey-icon">{activeSurvey.icon}</div>
              <div className="survey-info">
                <h3 className="survey-title">{activeSurvey.title}</h3>
                <p className="survey-duration">
                  {activeSurvey.questions} questions • {activeSurvey.duration}
                </p>
              </div>
            </div>

            <button
              className="survey-btn"
              onClick={handleSurveyStart}
            >
              Start survey
            </button>
          </div>
        </div>

        {/* Feedback Prompt */}
        <div className="feedback-prompt">
          <p className="prompt-text">
            Your feedback helps us improve services in your ward. Thank you!
          </p>
        </div>
      </div>
    </div>
  );
}

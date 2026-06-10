import React from "react";
import { useNavigate } from "react-router-dom";
import "./splash.css";

export default function CitizenSplash() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/citizen-login");
  };

  const handleAlreadyHaveAccount = () => {
    navigate("/citizen-login");
  };

  return (
    <div className="splash-container">
      <div className="splash-card">
        {/* App Branding */}
        <div className="splash-header">
          <div className="app-icon">
            <svg
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
              className="icon-svg"
            >
              {/* Building/Home icon */}
              <rect x="40" y="60" width="120" height="100" fill="none" stroke="#fff" strokeWidth="4" rx="8"/>
              
              {/* Windows */}
              <rect x="55" y="75" width="20" height="20" fill="#22d3ee"/>
              <rect x="85" y="75" width="20" height="20" fill="#06b6d4"/>
              <rect x="115" y="75" width="20" height="20" fill="#0891b2"/>
              
              {/* Door */}
              <rect x="85" y="110" width="30" height="50" fill="none" stroke="#fff" strokeWidth="3"/>
              <circle cx="110" cy="135" r="2" fill="#fff"/>
              
              {/* Flag/indicator at top */}
              <circle cx="60" cy="55" r="8" fill="#10b981"/>
              <path d="M 68 55 L 68 50" stroke="#fff" strokeWidth="2"/>
            </svg>
          </div>
          <h1 className="app-title">Citizen Connect</h1>
          <p className="app-tagline">Your ward. Your voice.</p>
        </div>

        {/* Main Messaging */}
        <div className="splash-content">
          <div className="splash-divider"></div>
          
          <h2 className="splash-heading">Report. Track. Resolve.</h2>
          
          <p className="splash-description">
            File civic complaints, get real-time updates and connect with your ward officer.
          </p>

          <div className="splash-features">
            <div className="feature-item">
              <span className="feature-icon">📝</span>
              <span>File Complaints</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⏱️</span>
              <span>Real-time Updates</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🤝</span>
              <span>Connect with Officials</span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="splash-actions">
          <button
            onClick={handleGetStarted}
            className="btn-primary"
          >
            Get started
          </button>

          <button
            onClick={handleAlreadyHaveAccount}
            className="btn-link"
          >
            I already have an account
          </button>
        </div>

        {/* Footer */}
        <div className="splash-footer">
          <p className="footer-label">SPLASH / ONBOARDING</p>
          <p className="footer-description">App intro with civic illustration</p>
        </div>
      </div>
    </div>
  );
}

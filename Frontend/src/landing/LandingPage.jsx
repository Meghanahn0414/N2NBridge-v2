import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();
  const [showLoginOptions, setShowLoginOptions] = useState(false);

  const handleLogin = (path) => {
    setShowLoginOptions(false);
    navigate(path, { replace: false });
  };

  return (
    <div className="landing-page">
      <div className="landing-header">
        <button 
          className="sign-in-btn"
          onClick={() => setShowLoginOptions(!showLoginOptions)}
        >
          Sign In
        </button>
      </div>

      {/* Login Options Modal */}
      {showLoginOptions && (
        <div className="login-options-overlay" onClick={() => setShowLoginOptions(false)}>
          <div className="login-options-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="login-options-title">Select Your Login Type</h2>
            <div className="login-options-grid">
              <button
                type="button"
                className="login-option-card citizen"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLoginOptions(false);
                  window.open("/citizen/", "_blank");
                }}
              >
                <div className="login-option-icon notranslate">👤</div>
                <h3>Citizen</h3>
                <p>Login as a citizen</p>
              </button>
              
              <button
                type="button"
                className="login-option-card admin"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogin("/admin-login");
                }}
              >
                <div className="login-option-icon notranslate">👨‍💼</div>
                <h3>Admin</h3>
                <p>Login as admin</p>
              </button>
              
              <button
                type="button"
                className="login-option-card manager"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogin("/admin-login?role=MANAGER");
                }}
              >
                <div className="login-option-icon notranslate">📋</div>
                <h3>Manager</h3>
                <p>Constituency Manager</p>
              </button>
              
              <button
                type="button"
                className="login-option-card officer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogin("/admin-login?role=FIELD_OFFICER");
                }}
              >
                <div className="login-option-icon notranslate">🚗</div>
                <h3>Field Officer</h3>
                <p>Login as field officer</p>
              </button>
              
              <button
                type="button"
                className="login-option-card representative"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogin("/admin-login?role=REPRESENTATIVE");
                }}
              >
                <div className="login-option-icon notranslate">🏛️</div>
                <h3>Representative</h3>
                <p>MLA/Representative Login</p>
              </button>
            </div>
            <button
              className="close-modal-btn notranslate"
              onClick={() => setShowLoginOptions(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero">
         <div className="hero-content">
          <pre><b><h1 className="hero-title">Citizen Relation Management</h1></b></pre>
          <pre className="hero-subtitle">
Welcome to the Citizen Relation Management System. Efficiently manage citizen records and more with our intuitive platform.
          </pre>
        </div>
      </section>

      {/* Background Elements */}
     <div className="bg-elements">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
        <div className="tech-line line-1"></div>
        <div className="tech-line line-2"></div>
      </div>
    </div>
  );
}
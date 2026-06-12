import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();
  const [showLoginOptions, setShowLoginOptions] = useState(false);

  const handleLogin = (path) => {
    setShowLoginOptions(false);
    // Use a small delay to ensure modal closes before navigation
    setTimeout(() => {
      navigate(path);
    }, 100);
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
              <div
                className="login-option-card citizen"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogin("/citizen-splash");
                }}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === "Enter" && handleLogin("/citizen-splash")}
              >
                <div className="login-option-icon">👤</div>
                <h3>Citizen</h3>
                <p>Login as a citizen</p>
              </div>
              
              <div 
                className="login-option-card admin"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogin("/admin-signup");
                }}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === "Enter" && handleLogin("/admin-signup")}
              >
                <div className="login-option-icon">👨‍💼</div>
                <h3>Admin</h3>
                <p>Create new account</p>
              </div>
              
              <div 
                className="login-option-card manager"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogin("/admin-login?role=MANAGER");
                }}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === "Enter" && handleLogin("/admin-login?role=MANAGER")}
              >
                <div className="login-option-icon">📋</div>
                <h3>Manager</h3>
                <p>Constituency Manager</p>
              </div>
              
              <div 
                className="login-option-card officer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogin("/admin-login?role=FIELD_OFFICER");
                }}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === "Enter" && handleLogin("/admin-login?role=FIELD_OFFICER")}
              >
                <div className="login-option-icon">🚗</div>
                <h3>Field Officer</h3>
                <p>Login as field officer</p>
              </div>
              
              <div 
                className="login-option-card representative"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogin("/admin-login?role=REPRESENTATIVE");
                }}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === "Enter" && handleLogin("/admin-login?role=REPRESENTATIVE")}
              >
                <div className="login-option-icon">🏛️</div>
                <h3>Representative</h3>
                <p>MLA/Representative Login</p>
              </div>
            </div>
            <button 
              className="close-modal-btn"
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
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();
  const [showLoginOptions, setShowLoginOptions] = useState(false);

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
              <Link to="/citizen-login" className="login-option-card citizen">
                <div className="login-option-icon">👤</div>
                <h3>Citizen</h3>
                <p>Login as a citizen</p>
              </Link>
              
              <Link to="/admin-signup" className="login-option-card admin">
                <div className="login-option-icon">👨‍💼</div>
                <h3>Admin</h3>
                <p>Create new account</p>
              </Link>
              
              <Link to="/admin-login?role=MANAGER" className="login-option-card manager">
                <div className="login-option-icon">📋</div>
                <h3>Manager</h3>
                <p>Constituency Manager</p>
              </Link>
              
              <Link to="/admin-login?role=FIELD_OFFICER" className="login-option-card officer">
                <div className="login-option-icon">🚗</div>
                <h3>Field Officer</h3>
                <p>Login as field officer</p>
              </Link>
              
              <Link to="/admin-login?role=REPRESENTATIVE" className="login-option-card representative">
                <div className="login-option-icon">🏛️</div>
                <h3>Representative</h3>
                <p>MLA/Representative Login</p>
              </Link>
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
import React from "react";
import { Link } from "react-router-dom";
import "../styles/LandingPage.css";

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Citizen Relation Management</h1>
          <p className="hero-subtitle">
            Welcome to the Citizen Relation Management System. Efficiently manage citizen records and more with our intuitive platform.
          </p>
          <div className="hero-buttons">
            <Link to="/login" className="btn btn-primary">Admin Log In</Link>
            <Link to="/citizen-login" className="btn btn-secondary">Citizen Log In</Link>
            <Link to="/signup" className="btn btn-tertiary">Sign Up</Link>
          </div>
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
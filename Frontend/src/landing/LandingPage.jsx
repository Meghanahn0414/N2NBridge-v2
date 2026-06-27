import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-header">
        <button
          className="sign-in-btn"
          onClick={() => navigate("/login")}
        >
          Sign In
        </button>
      </div>

      {/* Hero Section */}
      <section className="hero">
         <div className="hero-content">
          <pre><b><h1 className="hero-title">Neta to Nagiraka</h1></b></pre>
          <pre className="hero-subtitle">
Welcome to the Neta to Nagiraka Platform. Efficiently manage citizen records and more with our intuitive platform.
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
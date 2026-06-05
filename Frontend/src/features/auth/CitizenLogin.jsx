import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtp } from "./authService";
import "./auth.css";

export default function CitizenLogin() {
  const [value, setValue] = useState("");
  const [type, setType] = useState("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (!value.trim()) {
      setError("Please enter a phone number or email");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await sendOtp({ type, value });
      sessionStorage.setItem("authValue", JSON.stringify({ type, value }));
      navigate("/otp");
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Citizen Login</h1>
          <p className="auth-subtitle">Enter OTP to Access</p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '10px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Login Method
          </label>
          <div style={{ display: 'flex', gap: '20px', padding: '12px', backgroundColor: 'rgba(248, 250, 252, 0.8)', borderRadius: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#334155', fontWeight: '500' }}>
              <input
                type="radio"
                name="loginType"
                value="phone"
                checked={type === "phone"}
                onChange={(e) => setType(e.target.value)}
                style={{ cursor: 'pointer', accentColor: '#22d3ee' }}
              />
              Phone
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#334155', fontWeight: '500' }}>
              <input
                type="radio"
                name="loginType"
                value="email"
                checked={type === "email"}
                onChange={(e) => setType(e.target.value)}
                style={{ cursor: 'pointer', accentColor: '#22d3ee' }}
              />
              Email
            </label>
          </div>
        </div>

        <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }}>
          <div className="form-group">
            <label className="form-label">
              {type === "phone" ? "Phone Number" : "Email Address"} <span className="required">*</span>
            </label>
            <input
              type={type === "phone" ? "tel" : "email"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === "phone" ? "+91 98765 43210" : "you@example.com"}
              className="form-input"
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="auth-button"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>

        <div className="auth-divider"></div>

        <div className="auth-footer">
          <p>Admin?
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="auth-link"
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAuthRole, setAuthToken, setAuthUser } from "../../services/authStorage";
import { verifyOtp } from "./authService";
import "./auth.css";

const roleRedirect = {
  CITIZEN: "/citizen",
  FIELD_OFFICER: "/field",
  CONSTITUENCY_MANAGER: "/manager",
  REPRESENTATIVE: "/rep",
  ADMIN: "/admin",
};

export default function OtpVerify() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [authState, setAuthState] = useState({ type: "phone", value: "" });

  useEffect(() => {
    const stored = sessionStorage.getItem("authValue");
    if (!stored) {
      navigate("/citizen-login", { replace: true });
      return;
    }

    setAuthState(JSON.parse(stored));
  }, [navigate]);

  const handleVerify = async () => {
    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await verifyOtp({ value: authState.value, otp });
      setAuthToken(res.token);
      setAuthRole(res.role);
      if (res.user) {
        setAuthUser(res.user);
        window.dispatchEvent(new Event('auth-user-updated'));
      }
      sessionStorage.removeItem("authValue");

      // Check if profile is created (has fullName)
      if (res.role === "CITIZEN" && (!res.user || !res.user.fullName)) {
        navigate("/profile-creation", { replace: true });
        return;
      }

      const destination = roleRedirect[res.role] || "/";
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Verify OTP</h1>
          <p className="auth-subtitle">Enter the code sent to {authState.value}</p>
        </div>

        <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleVerify(); }}>
          <div className="form-group">
            <label className="form-label">
              OTP <span className="required">*</span>
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              className="form-input"
              maxLength="6"
              style={{ fontSize: '18px', letterSpacing: '8px', textAlign: 'center' }}
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
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <button
              type="button"
              onClick={() => navigate("/citizen-login")}
              className="auth-link"
            >
              Back to Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

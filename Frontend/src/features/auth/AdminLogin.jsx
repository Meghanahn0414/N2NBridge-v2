import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginAdmin } from "./authService";
import { setAuthToken, setAuthRole } from "../../services/authStorage";
import "./auth.css";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectByRole = {
    ADMIN: "/admin",
    REPRESENTATIVE: "/rep",
    CONSTITUENCY_MANAGER: "/manager",
    MANAGER: "/manager",
    FIELD_OFFICER: "/field",
  };

  // Get role from URL query parameter
  const roleFromUrl = searchParams.get("role");
  
  // Roles that cannot access signup
  const restrictedSignupRoles = ["REPRESENTATIVE", "MANAGER", "CONSTITUENCY_MANAGER", "FIELD_OFFICER"];
  const showSignupLink = !restrictedSignupRoles.includes(roleFromUrl);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await loginAdmin({ email, password });

      // Store token and user info (backend returns `accessToken`)
      setAuthToken(response.accessToken);
      const userRole = response.user?.role || "ADMIN";
      setAuthRole(userRole);
      localStorage.setItem("user", JSON.stringify(response.user));

      // Redirect based on user role
      const redirectPath = redirectByRole[userRole] || "/admin";
      navigate(redirectPath);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Login to Your Account</h1>
          <p className="auth-subtitle">Staff & Admin Access</p>
        </div>

        <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <div className="form-group">
            <label className="form-label">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your email"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Password <span className="required">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter password"
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
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {showSignupLink && (
          <div className="auth-footer">
            <p>Don't have an account?
              <button
                type="button"
                onClick={() => navigate("/admin-signup")}
                className="auth-link"
              >
                Sign up here
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

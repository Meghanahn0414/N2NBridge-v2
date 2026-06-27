import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "./authService";
import { setAuthToken, setAuthRole, setAuthUser } from "../../services/authStorage";

const REDIRECT = {
  ADMIN: "/admin",
  REPRESENTATIVE: "/rep",
  CONSTITUENCY_MANAGER: "/manager",
  MANAGER: "/manager",
  FIELD_OFFICER: "/field",
  CITIZEN: "/citizen/",
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await loginAdmin({ email, password });
      setAuthToken(response.accessToken);
      const userRole = response.user?.role || "ADMIN";
      setAuthRole(userRole);
      setAuthUser(response.user);
      navigate(REDIRECT[userRole] || "/admin");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9ff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: 20, padding: "40px 36px", boxShadow: "0 4px 32px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 20 }}>🛡️</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Admin Login</span>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>Sign in</h2>
        <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 28px" }}>Enter your credentials to access the admin panel.</p>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "0 14px", background: "#f8faff" }}>
              <span style={{ fontSize: 15, color: "#94a3b8" }}>✉️</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gov.in"
                style={{ flex: 1, padding: "12px 0", fontSize: 14, color: "#0f172a", border: "none", outline: "none", background: "transparent" }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Password</label>
              <a href="#" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>Forgot password?</a>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "0 14px", background: "#f8faff" }}>
              <span style={{ fontSize: 15, color: "#94a3b8" }}>🔒</span>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ flex: 1, padding: "12px 0", fontSize: 14, color: "#0f172a", border: "none", outline: "none", background: "transparent" }}
              />
              <button type="button" onClick={() => setShowPass((s) => !s)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#94a3b8", padding: 0 }}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#dc2626" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ padding: "14px", borderRadius: 12, border: "none", background: "#2563eb", color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "opacity 0.15s" }}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginAdmin } from "./authService";
import { setAuthToken, setAuthRole, setAuthUser } from "../../services/authStorage";
import { changeLanguage, getCurrentLanguage } from "../../i18n/index";
import "./auth.css";

const LANGUAGES = [
  { code: "en", label: "English",  native: "English"  },
  { code: "kn", label: "Kannada",  native: "ಕನ್ನಡ"    },
  { code: "hi", label: "Hindi",    native: "हिंदी"     },
  { code: "te", label: "Telugu",   native: "తెలుగు"   },
];

function LanguageDropdown() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(getCurrentLanguage());
  const [translating, setTranslating] = useState(false);
  const ref = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = async (code) => {
    setOpen(false);
    if (code === current) return;
    setTranslating(true);
    await changeLanguage(code);
    setCurrent(code);
    setTranslating(false);
  };

  const selected = LANGUAGES.find((l) => l.code === current) || LANGUAGES[0];

  return (
    <div className="lang-dropdown" ref={ref} data-notranslate>
      <button
        type="button"
        className="lang-dropdown-trigger"
        onClick={() => setOpen((o) => !o)}
        disabled={translating}
      >
        <span className="lang-globe">🌐</span>
        <span className="lang-current">{translating ? "…" : selected.native}</span>
        <span className="lang-chevron">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <ul className="lang-dropdown-menu">
          {LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                className={`lang-option ${lang.code === current ? "lang-option-active" : ""}`}
                onClick={() => handleSelect(lang.code)}
              >
                <span className="lang-option-native">{lang.native}</span>
                <span className="lang-option-label">{lang.label}</span>
                {lang.code === current && <span className="lang-check">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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

  const roleFromUrl = searchParams.get("role");
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
      setAuthToken(response.accessToken);
      const userRole = response.user?.role || "ADMIN";
      setAuthRole(userRole);
      setAuthUser(response.user);
      navigate(redirectByRole[userRole] || "/admin");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* Language Dropdown — top right */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
          <LanguageDropdown />
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Login to Your Account</h1>
          <p className="auth-subtitle">Staff & Admin Access</p>
        </div>

        <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <div className="form-group">
            <label className="form-label">Email <span className="required">*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Email"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password <span className="required">*</span></label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Password"
              className="form-input"
            />
          </div>

          {error && <div className="error-message" data-notranslate>{error}</div>}

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {showSignupLink && (
          <div className="auth-footer">
            <p>
              Don't have an account?{" "}
              <button type="button" onClick={() => navigate("/admin-signup")} className="auth-link">
                Sign up here
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

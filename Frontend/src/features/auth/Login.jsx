import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtp } from "./authService";
import { changeLanguage, getCurrentLanguage } from "../../i18n/index";
import "./auth.css";

const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "hi", label: "Hindi",   native: "हिंदी"  },
  { code: "te", label: "Telugu",  native: "తెలుగు" },
];

export default function Login() {
  const [value, setValue]     = useState("");
  const [type, setType]       = useState("phone");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [lang, setLang]       = useState(getCurrentLanguage());
  const navigate = useNavigate();

  const handleLangChange = async (e) => {
    const code = e.target.value;
    setLang(code);
    await changeLanguage(code);
  };

  const handleSendOtp = async () => {
    if (!value.trim()) {
      setError(type === "phone" ? "Please enter your phone number" : "Please enter your email address");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await sendOtp({ type, value });
      sessionStorage.setItem("authValue", JSON.stringify({ type, value }));
      navigate("/otp");
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column" }}>

      {/* Language picker — top right */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 999, padding: "6px 14px", fontSize: 14 }}>
          <span style={{ fontSize: 18 }}>🌐</span>
          <select
            value={lang}
            onChange={handleLangChange}
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, color: "#334155", cursor: "pointer" }}
          >
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.native}</option>)}
          </select>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>▼</span>
        </div>
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px 40px" }}>
        <div style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: 24, border: "1px solid #e2e8f0", padding: "40px 40px 32px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>

          {/* Header */}
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 32px" }}>Sign in to pick up where you left off.</p>

          {/* Phone / Email tabs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
            {[
              { id: "phone", icon: "📱", label: "Phone" },
              { id: "email", icon: "✉️", label: "Email" },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setType(tab.id); setValue(""); setError(""); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "13px 16px", borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: "pointer",
                  border: type === tab.id ? "2px solid #3b5bdb" : "1.5px solid #e2e8f0",
                  background: type === tab.id ? "#eef2ff" : "#fff",
                  color: type === tab.id ? "#3b5bdb" : "#94a3b8",
                  transition: "all .15s",
                }}
              >
                <span style={{ fontSize: 18 }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>
            {type === "phone" ? "Phone Number" : "Email Address"}
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "0 16px", marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>{type === "phone" ? "📱" : "✉️"}</span>
            <input
              type={type === "phone" ? "tel" : "email"}
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSendOtp()}
              placeholder={type === "phone" ? "+91 98765 43210" : "you@example.com"}
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 15, color: "#0f172a", padding: "14px 0" }}
            />
          </div>

          {error && <p style={{ fontSize: 13, color: "#dc2626", margin: "0 0 12px" }}>{error}</p>}

          {/* Send OTP button */}
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={loading}
            style={{
              width: "100%", padding: "15px", borderRadius: 14, border: "none",
              background: loading ? "#94a3b8" : "#3b5bdb", color: "#fff",
              fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              marginTop: 8, transition: "background .15s",
            }}
          >
            {loading ? "Sending OTP…" : "Send OTP"}
          </button>

          {/* Footer */}
          <p style={{ textAlign: "center", fontSize: 14, color: "#64748b", marginTop: 28, marginBottom: 0 }}>
            New to Jana Seva?{" "}
            <button
              type="button"
              onClick={() => navigate("/profile-creation")}
              style={{ background: "none", border: "none", color: "#3b5bdb", fontWeight: 700, fontSize: 14, cursor: "pointer", padding: 0 }}
            >
              Create account
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}

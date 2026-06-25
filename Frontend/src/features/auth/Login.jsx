import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtp } from "./authService";

export default function CitizenLogin() {
  const [tab, setTab] = useState("phone"); // "phone" | "email"
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (!value.trim()) {
      setError(tab === "phone" ? "Please enter your phone number" : "Please enter your email");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await sendOtp({ type: tab, value });
      sessionStorage.setItem("authValue", JSON.stringify({ type: tab, value }));
      navigate("/otp");
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconWrap}>🏛️</div>
          <h1 style={styles.title}>Welcome back</h1>
          <p style={styles.subtitle}>Sign in to Jana Seva</p>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(tab === "phone" ? styles.tabActive : {}) }}
            onClick={() => { setTab("phone"); setValue(""); setError(""); }}
          >
            📱 Phone
          </button>
          <button
            style={{ ...styles.tab, ...(tab === "email" ? styles.tabActive : {}) }}
            onClick={() => { setTab("email"); setValue(""); setError(""); }}
          >
            ✉️ Email
          </button>
        </div>

        {/* Input */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>
            {tab === "phone" ? "Phone Number" : "Email Address"}
          </label>
          <input
            type={tab === "phone" ? "tel" : "email"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
            placeholder={tab === "phone" ? "+91 98765 43210" : "you@example.com"}
            style={styles.input}
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {/* Send OTP Button */}
        <button
          onClick={handleSendOtp}
          disabled={loading}
          style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
        >
          {loading ? "Sending OTP..." : "Send OTP →"}
        </button>

        {/* Footer */}
        <p style={styles.footer}>
          New to Jana Seva?{" "}
          <button style={styles.link} onClick={() => navigate("/otp")}>
            Get started
          </button>
        </p>

        <div style={styles.divider} />

        <p style={styles.staffLink}>
          Staff or Admin?{" "}
          <button style={styles.link} onClick={() => navigate("/admin-login")}>
            Staff login
          </button>
        </p>
      </div>
    </div>
  );
}

const C = {
  primary: "#2B5BD7",
  dark: "#1B3C8F",
  bg: "#F3F5FA",
  ink: "#16233C",
  muted: "#5A6678",
  border: "#EDF0F6",
  error: "#DC2626",
};

const styles = {
  page: {
    minHeight: "100vh",
    background: C.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: 24,
    border: `1px solid ${C.border}`,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 4px 24px rgba(43,91,215,0.08)",
  },
  header: {
    textAlign: "center",
    marginBottom: 28,
  },
  iconWrap: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: C.ink,
    margin: "0 0 6px",
  },
  subtitle: {
    fontSize: 15,
    color: C.muted,
    margin: 0,
  },
  tabs: {
    display: "flex",
    background: C.bg,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  tab: {
    flex: 1,
    padding: "10px 0",
    border: "none",
    borderRadius: 10,
    background: "transparent",
    color: C.muted,
    fontWeight: 500,
    fontSize: 14,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tabActive: {
    background: "#fff",
    color: C.primary,
    fontWeight: 600,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: C.ink,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    border: `1.5px solid ${C.border}`,
    borderRadius: 12,
    fontSize: 15,
    color: C.ink,
    background: C.bg,
    outline: "none",
    boxSizing: "border-box",
    transition: "border 0.2s",
  },
  error: {
    color: C.error,
    fontSize: 13,
    margin: "6px 0 12px",
  },
  btn: {
    width: "100%",
    padding: "15px",
    background: C.primary,
    color: "#fff",
    border: "none",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 16,
    marginBottom: 20,
    transition: "background 0.2s",
  },
  btnDisabled: {
    background: "#A0AEC0",
    cursor: "not-allowed",
  },
  footer: {
    textAlign: "center",
    fontSize: 14,
    color: C.muted,
    margin: "0 0 16px",
  },
  divider: {
    borderTop: `1px solid ${C.border}`,
    margin: "0 0 16px",
  },
  staffLink: {
    textAlign: "center",
    fontSize: 13,
    color: C.muted,
    margin: 0,
  },
  link: {
    background: "none",
    border: "none",
    color: C.primary,
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
    fontSize: "inherit",
    textDecoration: "underline",
    textUnderlineOffset: 2,
  },
};

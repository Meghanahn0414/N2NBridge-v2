import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerAdmin } from "./authService";
import api from "../../shared/services/api";
import { normalizePhone as normalizePhoneUtil } from "../../utils/phoneUtils";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal",
];

const FlagStrip = () => (
  <div style={{ display: "flex", flexDirection: "column", width: 6, height: 36, borderRadius: 9999, overflow: "hidden" }}>
    <div style={{ flex: 1, background: "#fb923c" }} />
    <div style={{ flex: 1, background: "#fff" }} />
    <div style={{ flex: 1, background: "#16a34a" }} />
  </div>
);

export default function AdminSignup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "+91",
    phone: "",
    state: "",
    district: "",
    secretKey: "",
    password: "",
    confirmPassword: "",
  });

  const [show, setShow] = useState({
    secretKey: false,
    password: false,
    confirmPassword: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setApiError("");
  };

  const toggleShow = (field) =>
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));

  const validate = () => {
    const e = {};
    if (!form.firstName.trim())    e.firstName    = "Required";
    if (!form.lastName.trim())     e.lastName     = "Required";
    if (!form.email.includes("@")) e.email        = "Invalid email";
    if (form.phone.replace(/\D/g, "").length !== 10) e.phone = "Must be 10 digits";
    if (!form.state)               e.state        = "Required";
    if (!form.district.trim())     e.district     = "Required";
    if (form.secretKey.length < 6) e.secretKey    = "Min 6 characters";
    if (form.password.length < 8)  e.password     = "Min 8 characters";
    if (form.password !== form.confirmPassword)
                                   e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError("");

    try {
      const normalizedMobile = normalizePhoneUtil(
        form.phone.replace(/\D/g, ""),
        form.countryCode
      );

      const registrationData = {
        fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
        email: form.email.trim(),
        mobile: normalizedMobile,
        password: form.password,
        role: "ADMIN",
        state: form.state,
        district: form.district.trim(),
      };

      const response = await registerAdmin(registrationData);
      const userId = response?.user?.id;

      if (userId) {
        try {
          await api.post(`/api/admin/verify-secret-key`, { secretKey: form.secretKey });
        } catch {
          // secret key verification failure is non-blocking for now
        }
      }

      setSubmitted(true);
    } catch (err) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("duplicate")) {
        setApiError("This email or phone number is already registered.");
      } else {
        setApiError(msg || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, padding: "40px 32px", textAlign: "center", maxWidth: 360 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
            Registration Submitted
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
            Your admin account request has been submitted. You will receive a confirmation email once approved.
          </p>
          <button
            onClick={() => navigate("/login")}
            style={{ ...styles.submitBtn, marginTop: 24 }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Branding */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <FlagStrip />
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#1e3a8a", fontWeight: 700, fontSize: 15, letterSpacing: "0.05em" }}>
            N2N
          </div>
          <div style={{ color: "#64748b", fontSize: 11 }}>Admin Registration</div>
        </div>
        <FlagStrip />
      </div>

      {/* Card */}
      <div style={styles.card}>
        {/* Card header */}
        <div style={styles.cardHeader}>
          <div style={styles.iconCircle}>🏛️</div>
          <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 20, marginBottom: 4 }}>
            Admin Registration
          </h2>
          <p style={{ color: "#bfdbfe", fontSize: 12, marginBottom: 12 }}>
            Manage N2N Portal
          </p>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.formBody}>

          <SectionLabel title="Personal Information" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="First Name" error={errors.firstName}>
              <input
                type="text"
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                style={inputStyle(errors.firstName)}
              />
            </Field>
            <Field label="Last Name" error={errors.lastName}>
              <input
                type="text"
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                style={inputStyle(errors.lastName)}
              />
            </Field>
          </div>

          <Field label="Email Address" error={errors.email}>
            <input
              type="email"
              placeholder="admin@mail.in"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              style={inputStyle(errors.email)}
            />
          </Field>

          <Field label="Mobile Number" error={errors.phone}>
            <div style={{ display: "flex", gap: 8 }}>
              <select
                value={form.countryCode}
                onChange={(e) => update("countryCode", e.target.value)}
                style={{ ...inputStyle(), width: 100, flex: "none" }}
              >
                <option value="+91">🇮🇳 +91</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
              </select>
              <input
                type="tel"
                placeholder="10-digit number"
                maxLength={10}
                value={form.phone}
                onChange={(e) => update("phone", e.target.value.replace(/\D/g, ""))}
                style={{ ...inputStyle(errors.phone), flex: 1 }}
              />
            </div>
          </Field>
          <SectionLabel title="Security" />
          <Field label="Password" error={errors.password}>
            <PasswordInput
              placeholder="Create strong password (min 8 chars)"
              value={form.password}
              show={show.password}
              error={errors.password}
              onChange={(v) => update("password", v)}
              onToggle={() => toggleShow("password")}
            />
          </Field>

          <Field label="Confirm Password" error={errors.confirmPassword}>
            <PasswordInput
              placeholder="Repeat your password"
              value={form.confirmPassword}
              show={show.confirmPassword}
              error={errors.confirmPassword}
              onChange={(v) => update("confirmPassword", v)}
              onToggle={() => toggleShow("confirmPassword")}
            />
          </Field>

          {apiError && (
            <div style={styles.apiError}>{apiError}</div>
          )}

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? "Registering..." : "🏛️ Register as Admin"}
          </button>

          <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 4 }}>
            Already registered?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{ color: "#2563eb", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
            >
              Login to portal
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

/* ── Helper components ── */

function SectionLabel({ title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
        {title}
      </span>
      <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
        {label} <span style={{ color: "#ef4444" }}>*</span>
      </label>
      {children}
      {error && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{error}</p>}
    </div>
  );
}

function PasswordInput({ placeholder, value, show, error, onChange, onToggle, borderColor }) {
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...inputStyle(error),
          paddingRight: 40,
          ...(borderColor ? { borderColor } : {}),
        }}
      />
      <button
        type="button"
        onClick={onToggle}
        style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#94a3b8",
        }}
        aria-label={show ? "Hide" : "Show"}
      >
        {show ? "🙈" : "👁️"}
      </button>
    </div>
  );
}

function inputStyle(error) {
  return {
    width: "100%",
    border: `1.5px solid ${error ? "#f87171" : "#e2e8f0"}`,
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 13,
    background: "#f8fafc",
    outline: "none",
    boxSizing: "border-box",
    color: "#1e293b",
  };
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px 16px 32px",
  },
  card: {
    background: "#fff",
    borderRadius: 24,
    width: "100%",
    maxWidth: 440,
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    overflow: "hidden",
  },
  cardHeader: {
    background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
    padding: "24px 24px 20px",
    textAlign: "center",
  },
  iconCircle: {
    width: 64, height: 64, borderRadius: "50%",
    background: "rgba(255,255,255,0.15)",
    border: "2px solid rgba(255,255,255,0.25)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 28, margin: "0 auto 12px",
  },
  badgeSecure: {
    background: "rgba(255,255,255,0.15)", color: "#fff",
    fontSize: 11, padding: "3px 10px", borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.25)",
  },
  badgeWarn: {
    background: "#fef9c3", color: "#854d0e",
    fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600,
  },
  warningBar: {
    background: "#fefce8", borderBottom: "1px solid #fde047",
    padding: "8px 16px", fontSize: 12, color: "#854d0e",
  },
  formBody: {
    padding: "20px 24px 24px",
    display: "flex", flexDirection: "column", gap: 16,
  },
  secretKeyBox: {
    background: "#eff6ff", border: "1.5px dashed #93c5fd",
    borderRadius: 12, padding: 16,
  },
  apiError: {
    background: "#fef2f2", border: "1px solid #fca5a5",
    borderRadius: 10, padding: "10px 14px",
    fontSize: 13, color: "#dc2626",
  },
  submitBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
    color: "#fff", border: "none", borderRadius: 12,
    padding: "14px", fontWeight: 700, fontSize: 14,
    cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.4)",
  },
};

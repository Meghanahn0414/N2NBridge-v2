import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginAdmin } from "./authService";
import { setAuthToken, setAuthRole, setAuthUser } from "../../services/authStorage";
import { changeLanguage, getCurrentLanguage } from "../../i18n/index";

/* ─── Role definitions ─────────────────────────────────────── */
const ROLES = [
  {
    key: "CITIZEN",
    name: "Citizen",
    icon: "👤",
    color: "#2563EB",
    kicker: "For residents",
    headline: "One bridge.\nEvery voice.",
    blurb: "Report a problem, follow it from new to resolved, and reach the people who represent you — all in one place.",
    points: ["Report an issue in under a minute", "Track every case from new to resolved", "Message your representatives directly"],
    idLabel: "Email or phone",
    idPlaceholder: "you@example.com",
    cta: "Sign in as Citizen",
    note: "",
  },
  {
    key: "ADMIN",
    name: "Admin",
    icon: "🛡️",
    color: "#DC2626",
    kicker: "For platform admins",
    headline: "Run the\nplatform.",
    blurb: "Manage wards, roles, and routing rules, and keep every surface of the platform running smoothly.",
    points: ["Manage users, roles & wards", "Configure case routing rules", "Audit activity across the platform"],
    idLabel: "Admin email",
    idPlaceholder: "admin@gov.in",
    cta: "Sign in as Admin",
    note: "Admin sign-in requires two-factor authentication. Have your device ready.",
  },
  {
    key: "CONSTITUENCY_MANAGER",
    name: "Manager",
    icon: "📋",
    color: "#7C3AED",
    kicker: "For constituency managers",
    headline: "Manage your\nconstituency.",
    blurb: "Oversee field officers, track ward performance, and manage escalations across your constituency.",
    points: ["Oversee field officers & tasks", "Track ward-level performance", "Manage and escalate grievances"],
    idLabel: "Manager email",
    idPlaceholder: "manager@gov.in",
    cta: "Sign in as Manager",
    note: "",
  },
  {
    key: "FIELD_OFFICER",
    name: "Field Officer",
    icon: "📍",
    color: "#059669",
    kicker: "For field staff",
    headline: "Cases,\non the ground.",
    blurb: "Pick up assigned work, update status from the site, and log proof of resolution while you're out in the ward.",
    points: ["See cases assigned to you nearby", "Update status from the field", "Attach photos as proof of work"],
    idLabel: "Officer email",
    idPlaceholder: "officer@gov.in",
    cta: "Sign in as Field Officer",
    note: "",
  },
  {
    key: "REPRESENTATIVE",
    name: "Representative",
    icon: "🏛️",
    color: "#D97706",
    kicker: "For elected officials",
    headline: "Casework,\nunder control.",
    blurb: "See what your constituents need, track your team's progress, and close the loop with everyone who reached out.",
    points: ["Review your ward's priority queue", "Assign and reassign cases to staff", "Reply to constituents in one thread"],
    idLabel: "Official email",
    idPlaceholder: "name@council.gov.in",
    cta: "Sign in as Representative",
    note: "",
  },
];

const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "hi", label: "Hindi", native: "हिंदी" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
];

const REDIRECT = {
  CITIZEN: "/citizen/",
  ADMIN: "/admin",
  REPRESENTATIVE: "/rep",
  CONSTITUENCY_MANAGER: "/manager",
  MANAGER: "/manager",
  FIELD_OFFICER: "/field",
};

/* ─── Language dropdown ────────────────────────────────────── */
function LanguageDropdown() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(getCurrentLanguage());
  const [translating, setTranslating] = useState(false);
  const ref = useRef(null);

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
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={translating}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 14px", borderRadius: 999,
          border: "1.5px solid rgba(255,255,255,0.3)",
          background: "rgba(255,255,255,0.1)", color: "#fff",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          backdropFilter: "blur(4px)",
        }}
      >
        <span>🌐</span>
        <span>{translating ? "…" : selected.native}</span>
        <span style={{ fontSize: 9, opacity: 0.7 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <ul style={{
          position: "absolute", top: 42, right: 0, margin: 0, padding: 0,
          listStyle: "none", background: "#fff", borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)", minWidth: 160,
          zIndex: 100, overflow: "hidden", border: "1px solid #e5e7eb",
        }}>
          {LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                onClick={() => handleSelect(lang.code)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "11px 16px", background: lang.code === current ? "#f0f4ff" : "transparent",
                  border: "none", cursor: "pointer", fontSize: 14,
                  color: lang.code === current ? "#1D4ED8" : "#374151",
                  fontWeight: lang.code === current ? 700 : 500,
                }}
              >
                <span>{lang.native}</span>
                {lang.code === current && <span style={{ color: "#1D4ED8" }}>✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────── */
export default function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Pre-select role from URL param if present
  const urlRole = searchParams.get("role");
  const initialIdx = urlRole ? Math.max(0, ROLES.findIndex((r) => r.key === urlRole)) : 0;

  const [selIdx, setSelIdx] = useState(initialIdx);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const role = ROLES[selIdx];

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (role.key === "CITIZEN") {
      const done = localStorage.getItem("onboarding_done");
      window.location.href = done ? "/citizen/" : "/citizen/onboarding";
      return;
    }
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
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ── LEFT panel ── */}
      <div style={{
        flex: "0 0 42%", position: "relative", display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: "44px 52px",
        background: "linear-gradient(155deg, #1e3a8a 0%, #1e40af 45%, #1e3a8a 100%)",
        color: "#fff", overflow: "hidden",
      }}>
        {/* decorative blobs */}
        <div style={{ position: "absolute", right: -100, top: -80, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.3), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: -80, bottom: -100, width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle, ${role.color}28, transparent 70%)`, pointerEvents: "none", transition: "background 0.4s" }} />

        {/* top: logo + lang */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 800, color: "#fff",
            }}>N</div>
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#fff" }}>N2Bridge</span>
          </div>
          <LanguageDropdown />
        </div>

        {/* middle: headline + bullets */}
        <div style={{ position: "relative", maxWidth: 400 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            color: role.color === "#D97706" ? "#fcd34d" : "#93c5fd", marginBottom: 16,
            transition: "color 0.3s",
          }}>
            {role.kicker}
          </div>
          <h1 style={{
            fontSize: 40, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em",
            margin: "0 0 16px", color: "#fff", whiteSpace: "pre-line",
          }}>
            {role.headline}
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: "rgba(255,255,255,0.75)", margin: "0 0 28px" }}>
            {role.blurb}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {role.points.map((pt, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{
                  flex: "none", width: 22, height: 22, borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, marginTop: 1,
                }}>✓</span>
                <span style={{ fontSize: 14, lineHeight: 1.5, color: "rgba(255,255,255,0.88)" }}>{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* bottom: security note */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
          <span>🔒</span>
          <span>Secure government access · Your data stays protected</span>
        </div>
      </div>

      {/* ── RIGHT panel ── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 40px", background: "#f8f9ff",
      }}>
        <div style={{ width: "100%", maxWidth: 500 }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.015em", margin: "0 0 6px", color: "#0f172a" }}>
            Sign in to N2Bridge
          </h2>
          <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px" }}>
            Choose your role, then enter your details.
          </p>

          {/* role selector */}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 10 }}>
            I am a…
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 28 }}>
            {ROLES.map((r, i) => {
              const on = i === selIdx;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => { setSelIdx(i); setError(""); }}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    padding: "12px 4px 10px", cursor: "pointer",
                    background: "#fff",
                    border: on ? `2px solid ${r.color}` : "1.5px solid #e2e8f0",
                    borderRadius: 12,
                    boxShadow: on ? "0 4px 14px rgba(0,0,0,0.1)" : "0 1px 3px rgba(0,0,0,0.04)",
                    transition: "all 0.15s ease",
                    outline: "none",
                  }}
                >
                  <span style={{
                    width: 36, height: 36, borderRadius: 10, marginBottom: 7,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18,
                    background: on ? `${r.color}18` : "#f1f5f9",
                    transition: "background 0.15s",
                  }}>
                    {r.icon}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, textAlign: "center", lineHeight: 1.2,
                    color: on ? r.color : "#64748b",
                    transition: "color 0.15s",
                  }}>
                    {r.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Citizen: no email/password needed */}
            {role.key === "CITIZEN" ? (
              <div style={{
                padding: "14px 16px", background: "#eff6ff",
                border: "1px solid #bfdbfe", borderRadius: 10,
                fontSize: 13, color: "#1d4ed8", lineHeight: 1.5,
              }}>
                Citizens sign in via the <strong>mobile app</strong> using OTP. Clicking below will open the citizen portal.
              </div>
            ) : (
              <>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                    {role.idLabel}
                  </label>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    border: "1.5px solid #e2e8f0", borderRadius: 10,
                    padding: "0 14px", background: "#fff",
                  }}>
                    <span style={{ fontSize: 15, color: "#94a3b8" }}>✉️</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={role.idPlaceholder}
                      style={{
                        flex: 1, padding: "12px 0", fontSize: 14, color: "#0f172a",
                        border: "none", outline: "none", background: "transparent",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Password</label>
                    <a href="#" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>
                      Forgot password?
                    </a>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    border: "1.5px solid #e2e8f0", borderRadius: 10,
                    padding: "0 14px", background: "#fff",
                  }}>
                    <span style={{ fontSize: 15, color: "#94a3b8" }}>🔒</span>
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      style={{
                        flex: 1, padding: "12px 0", fontSize: 14, color: "#0f172a",
                        border: "none", outline: "none", background: "transparent",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((s) => !s)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#94a3b8", padding: 0 }}
                    >
                      {showPass ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {role.note && (
                  <div style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "11px 13px", background: "#eff6ff",
                    border: "1px solid #bfdbfe", borderRadius: 10,
                  }}>
                    <span style={{ fontSize: 14, color: "#2563eb", marginTop: 1 }}>ℹ️</span>
                    <span style={{ fontSize: 13, lineHeight: 1.45, color: "#1d4ed8" }}>{role.note}</span>
                  </div>
                )}

                {/* remember me */}
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <button
                    type="button"
                    onClick={() => setRemember((r) => !r)}
                    style={{
                      width: 20, height: 20, flex: "none", cursor: "pointer", padding: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: 5,
                      background: remember ? "#2563eb" : "#fff",
                      border: remember ? "1.5px solid #2563eb" : "1.5px solid #cbd5e1",
                      transition: "all 0.15s",
                    }}
                  >
                    {remember && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                  </button>
                  <span style={{ fontSize: 14, color: "#64748b" }}>Keep me signed in on this device</span>
                </div>
              </>
            )}

            {error && (
              <div style={{
                padding: "10px 14px", background: "#fef2f2",
                border: "1px solid #fecaca", borderRadius: 10,
                fontSize: 13, color: "#dc2626",
              }}>
                {error}
              </div>
            )}

            {/* primary CTA */}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "14px", borderRadius: 12, border: "none",
                background: role.color, color: "#fff",
                fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1, transition: "opacity 0.15s",
              }}
            >
              {loading ? "Signing in…" : role.cta}
            </button>

            {/* divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
              <span style={{ fontSize: 12, color: "#94a3b8" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            </div>

            {/* SSO */}
            <button
              type="button"
              style={{
                padding: "13px", borderRadius: 12,
                border: "1.5px solid #e2e8f0", background: "#fff",
                fontSize: 14, fontWeight: 600, color: "#374151",
                cursor: "pointer",
              }}
              onClick={() => {}}
            >
              {role.key === "CITIZEN" ? "Continue with a sign-in link" : "Continue with Government SSO"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 14, color: "#64748b", marginTop: 24 }}>
            {role.key === "CITIZEN" ? "New to N2Bridge? " : "Need access? "}
            {role.key === "CITIZEN" ? (
              <a href="/citizen/onboarding" style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none" }}>
                Create an account
              </a>
            ) : (
              <a href="#" style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none" }}>
                Contact your administrator
              </a>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

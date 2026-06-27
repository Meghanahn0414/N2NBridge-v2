import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginAdmin, sendOtp, verifyOtp } from "./authService";
import BridgeLogo from "./BridgeLogo";
import { setAuthToken, setAuthRole, setAuthUser } from "../../services/authStorage";
import { changeLanguage, getCurrentLanguage } from "../../i18n/index";

/* ─── Role definitions ─────────────────────────────────────── */
const ROLES = [
  // {
  //   key: "CITIZEN",
  //   name: "Citizen",
  //   icon: "👤",
  //   color: "#2563EB",
  //   kicker: "For residents",
  //   headline: "One bridge.Every voice.",
  //   blurb: "Report a problem, follow it from new to resolved, and reach the people who represent you — all in one place.",
  //   points: ["Report an issue in under a minute", "Track every case from new to resolved", "Message your representatives directly"],
  //   idLabel: "Email or phone",
  //   idPlaceholder: "you@example.com",
  //   cta: "Sign in",
  //   note: "",
  // },
  {
    key: "ADMIN",
    name: "Admin",
    icon: "🛡️",
    color: "#2563EB",
    kicker: "For platform admins",
    headline: "Run the platform.",
    blurb: "Manage wards, roles, and routing rules, and keep every surface of the platform running smoothly.",
    points: ["Manage users, roles & wards", "Configure case routing rules", "Audit activity across the platform"],
    idLabel: "Email",
    idPlaceholder: "Enter Email Address",
    cta: "Sign in",
    note: "Admin sign-in requires two-factor authentication. Have your device ready.",
  },
  {
    key: "CONSTITUENCY_MANAGER",
    name: "Manager",
    icon: "📋",
    color: "#2563EB",
    kicker: "For constituency managers",
    headline: "Manage your constituency.",
    blurb: "Oversee field officers, track ward performance, and manage escalations across your constituency.",
    points: ["Oversee field officers & tasks", "Track ward-level performance", "Manage and escalate grievances"],
    idLabel: "Email",
    idPlaceholder: "Enter Email Address",
    cta: "Sign in",
    note: "",
  },
  {
    key: "FIELD_OFFICER",
    name: "Field Officer",
    icon: "📍",
    color: "#2563EB",
    kicker: "For field staff",
    headline: "Cases,on the ground.",
    blurb: "Pick up assigned work, update status from the site, and log proof of resolution while you're out in the ward.",
    points: ["See cases assigned to you nearby", "Update status from the field", "Attach photos as proof of work"],
    idLabel: "Email",
    idPlaceholder: "Enter Email Address",
    cta: "Sign in",
    note: "",
  },
  {
    key: "REPRESENTATIVE",
    name: "Representative",
    icon: "🏛️",
    color: "#2563EB",
    kicker: "For elected officials",
    headline: "Casework,under control.",
    blurb: "See what your constituents need, track your team's progress, and close the loop with everyone who reached out.",
    points: ["Review your ward's priority queue", "Assign and reassign cases to staff", "Reply to constituents in one thread"],
    idLabel: "Email",
    idPlaceholder: "Enter Email Address",
    cta: "Sign in",
    note: "",
  },
];

const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "hi", label: "Hindi", native: "हिंदी" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
];

const ROLE_PATH = {
  ADMIN: "/admin-login",
  CONSTITUENCY_MANAGER: "/manager-login",
  FIELD_OFFICER: "/field-login",
  REPRESENTATIVE: "/rep-login",
  CITIZEN: "/citizen-login",
};

const PATH_ROLE = Object.fromEntries(Object.entries(ROLE_PATH).map(([k, v]) => [v, k]));

const REDIRECT = {
  CITIZEN: "/citizen/",
  ADMIN: "/admin",
  REPRESENTATIVE: "/rep",
  CONSTITUENCY_MANAGER: "/manager",
  MANAGER: "/manager",
  FIELD_OFFICER: "/field",
};

/* ─── Language dropdown ────────────────────────────────────── */
function LanguageDropdown({ current, onSelect, translating }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = LANGUAGES.find((l) => l.code === current) || LANGUAGES[0];

  return (
    <div ref={ref} style={{ position: "relative" }} data-notranslate>
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
                onClick={() => { setOpen(false); onSelect(lang.code); }}
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
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const pathRole = PATH_ROLE[location.pathname];
  const initialIdx = pathRole ? Math.max(0, ROLES.findIndex((r) => r.key === pathRole)) : 0;

  const [selIdx, setSelIdx] = useState(initialIdx);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState(getCurrentLanguage);
  const [translating, setTranslating] = useState(false);
  const [citizenMethod, setCitizenMethod] = useState("phone");
  const [citizenValue, setCitizenValue] = useState("");
  const [citizenOtpSent, setCitizenOtpSent] = useState(false);
  const [citizenOtp, setCitizenOtp] = useState("");
  const [citizenLoading, setCitizenLoading] = useState(false);
  const [citizenError, setCitizenError] = useState("");

  const handleLangSelect = async (code) => {
    if (code === lang) return;
    setLang(code);
    setTranslating(true);
    await changeLanguage(code);
    setTranslating(false);
  };

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
        background: "linear-gradient(160deg, #0f1629 0%, #1a2540 60%, #0f1629 100%)",
        color: "#fff", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -100, top: -80, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.3), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: -80, bottom: -100, width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle, ${role.color}28, transparent 70%)`, pointerEvents: "none", transition: "background 0.4s" }} />

        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <BridgeLogo size={42} />
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#fff" }}>N2N Bridge</span>
            </div>
            <LanguageDropdown current={lang} onSelect={handleLangSelect} translating={translating} />
          </div>

          <div style={{ position: "relative", maxWidth: 400 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#93c5fd", marginBottom: 16, transition: "color 0.3s" }}>
              {role.kicker}
            </div>
            <h1 style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 0 16px", color: "#fff", whiteSpace: "pre-line" }}>
              {role.headline}
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: "rgba(255,255,255,0.75)", margin: "0 0 28px" }}>
              {role.blurb}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {role.points.map((pt, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span style={{ flex: "none", width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 14, lineHeight: 1.5, color: "rgba(255,255,255,0.88)" }}>{pt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
          <span>🔒</span>
          <span>Your data stays protected</span>
        </div>
      </div>

      {/* ── RIGHT panel ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 40px", background: "#f8f9ff" }}>
        <div style={{ width: "100%", maxWidth: 500 }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.015em", margin: "0 0 6px", color: "#0f172a", textAlign: "center" }}>
            Sign in to N2N Bridge
          </h2>
          <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px", textAlign: "center" }}>
            Choose your role, then enter your details.
          </p>

          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 10 }}>
            I am a…
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 28 }}>
            {ROLES.map((r, i) => {
              const on = i === selIdx;
              return (
                <button key={r.key} type="button" onClick={() => { setSelIdx(i); setError(""); setEmail(""); setPassword(""); navigate(ROLE_PATH[r.key], { replace: true }); }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 4px 10px", cursor: "pointer", background: "#fff", border: on ? `2px solid ${r.color}` : "1.5px solid #e2e8f0", borderRadius: 12, boxShadow: on ? "0 4px 14px rgba(0,0,0,0.1)" : "0 1px 3px rgba(0,0,0,0.04)", transition: "all 0.15s ease", outline: "none" }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, marginBottom: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, background: on ? `${r.color}18` : "#f1f5f9", transition: "background 0.15s" }}>{r.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, textAlign: "center", lineHeight: 1.2, color: on ? r.color : "#64748b", transition: "color 0.15s" }}>{r.name}</span>
                </button>
              );
            })}
          </div>

          {role.key === "CITIZEN" ? (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                {["phone", "email"].map((m) => (
                  <button key={m} type="button" onClick={() => { setCitizenMethod(m); setCitizenValue(""); setCitizenOtpSent(false); setCitizenError(""); }}
                    style={{ padding: "12px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, border: citizenMethod === m ? "2px solid #2563eb" : "1.5px solid #e2e8f0", background: citizenMethod === m ? "#eff6ff" : "#fff", color: citizenMethod === m ? "#2563eb" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.15s" }}>
                    <span>{m === "phone" ? "📱" : "✉️"}</span>
                    {m === "phone" ? "Phone" : "Email"}
                  </button>
                ))}
              </div>

              {!citizenOtpSent ? (
                <>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                    {citizenMethod === "phone" ? "Phone Number" : "Email Address"}
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "0 14px", background: "#f8faff", marginBottom: 20 }}>
                    <span style={{ fontSize: 15, color: "#94a3b8" }}>{citizenMethod === "phone" ? "📱" : "✉️"}</span>
                    {citizenMethod === "phone" && <span style={{ fontSize: 14, color: "#64748b", borderRight: "1px solid #e2e8f0", paddingRight: 10, marginRight: 4 }}>+91</span>}
                    <input type={citizenMethod === "phone" ? "tel" : "email"} value={citizenValue} onChange={(e) => setCitizenValue(e.target.value)} placeholder={citizenMethod === "phone" ? "98765 43210" : "you@example.com"} style={{ flex: 1, padding: "13px 0", fontSize: 14, color: "#0f172a", border: "none", outline: "none", background: "transparent" }} />
                  </div>
                  {citizenError && <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#dc2626", marginBottom: 16 }}>{citizenError}</div>}
                  <button type="button" disabled={citizenLoading}
                    onClick={async () => {
                      const val = citizenMethod === "phone" ? `+91${citizenValue.replace(/\s/g, "")}` : citizenValue;
                      if (!val.trim()) { setCitizenError("Please enter your " + citizenMethod); return; }
                      setCitizenError(""); setCitizenLoading(true);
                      try {
                        await sendOtp({ type: citizenMethod, value: val });
                        sessionStorage.setItem("authValue", JSON.stringify({ type: citizenMethod, value: val }));
                        setCitizenOtpSent(true);
                      } catch (err) { setCitizenError(err.message || "Failed to send OTP"); }
                      finally { setCitizenLoading(false); }
                    }}
                    style={{ width: "100%", padding: "15px", borderRadius: 12, border: "none", background: "#2563eb", color: "#fff", fontSize: 15, fontWeight: 700, cursor: citizenLoading ? "not-allowed" : "pointer", opacity: citizenLoading ? 0.7 : 1, marginBottom: 20 }}>
                    {citizenLoading ? "Sending…" : "Send OTP"}
                  </button>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
                    OTP sent to <strong>{citizenValue}</strong>.{" "}
                    <button type="button" onClick={() => { setCitizenOtpSent(false); setCitizenOtp(""); setCitizenError(""); }} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: 600, fontSize: 13, padding: 0 }}>Change</button>
                  </p>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Enter OTP</label>
                  <input type="text" value={citizenOtp} onChange={(e) => setCitizenOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="• • • • • •" maxLength={6}
                    style={{ width: "100%", padding: "14px", borderRadius: 10, marginBottom: 20, border: "1.5px solid #e2e8f0", background: "#f8faff", fontSize: 22, fontWeight: 700, letterSpacing: 14, textAlign: "center", outline: "none", boxSizing: "border-box", color: "#0f172a" }} />
                  {citizenError && <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#dc2626", marginBottom: 16 }}>{citizenError}</div>}
                  <button type="button" disabled={citizenLoading}
                    onClick={async () => {
                      if (citizenOtp.length < 6) { setCitizenError("Enter the 6-digit OTP"); return; }
                      setCitizenError(""); setCitizenLoading(true);
                      try {
                        const stored = JSON.parse(sessionStorage.getItem("authValue") || "{}");
                        const res = await verifyOtp({ value: stored.value, otp: citizenOtp });
                        setAuthToken(res.token);
                        setAuthRole(res.role);
                        if (res.user) { setAuthUser(res.user); window.dispatchEvent(new Event("auth-user-updated")); }
                        sessionStorage.removeItem("authValue");
                        navigate((!res.user || !res.user.fullName) ? "/profile-creation" : "/citizen/");
                      } catch (err) { setCitizenError(err.message || "OTP verification failed"); }
                      finally { setCitizenLoading(false); }
                    }}
                    style={{ width: "100%", padding: "15px", borderRadius: 12, border: "none", background: "#2563eb", color: "#fff", fontSize: 15, fontWeight: 700, cursor: citizenLoading ? "not-allowed" : "pointer", opacity: citizenLoading ? 0.7 : 1, marginBottom: 20 }}>
                    {citizenLoading ? "Verifying…" : "Verify OTP"}
                  </button>
                </>
              )}

            </div>
          ) : (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }} autoComplete="off">
              {/* Hidden honeypot inputs — tricks browsers into autofilling these instead of the real fields */}
              <input type="text"     name="username_fake" style={{ display: "none" }} readOnly tabIndex={-1} aria-hidden="true" />
              <input type="password" name="password_fake" style={{ display: "none" }} readOnly tabIndex={-1} aria-hidden="true" />
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{role.idLabel}</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "0 14px", background: "#fff" }}>
                  <span style={{ fontSize: 15, color: "#94a3b8" }}>✉️</span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={role.idPlaceholder} autoComplete="off" name="email_field" style={{ flex: 1, padding: "12px 0", fontSize: 14, color: "#0f172a", border: "none", outline: "none", background: "transparent" }} />
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Password</label>
                  <a href="#" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>Forgot password?</a>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "0 14px", background: "#fff" }}>
                  <span style={{ fontSize: 15, color: "#94a3b8" }}>🔒</span>
                  <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="new-password" name="password_field" style={{ flex: 1, padding: "12px 0", fontSize: 14, color: "#0f172a", border: "none", outline: "none", background: "transparent" }} />
                  <button type="button" onClick={() => setShowPass((s) => !s)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#94a3b8", padding: 0 }}>
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              {error && <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#dc2626" }}>{error}</div>}
              <button type="submit" disabled={loading} style={{ padding: "14px", borderRadius: 12, border: "none", background: role.color, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "opacity 0.15s" }}>
                {loading ? "Signing in…" : role.cta}
              </button>
              {role.key === "ADMIN" && (
                <p style={{ textAlign: "center", fontSize: 13, color: "#64748b", margin: 0 }}>
                  New admin?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/admin-signup")}
                    style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, cursor: "pointer", fontSize: 13, padding: 0 }}
                  >
                    Create an account
                  </button>
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

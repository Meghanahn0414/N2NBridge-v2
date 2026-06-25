import { useState, useEffect, useRef } from "react";
import api from "../../../shared/services/api";
import { updateAuthUser, clearAuth, getAuthUser } from "../../../services/authStorage";
import MIcon from "../../../components/MIcon";

const MS = ({ children, style }) => <MIcon name={children} style={style} />;

function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)}
      style={{ width:46, height:27, borderRadius:14, background:on?"#2B5BD7":"#D8DEEA",
        position:"relative", flexShrink:0, cursor:"pointer", transition:"background 0.2s" }}>
      <span style={{ position:"absolute", top:3, left:on?undefined:3, right:on?3:undefined,
        width:21, height:21, borderRadius:"50%", background:"#fff", transition:"all 0.2s" }} />
    </div>
  );
}

function SaveToast({ msg, isError }) {
  if (!msg) return null;
  return (
    <div style={{
      position:"fixed", bottom:28, right:32, zIndex:999,
      background: isError ? "#C8453A" : "#1E8A5B",
      color:"#fff", font:"600 14px 'Hanken Grotesk'",
      padding:"12px 20px", borderRadius:14,
      boxShadow:"0 12px 30px -10px rgba(20,35,60,.35)",
      display:"flex", alignItems:"center", gap:8,
    }}>
      <MS style={{ fontSize:18, color:"#fff" }}>{isError ? "error" : "check_circle"}</MS>
      {msg}
    </div>
  );
}

const NAV = [
  { id:"profile",    icon:"person",        label:"Profile" },
  { id:"contact",    icon:"call",          label:"Contact" },
  { id:"broadcasts", icon:"campaign",      label:"Broadcast defaults" },
  { id:"notifs",     icon:"notifications", label:"Notifications" },
  { id:"security",   icon:"shield",        label:"Account & security" },
];

export default function MLASettings() {
  const [activeSection, setActiveSection] = useState("profile");
  const [fetching,   setFetching]   = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState({ msg:"", isError:false });
  const toastTimer = useRef(null);

  // ── Profile ──
  const [displayName,  setDisplayName]  = useState("");
  const [title,        setTitle]        = useState("");
  const [bio,          setBio]          = useState("");
  const [showApproval, setShowApproval] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [avatarInitials, setAvatarInitials] = useState("?");

  // ── Contact ──
  const [email,         setEmail]         = useState("");
  const [officePhone,   setOfficePhone]   = useState("");
  const [officeAddress, setOfficeAddress] = useState("");

  // ── Broadcast defaults ──
  const [signature,            setSignature]            = useState("");
  const [defaultBroadcastType, setDefaultBroadcastType] = useState("update");

  // ── Notifications ──
  const [notifs, setNotifs] = useState({
    newGrievance: false, resolved: false, escalated: false,
    broadcastStats: false, weeklyDigest: false,
  });


  // ── Security ──
  const [currentPw,       setCurrentPw]       = useState("");
  const [newPw,           setNewPw]           = useState("");
  const [confirmPw,       setConfirmPw]       = useState("");
  const [pwError,         setPwError]         = useState("");
  const [showSessions,    setShowSessions]    = useState(false);
  const [showDeactivate,  setShowDeactivate]  = useState(false);
  const [deactivating,    setDeactivating]    = useState(false);

  // ── Load profile (no skeleton — form always visible) ──
  useEffect(() => {
    let cancelled = false;
    setFetching(true);
    setFetchError("");

    api.get("/api/users/me")
      .then(res => {
        if (cancelled) return;
        const u = res.data;
        setDisplayName(u.fullName || "");
        setTitle(u.title || "");
        setBio(u.bio || "");
        setShowApproval(u.showApprovalRating ?? false);
        setShowResolved(u.showResolvedCount ?? false);
        setEmail(u.email || "");
        setOfficePhone(u.officePhone || "");
        setOfficeAddress(u.officeAddress || "");
        setSignature(u.broadcastSignature || "");
        setDefaultBroadcastType(u.defaultBroadcastType || "update");
        if (u.notifPreferences) setNotifs(prev => ({ ...prev, ...u.notifPreferences }));
        const initials = (u.fullName || "")
          .trim().split(/\s+/).filter(Boolean)
          .map(w => w[0]).join("").toUpperCase().slice(0, 2);
        setAvatarInitials(initials || "?");
      })
      .catch(err => {
        if (cancelled) return;
        const detail = err?.response?.data?.detail || err?.response?.data?.message || String(err);
        console.error("[Settings] GET /api/users/me failed:", detail, err);
        setFetchError(detail);
      })
      .finally(() => { if (!cancelled) setFetching(false); });

    return () => { cancelled = true; };
  }, []);

  function showToast(msg, isError = false) {
    clearTimeout(toastTimer.current);
    setToast({ msg, isError });
    toastTimer.current = setTimeout(() => setToast({ msg:"", isError:false }), 3000);
  }

  async function saveSection(payload) {
    setSaving(true);
    try {
      const res = await api.put("/api/users/me", payload);
      updateAuthUser({ fullName: res.data?.fullName, title: res.data?.title, email: res.data?.email });
      showToast("Changes saved");
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || "Failed to save — please try again";
      showToast(msg, true);
    } finally {
      setSaving(false);
    }
  }

  const handleSaveProfile = () => saveSection({
    fullName:           displayName.trim() || undefined,
    title:              title.trim()       || undefined,
    bio:                bio.trim()         || undefined,
    showApprovalRating: showApproval,
    showResolvedCount:  showResolved,
  });

  const handleSaveContact = () => saveSection({
    email:         email.trim()         || undefined,
    officePhone:   officePhone.trim()   || undefined,
    officeAddress: officeAddress.trim() || undefined,
  });

  const handleSaveBroadcasts = () => saveSection({
    broadcastSignature:   signature.trim() || undefined,
    defaultBroadcastType: defaultBroadcastType,
  });

  const handleSaveNotifs = () => saveSection({ notifPreferences: notifs });

  const handleUpdatePassword = async () => {
    setPwError("");
    if (!currentPw || !newPw || !confirmPw) { setPwError("All password fields are required"); return; }
    if (newPw !== confirmPw)                  { setPwError("New passwords do not match"); return; }
    if (newPw.length < 8)                     { setPwError("Password must be at least 8 characters"); return; }
    setSaving(true);
    try {
      await api.post("/api/auth/change-password", { oldPassword: currentPw, newPassword: newPw });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      showToast("Password updated");
    } catch (err) {
      setPwError(err?.response?.data?.detail || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };


  const handleSignOutAll = () => {
    clearAuth();
    window.location.href = "/admin-login";
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await api.put("/api/users/me", { status: "INACTIVE" });
      showToast("Account deactivated");
      setTimeout(() => {
        clearAuth();
        window.location.href = "/admin-login";
      }, 1500);
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to deactivate account", true);
      setDeactivating(false);
      setShowDeactivate(false);
    }
  };

  // ── Shared styles ──
  const lbl = { font:"700 13px 'Hanken Grotesk'", color:"#16233C", display:"block", marginBottom:7 };
  const inp = {
    width:"100%", height:44, border:"1.5px solid #E1E6F0", borderRadius:11,
    padding:"0 14px", font:"500 14px 'Hanken Grotesk'", color:"#16233C",
    outline:"none", boxSizing:"border-box", background:"#FAFBFD",
    opacity: fetching ? 0.55 : 1, transition:"opacity 0.2s",
  };
  const saveBtnStyle = {
    height:42, padding:"0 22px", border:"none", borderRadius:11,
    background: saving ? "#8FAEEC" : "#2B5BD7",
    color:"#fff", font:"700 14px 'Hanken Grotesk'",
    cursor: (saving || fetching) ? "not-allowed" : "pointer",
    display:"inline-flex", alignItems:"center", gap:8,
  };
  const card = {
    background:"#fff", border:"1px solid #EAEDF4", borderRadius:22,
    padding:28, boxShadow:"0 14px 30px -22px rgba(20,35,60,.3)",
  };

  // ── Error banner ──
  const ErrorBanner = () => fetchError ? (
    <div style={{ background:"#FEF0EF", border:"1px solid #F5C6C2", borderRadius:12,
      padding:"11px 16px", marginBottom:18, display:"flex", alignItems:"center", gap:10 }}>
      <MS style={{ fontSize:18, color:"#C8453A" }}>error</MS>
      <span style={{ font:"500 13px 'Hanken Grotesk'", color:"#C8453A" }}>
        {fetchError} — you can still fill in and save below.
      </span>
    </div>
  ) : null;

  const SectionTitle = ({ children }) => (
    <div style={{ font:"700 17px 'Hanken Grotesk'", color:"#16233C", marginBottom:22 }}>{children}</div>
  );

  const SaveBtn = ({ onClick, label = "Save changes" }) => (
    <button style={saveBtnStyle} onClick={onClick} disabled={saving || fetching}>
      {saving ? <><MS style={{ fontSize:16 }}>hourglass_empty</MS>Saving…</> : label}
    </button>
  );

  return (
    <>
      <SaveToast msg={toast.msg} isError={toast.isError} />

      {/* Topbar */}
      <header style={{ position:"sticky", top:0, zIndex:30, background:"#F3F5FA",
        borderBottom:"1px solid #E5E9F1", padding:"16px 34px", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap", minHeight:72 }}>
        <div style={{ flex:1, minWidth:0, maxWidth:"60%" }}>
          <div style={{ font:"500 12px 'Hanken Grotesk','Noto Sans Kannada',sans-serif", color:"#8590A6", marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            Preferences &amp; account
          </div>
          <h1 style={{ fontFamily:"'Newsreader','Noto Sans Kannada',serif", fontSize:"clamp(16px,2.2vw,26px)", fontWeight:400, color:"#16233C", margin:0, letterSpacing:"-.01em", lineHeight:1.25, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            Settings
          </h1>
        </div>
        {fetching && (
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6,
            font:"500 12px 'Hanken Grotesk'", color:"#8590A6" }}>
            <MS style={{ fontSize:15 }}>sync</MS>Loading…
          </div>
        )}
      </header>

      <div style={{ background:"#F3F5FA", minHeight:"100vh", padding:"28px 32px",
        display:"grid", gridTemplateColumns:"220px 1fr", gap:24, alignItems:"start",
        fontFamily:"'Hanken Grotesk', sans-serif" }}>

        {/* Side nav */}
        <div style={{ background:"#fff", border:"1px solid #EAEDF4", borderRadius:20,
          padding:"14px 10px", boxShadow:"0 14px 30px -22px rgba(20,35,60,.3)",
          position:"sticky", top:92 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setActiveSection(n.id)} style={{
              display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderRadius:12,
              cursor:"pointer", background:activeSection===n.id?"#EEF2FF":"transparent",
              border:"none", width:"100%", textAlign:"left",
              font:`${activeSection===n.id?"700":"600"} 13px 'Hanken Grotesk'`,
              color:activeSection===n.id?"#2B5BD7":"#5A6678",
            }}>
              <MS style={{ fontSize:19, color:activeSection===n.id?"#2B5BD7":"#8590A6" }}>{n.icon}</MS>
              {n.label}
            </button>
          ))}
        </div>

        {/* Content panels */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          {/* ── PROFILE ── */}
          {activeSection === "profile" && (
            <section style={card}>
              <SectionTitle>Profile</SectionTitle>
              <ErrorBanner />

              {/* Avatar preview */}
              <div style={{ display:"flex", alignItems:"center", gap:18, marginBottom:26 }}>
                <div style={{ width:72, height:72, borderRadius:"50%",
                  background: fetching ? "#C5D3F0" : "linear-gradient(135deg,#1B3C8F,#2B5BD7)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  flexShrink:0, transition:"background 0.3s" }}>
                  {fetching
                    ? <MS style={{ fontSize:26, color:"#fff", opacity:0.7 }}>sync</MS>
                    : <span style={{ font:"700 24px 'Hanken Grotesk'", color:"#fff" }}>{avatarInitials}</span>
                  }
                </div>
                <div>
                  <div style={{ font:"700 15px 'Hanken Grotesk'", color:"#16233C" }}>
                    {displayName || (fetching ? "Loading…" : "Your name")}
                  </div>
                  <div style={{ font:"500 13px 'Hanken Grotesk'", color:"#8590A6", marginTop:2 }}>
                    {title || (fetching ? "" : "Your role")}
                  </div>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                <div>
                  <label style={lbl}>Display name</label>
                  <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your name" style={inp} disabled={fetching} />
                </div>
                <div>
                  <label style={lbl}>Title / Role</label>
                  <input value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. City Councilor" style={inp} disabled={fetching} />
                </div>
              </div>

              <div style={{ marginBottom:22 }}>
                <label style={lbl}>Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                  placeholder="Write a short bio…" disabled={fetching}
                  style={{ ...inp, height:"auto", padding:"12px 14px", resize:"vertical" }} />
              </div>

              <div style={{ background:"#F9FAFC", border:"1px solid #EAEDF4", borderRadius:14,
                padding:"16px 18px", marginBottom:22 }}>
                <div style={{ font:"700 13px 'Hanken Grotesk'", color:"#16233C", marginBottom:14 }}>
                  Public visibility
                </div>
                {[
                  { key:"approval", label:"Show approval rating on public profile", val:showApproval, set:setShowApproval },
                  { key:"resolved", label:"Show resolved complaints count",          val:showResolved, set:setShowResolved },
                ].map(t => (
                  <div key={t.key} style={{ display:"flex", alignItems:"center",
                    justifyContent:"space-between", marginBottom:12 }}>
                    <span style={{ font:"500 13px 'Hanken Grotesk'", color:"#5A6678" }}>{t.label}</span>
                    <Toggle on={t.val} onChange={t.set} />
                  </div>
                ))}
              </div>

              <SaveBtn onClick={handleSaveProfile} />
            </section>
          )}

          {/* ── CONTACT ── */}
          {activeSection === "contact" && (
            <section style={card}>
              <SectionTitle>Contact</SectionTitle>
              <ErrorBanner />

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                <div>
                  <label style={{ ...lbl, display:"flex", alignItems:"center", gap:6 }}>
                    <MS style={{ fontSize:15, color:"#8590A6" }}>mail</MS>Email
                  </label>
                  <input value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" style={inp} disabled={fetching} />
                </div>
                <div>
                  <label style={{ ...lbl, display:"flex", alignItems:"center", gap:6 }}>
                    <MS style={{ fontSize:15, color:"#8590A6" }}>call</MS>Office phone
                  </label>
                  <input value={officePhone} onChange={e => setOfficePhone(e.target.value)}
                    placeholder="Office number" style={inp} disabled={fetching} />
                </div>
              </div>

              <div style={{ marginBottom:22 }}>
                <label style={{ ...lbl, display:"flex", alignItems:"center", gap:6 }}>
                  <MS style={{ fontSize:15, color:"#8590A6" }}>location_on</MS>Office address
                </label>
                <input value={officeAddress} onChange={e => setOfficeAddress(e.target.value)}
                  placeholder="Office address" style={inp} disabled={fetching} />
              </div>

              <SaveBtn onClick={handleSaveContact} />
            </section>
          )}

          {/* ── BROADCASTS ── */}
          {activeSection === "broadcasts" && (
            <section style={card}>
              <SectionTitle>Broadcast defaults</SectionTitle>

              <div style={{ marginBottom:20 }}>
                <label style={lbl}>Default broadcast type</label>
                <div style={{ display:"flex", gap:10 }}>
                  {["event","achievement","update"].map(t => (
                    <button key={t} onClick={() => setDefaultBroadcastType(t)}
                      style={{ flex:1, height:40,
                        border: defaultBroadcastType===t ? "2px solid #2B5BD7" : "1.5px solid #E1E6F0",
                        borderRadius:11,
                        background: defaultBroadcastType===t ? "#EEF2FF" : "#fff",
                        color: defaultBroadcastType===t ? "#2B5BD7" : "#5A6678",
                        font:`${defaultBroadcastType===t?"700":"600"} 13px 'Hanken Grotesk'`,
                        cursor:"pointer" }}>
                      {t.charAt(0).toUpperCase()+t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:22 }}>
                <label style={lbl}>Message signature</label>
                <textarea value={signature} onChange={e => setSignature(e.target.value)} rows={3}
                  placeholder="e.g. — Your Name, City Councilor"
                  style={{ ...inp, height:"auto", padding:"12px 14px", resize:"vertical" }} />
              </div>

              <SaveBtn onClick={handleSaveBroadcasts} label="Save defaults" />
            </section>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeSection === "notifs" && (
            <section style={card}>
              <SectionTitle>Notifications</SectionTitle>
              <ErrorBanner />

              {[
                { key:"newGrievance",   label:"New grievance filed",           sub:"Get notified when a citizen submits a new complaint" },
                { key:"resolved",       label:"Complaint resolved",            sub:"When an officer marks a complaint as resolved" },
                { key:"escalated",      label:"Complaint escalated",           sub:"Urgent alerts for escalated or overdue complaints" },
                { key:"broadcastStats", label:"Broadcast performance updates", sub:"Open rates and engagement summaries" },
                { key:"weeklyDigest",   label:"Weekly digest",                 sub:"Summary of the week's activity every Monday" },
              ].map((n, i, arr) => (
                <div key={n.key} style={{ display:"flex", alignItems:"center", gap:16, padding:"16px 0",
                  borderBottom: i < arr.length-1 ? "1px solid #F0F2F7" : "none" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ font:"700 14px 'Hanken Grotesk'", color:"#16233C" }}>{n.label}</div>
                    <div style={{ font:"500 12px 'Hanken Grotesk'", color:"#8590A6", marginTop:2 }}>{n.sub}</div>
                  </div>
                  <Toggle on={notifs[n.key]} onChange={v => setNotifs(prev => ({ ...prev, [n.key]:v }))} />
                </div>
              ))}

              <div style={{ marginTop:22 }}>
                <SaveBtn onClick={handleSaveNotifs} label="Save preferences" />
              </div>
            </section>
          )}


          {/* ── SECURITY ── */}
          {activeSection === "security" && (
            <section style={card}>
              <SectionTitle>Account &amp; security</SectionTitle>

              {/* Change password */}
              <div style={{ marginBottom:22 }}>
                <div style={{ font:"700 14px 'Hanken Grotesk'", color:"#16233C", marginBottom:14 }}>
                  Change password
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {[
                    ["Current password", currentPw, setCurrentPw],
                    ["New password",      newPw,     setNewPw],
                    ["Confirm new password", confirmPw, setConfirmPw],
                  ].map(([label, val, set]) => (
                    <div key={label}>
                      <label style={lbl}>{label}</label>
                      <input type="password" value={val} onChange={e => set(e.target.value)}
                        placeholder="••••••••" style={inp} />
                    </div>
                  ))}
                </div>
                {pwError && (
                  <div style={{ font:"500 13px 'Hanken Grotesk'", color:"#C8453A", marginTop:10 }}>
                    {pwError}
                  </div>
                )}
                <div style={{ marginTop:16 }}>
                  <SaveBtn onClick={handleUpdatePassword} label="Update password" />
                </div>
              </div>

              <div style={{ height:1, background:"#F0F2F7", margin:"22px 0" }} />


              {/* Active sessions */}
              <div style={{ display:"flex", alignItems:"center", gap:14, background:"#F9FAFC",
                border:"1px solid #EAEDF4", borderRadius:14, padding:"15px 16px", marginBottom:18 }}>
                <MS style={{ fontSize:21, color:"#5A6678" }}>devices</MS>
                <div style={{ flex:1 }}>
                  <div style={{ font:"600 14px 'Hanken Grotesk'", color:"#16233C" }}>Active sessions</div>
                  <div style={{ font:"500 12px 'Hanken Grotesk'", color:"#8590A6" }}>Last active just now</div>
                </div>
                <button onClick={() => setShowSessions(true)}
                  style={{ height:38, padding:"0 14px", border:"1.5px solid #E1E6F0",
                  borderRadius:10, background:"#fff", color:"#16233C",
                  font:"600 13px 'Hanken Grotesk'", cursor:"pointer" }}>
                  Manage
                </button>
              </div>

              {/* Deactivate */}
              <div style={{ display:"flex", alignItems:"center", gap:14, background:"#FCF0EF",
                border:"1px solid #F3D7D3", borderRadius:14, padding:"15px 16px" }}>
                <MS style={{ fontSize:22, color:"#C8453A" }}>warning</MS>
                <div style={{ flex:1 }}>
                  <div style={{ font:"700 14px 'Hanken Grotesk'", color:"#16233C" }}>Deactivate account</div>
                  <div style={{ font:"500 12px 'Hanken Grotesk'", color:"#8590A6" }}>
                    Your public profile and broadcasts will be hidden.
                  </div>
                </div>
                <button onClick={() => setShowDeactivate(true)}
                  style={{ height:40, padding:"0 16px", border:"1.5px solid #E2A8A1",
                  borderRadius:11, background:"#fff", color:"#C8453A",
                  font:"700 13px 'Hanken Grotesk'", cursor:"pointer" }}>
                  Deactivate
                </button>
              </div>

              {/* Sessions modal */}
              {showSessions && (
                <div style={{ position:"fixed", inset:0, background:"rgba(20,35,60,.45)",
                  display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}
                  onClick={() => setShowSessions(false)}>
                  <div style={{ background:"#fff", borderRadius:20, padding:32, width:"100%", maxWidth:420,
                    boxShadow:"0 24px 48px -12px rgba(20,35,60,.3)" }}
                    onClick={e => e.stopPropagation()}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22 }}>
                      <div style={{ font:"700 17px 'Hanken Grotesk'", color:"#16233C" }}>Active sessions</div>
                      <button onClick={() => setShowSessions(false)}
                        style={{ border:"none", background:"none", cursor:"pointer", fontSize:20, color:"#8590A6" }}>✕</button>
                    </div>
                    {/* Current session */}
                    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px",
                      borderRadius:12, background:"#F0F4FF", border:"1px solid #D4DCFA", marginBottom:20 }}>
                      <MS style={{ fontSize:24, color:"#2B5BD7" }}>laptop_mac</MS>
                      <div style={{ flex:1 }}>
                        <div style={{ font:"600 13px 'Hanken Grotesk'", color:"#16233C" }}>
                          {navigator.platform || "This device"}
                        </div>
                        <div style={{ font:"400 12px 'Hanken Grotesk'", color:"#8590A6" }}>
                          Current session · Active now
                        </div>
                      </div>
                      <div style={{ font:"600 11px 'Hanken Grotesk'", color:"#1E8A5B",
                        background:"#DCFCE7", borderRadius:6, padding:"3px 10px" }}>Active</div>
                    </div>
                    <button onClick={handleSignOutAll}
                      style={{ width:"100%", height:44, borderRadius:12, border:"1.5px solid #E2A8A1",
                        background:"#FEF2F2", color:"#C8453A", font:"700 14px 'Hanken Grotesk'",
                        cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                      <MS style={{ fontSize:18, color:"#C8453A" }}>logout</MS>
                      Sign out all devices
                    </button>
                  </div>
                </div>
              )}

              {/* Deactivate confirmation modal */}
              {showDeactivate && (
                <div style={{ position:"fixed", inset:0, background:"rgba(20,35,60,.45)",
                  display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}
                  onClick={() => !deactivating && setShowDeactivate(false)}>
                  <div style={{ background:"#fff", borderRadius:20, padding:32, width:"100%", maxWidth:400,
                    boxShadow:"0 24px 48px -12px rgba(20,35,60,.3)", textAlign:"center" }}
                    onClick={e => e.stopPropagation()}>
                    <div style={{ width:52, height:52, borderRadius:"50%", background:"#FEE2E2",
                      display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                      <MS style={{ fontSize:28, color:"#C8453A" }}>warning</MS>
                    </div>
                    <div style={{ font:"700 18px 'Hanken Grotesk'", color:"#16233C", marginBottom:8 }}>
                      Deactivate account?
                    </div>
                    <div style={{ font:"400 13px 'Hanken Grotesk'", color:"#8590A6", marginBottom:24, lineHeight:1.6 }}>
                      Your public profile and broadcasts will be hidden. You can reactivate by contacting support.
                    </div>
                    <div style={{ display:"flex", gap:10 }}>
                      <button onClick={() => setShowDeactivate(false)} disabled={deactivating}
                        style={{ flex:1, height:44, borderRadius:12, border:"1.5px solid #E1E6F0",
                          background:"#fff", font:"600 14px 'Hanken Grotesk'", color:"#5A6678",
                          cursor: deactivating ? "not-allowed" : "pointer" }}>
                        Cancel
                      </button>
                      <button onClick={handleDeactivate} disabled={deactivating}
                        style={{ flex:1, height:44, borderRadius:12, border:"none",
                          background: deactivating ? "#F9A8A4" : "#C8453A",
                          font:"700 14px 'Hanken Grotesk'", color:"#fff",
                          cursor: deactivating ? "not-allowed" : "pointer" }}>
                        {deactivating ? "Deactivating…" : "Yes, deactivate"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

        </div>
      </div>
    </>
  );
}

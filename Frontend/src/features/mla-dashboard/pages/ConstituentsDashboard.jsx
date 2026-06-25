import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../shared/services/api";
import { getAuthUser } from "../../../services/authStorage";
import { ROUTES } from "../../../app/routes/RouteConstants";
import "../styles/mla-layout.css";
import MIcon from "../../../components/MIcon";
import ExportButton from "../../../components/ExportButton";

function MI({ children, style }) {
  return <MIcon name={children} style={style} />;
}

/* ── helpers ─────────────────────────────────────────────── */
function fmt(n) {
  if (n == null) return "—";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toString();
}

function pct(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

/* Avatar colours cycling */
const AVATAR_COLORS = ["#2B5BD7", "#1E8A5B", "#6B4FD8", "#C9871F", "#C8453A"];

/* Build SVG polyline from monthly growth data */
function buildGrowthPath(growth, w = 360, h = 170) {
  if (!growth || growth.length < 2) return { line: "", area: "", dots: [] };
  const counts = growth.map((g) => g.count);
  const maxVal = Math.max(...counts, 1);
  const minY = 20, maxY = h - 20;
  const pts = growth.map((g, i) => {
    const x = (i / (growth.length - 1)) * w;
    const y = maxY - ((g.count / maxVal) * (maxY - minY));
    return [Math.round(x), Math.round(y)];
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1];
  return { line, area, dots: last };
}

/* Month label */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function growthLabels(growth) {
  if (!growth || growth.length === 0) return ["—", "—", "—", "Now"];
  const first = growth[0];
  const mid1 = growth[Math.floor(growth.length / 3)];
  const mid2 = growth[Math.floor((2 * growth.length) / 3)];
  return [
    MONTHS[(first.month - 1) % 12],
    MONTHS[(mid1.month - 1) % 12],
    MONTHS[(mid2.month - 1) % 12],
    "Now",
  ];
}

/* ── Segment bar row ─────────────────────────────────────── */
function SegmentRow({ icon, label, count, engPct, color = "#2B5BD7", bg = "#E7EEFF", iconColor = "#2B5BD7" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <MIcon name={icon} style={{ fontSize: 20, color: iconColor }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ font: "700 14px 'Hanken Grotesk'", color: "#16233C" }}>{label}</span>
          <span style={{ font: "600 13px 'Hanken Grotesk'", color: "#5A6678" }}>
            {fmt(count)} · <span style={{ color: engPct >= 60 ? "#1E7A50" : "#B5781A" }}>{engPct}%</span>
          </span>
        </div>
        <div style={{ height: 7, borderRadius: 5, background: "#EEF1F7" }}>
          <div style={{ width: `${engPct}%`, height: "100%", borderRadius: 5, background: color }} />
        </div>
      </div>
    </div>
  );
}

/* ── Funnel bar ──────────────────────────────────────────── */
function FunnelBar({ label, value, total, widthPct, bg, textDark }) {
  const displayPct = Math.round(widthPct);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ font: "600 13px 'Hanken Grotesk'", color: "#16233C" }}>{label}</span>
        <span style={{ font: "700 13px 'Hanken Grotesk'", color: "#16233C" }}>{fmt(value)}</span>
      </div>
      <div style={{ height: 38, width: `${widthPct}%`, borderRadius: 10, background: bg, display: "flex", alignItems: "center", padding: "0 14px" }}>
        <span style={{ font: "700 12px 'Hanken Grotesk'", color: textDark ? "#16233C" : "#fff" }}>{displayPct}%</span>
      </div>
    </div>
  );
}

/* ── KPI card ────────────────────────────────────────────── */
function KpiCard({ iconBg, iconColor, iconEl, label, value, sub, subGreen }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 18, padding: "18px 20px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {/* notranslate prevents GT from wrapping the emoji in <font> and duplicating it */}
          <span className="notranslate" translate="no" style={{ fontSize: 20, color: iconColor, lineHeight: 1, display: "block" }}>{iconEl}</span>
        </div>
        <span style={{ font: "600 12px 'Hanken Grotesk','Noto Sans Kannada',sans-serif", color: "#8590A6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
      </div>
      <div style={{ fontFamily: "'Newsreader','Noto Sans Kannada',serif", fontSize: "clamp(20px,2.5vw,30px)", fontWeight: 400, color: "#16233C", lineHeight: 1.2 }}>{value}</div>
      <div style={{ font: "500 12px 'Hanken Grotesk','Noto Sans Kannada',sans-serif", color: subGreen ? "#1E7A50" : "#8590A6", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function ConstituentsDashboard() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  /* ── Search state ── */
  const [searchQ, setSearchQ]           = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch]     = useState(false);
  const searchRef = useRef(null);
  const searchTimer = useRef(null);

  /* ── Message modal state ── */
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgWard, setMsgWard]           = useState("");
  const [msgText, setMsgText]           = useState("");
  const [msgSending, setMsgSending]     = useState(false);
  const [msgSent, setMsgSent]           = useState(false);

  const navigate = useNavigate();
  const pageRef = useRef(null);
  const user = getAuthUser();
  const ward = user?.ward || user?.constituency || "your constituency";

  const load = () => {
    setLoading(true);
    setError(null);
    api.get("/api/campaigns/constituents/stats")
      .then((r) => setStats(r.data))
      .catch((e) => {
        console.error("[Constituents] stats fetch failed:", e);
        setError("Could not load data. Check that the backend is running.");
        setStats(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Close search on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Debounced search ── */
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQ(q);
    setShowSearch(true);
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(() => {
      setSearchLoading(true);
      api.get("/api/users/citizens/search", { params: { q, limit: 8 } })
        .then((r) => setSearchResults(r.data?.results || []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 280);
  };

  /* ── Send broadcast to segment ── */
  const handleSendMessage = async () => {
    if (!msgText.trim()) return;
    setMsgSending(true);
    try {
      await api.post("/api/campaigns/", {
        name:    `Segment message — ${msgWard || "All residents"}`,
        type:    "Awareness",
        message: msgText.trim(),
        status:  "ACTIVE",
        wardId:  msgWard || undefined,
      });
      setMsgSent(true);
      setTimeout(() => { setShowMsgModal(false); setMsgSent(false); setMsgText(""); setMsgWard(""); }, 1800);
    } catch {
      alert("Failed to send. Please try again.");
    } finally {
      setMsgSending(false);
    }
  };

  /* ── Derived values ── */
  const total     = stats?.total     ?? 0;
  const verified  = stats?.verified  ?? 0;
  const active30d = stats?.active30d ?? 0;
  const new30d    = stats?.new30d    ?? 0;
  const newPct    = stats?.newPct    ?? 0;
  const engaged   = stats?.engaged   ?? 0;
  const advocates = stats?.advocates ?? 0;
  const growth    = stats?.growth    ?? [];
  const wards     = stats?.wards     ?? [];
  const topResidents = stats?.topResidents ?? [];

  /* SVG chart */
  const { line, area, dots } = buildGrowthPath(growth);
  const labels = growthLabels(growth);

  /* Derive segments from ward data — top wards become "segments" */
  const wardTotal = wards.reduce((s, w) => s + w.count, 0);
  const segments = wards.length > 0
    ? wards.slice(0, 5).map((w, i) => ({
        icon: ["location_on", "place", "location_on", "place", "location_on"][i] || "location_on",
        label: w.ward,
        count: w.count,
        engPct: pct(w.count, wardTotal > 0 ? wardTotal : 1),
        color: i < 3 ? "#2B5BD7" : "#C9871F",
        bg:    i < 3 ? "#E7EEFF" : "#FCF1E0",
        iconColor: i < 3 ? "#2B5BD7" : "#C9871F",
      }))
    : [
        { icon: "group",    label: "Families & parents",   count: 0, engPct: 0, color: "#2B5BD7", bg: "#E7EEFF", iconColor: "#2B5BD7" },
        { icon: "place",    label: "Long-term residents",  count: 0, engPct: 0, color: "#2B5BD7", bg: "#E7EEFF", iconColor: "#2B5BD7" },
      ];

  /* Growth badge — only show % when there's a real prior-period baseline */
  const growthTotal  = growth.reduce((s, g) => s + g.count, 0);
  const priorTotal   = total - growthTotal;                        // citizens registered before 12 months ago
  const hasBaseline  = priorTotal > 0;
  const growthPct    = hasBaseline ? Math.round((growthTotal / priorTotal) * 100) : null;

  return (
    <div ref={pageRef} style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>

      {/* ── Topbar ── */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 34px", background: "#F3F5FA", position: "sticky", top: 0, zIndex: 20, borderBottom: "1px solid #E5E9F1", gap: 16, flexWrap: "wrap", minHeight: 72 }}>
        <div style={{ flex: 1, minWidth: 0, maxWidth: "60%" }}>
          <div style={{ font: "500 12px 'Hanken Grotesk','Noto Sans Kannada',sans-serif", color: "#8590A6", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            The residents you serve in {ward}
          </div>
          <h1 style={{ fontFamily: "'Newsreader','Noto Sans Kannada',serif", fontSize: "clamp(16px,2.2vw,26px)", fontWeight: 400, color: "#16233C", margin: 0, letterSpacing: "-.01em", lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Constituents
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

          {/* ── Live search ── */}
          <div ref={searchRef} style={{ position: "relative" }}>
            <div style={{ height: 44, background: "#fff", border: `1px solid ${showSearch ? "#2B5BD7" : "#E1E6F0"}`, borderRadius: 13, display: "flex", alignItems: "center", gap: 9, padding: "0 15px", width: 260, transition: "border-color 0.15s" }}>
              <MIcon name="search" style={{ fontSize: 17, color: "#9AA3B5" }} />
              <input
                value={searchQ}
                onChange={handleSearchChange}
                onFocus={() => setShowSearch(true)}
                placeholder="Find a resident"
                style={{ border: "none", outline: "none", font: "500 14px 'Hanken Grotesk'", color: "#16233C", background: "transparent", width: "100%" }}
              />
              {searchQ && (
                <button onClick={() => { setSearchQ(""); setSearchResults([]); }} style={{ border: "none", background: "none", cursor: "pointer", color: "#9AA3B5", fontSize: 16, padding: 0, flexShrink: 0 }}>✕</button>
              )}
            </div>

            {/* Dropdown results */}
            {showSearch && (searchQ.trim() || searchResults.length > 0) && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, width: 320, background: "#fff", border: "1px solid #E1E6F0", borderRadius: 16, boxShadow: "0 16px 40px rgba(20,35,60,0.13)", zIndex: 100, overflow: "hidden" }}>
                {searchLoading ? (
                  <div style={{ padding: "16px 18px", font: "500 13px 'Hanken Grotesk'", color: "#8590A6" }}>Searching…</div>
                ) : searchResults.length === 0 ? (
                  <div style={{ padding: "16px 18px", font: "500 13px 'Hanken Grotesk'", color: "#8590A6" }}>No residents found for "{searchQ}"</div>
                ) : (
                  <>
                    <div style={{ padding: "10px 16px 6px", font: "600 11px 'Hanken Grotesk'", color: "#8590A6", textTransform: "uppercase", letterSpacing: ".05em" }}>
                      {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                    </div>
                    {searchResults.map((r, i) => (
                      <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderTop: i === 0 ? "none" : "1px solid #F3F5FA", cursor: "pointer", transition: "background 0.1s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#F3F5FA"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        onClick={() => { setShowSearch(false); setSearchQ(""); }}
                      >
                        <div className="notranslate" translate="no" style={{ width: 36, height: 36, borderRadius: "50%", background: AVATAR_COLORS[i % AVATAR_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", font: "700 13px 'Hanken Grotesk'", color: "#fff", flexShrink: 0 }}>
                          {r.initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="notranslate" translate="no" style={{ font: "700 14px 'Hanken Grotesk'", color: "#16233C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                          <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6" }}>
                            {[r.ward && `Ward ${r.ward}`, r.age && `Age ${r.age}`, r.gender].filter(Boolean).join(" · ") || r.mobile}
                          </div>
                        </div>
                        <span style={{ font: "500 12px 'Hanken Grotesk'", color: "#9AA3B5", flexShrink: 0 }}>{r.mobile}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Message a segment button ── */}
          <button
            onClick={() => setShowMsgModal(true)}
            style={{ height: 44, padding: "0 18px", border: "none", borderRadius: 13, background: "#2B5BD7", color: "#fff", font: "700 14px 'Hanken Grotesk'", display: "flex", alignItems: "center", gap: 7, boxShadow: "0 12px 24px -10px rgba(43,91,215,.7)", cursor: "pointer" }}
          >
            <MIcon name="campaign" style={{ fontSize: 18, color: "#fff" }} /> Message a segment
          </button>
          <ExportButton
            filename="constituents"
            pdfRef={pageRef}
            data={[
              { metric: 'Total Residents',  value: fmt(total) },
              { metric: 'Verified',         value: fmt(verified) },
              { metric: 'Active (30 days)', value: fmt(active30d) },
              { metric: 'New (30 days)',    value: fmt(new30d) },
              { metric: 'Engaged',          value: fmt(engaged) },
              { metric: 'Advocates',        value: fmt(advocates) },
              ...wards.slice(0, 10).map(w => ({ metric: `Ward: ${w.ward}`, value: String(w.count) })),
            ]}
            columns={[
              { key: 'metric', label: 'Metric' },
              { key: 'value',  label: 'Value' },
            ]}
          />
        </div>
      </header>

      {/* ── Message a segment modal ── */}
      {showMsgModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(14,22,38,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowMsgModal(false); }}
        >
          <div style={{ width: 480, background: "#fff", borderRadius: 22, boxShadow: "0 24px 60px rgba(14,22,38,0.2)", overflow: "hidden" }}>
            {/* Modal header */}
            <div style={{ padding: "22px 26px 18px", borderBottom: "1px solid #EAEDF4" }}>
              <div style={{ font: "700 18px 'Hanken Grotesk'", color: "#16233C" }}>Message a segment</div>
              <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#8590A6", marginTop: 3 }}>Send a broadcast to residents in a specific ward</div>
            </div>

            {msgSent ? (
              <div style={{ padding: "40px 26px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}><MIcon name="check_circle" style={{ fontSize: 40, color: "#1E8A5B" }} /></div>
                <div style={{ font: "700 16px 'Hanken Grotesk'", color: "#1E8A5B" }}>Broadcast sent!</div>
                <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#8590A6", marginTop: 4 }}>Residents will receive the notification</div>
              </div>
            ) : (
              <div style={{ padding: "22px 26px" }}>
                {/* Ward picker */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ font: "600 13px 'Hanken Grotesk'", color: "#16233C", display: "block", marginBottom: 8 }}>Target ward</label>
                  <select
                    value={msgWard}
                    onChange={e => setMsgWard(e.target.value)}
                    style={{ width: "100%", height: 44, borderRadius: 11, border: "1px solid #E1E6F0", padding: "0 14px", font: "500 14px 'Hanken Grotesk'", color: "#16233C", background: "#fff", outline: "none", cursor: "pointer" }}
                  >
                    <option value="">All residents</option>
                    {(stats?.wards || []).map(w => (
                      <option key={w.ward} value={w.ward}>{w.ward} ({w.count} residents)</option>
                    ))}
                  </select>
                </div>

                {/* Message textarea */}
                <div style={{ marginBottom: 22 }}>
                  <label style={{ font: "600 13px 'Hanken Grotesk'", color: "#16233C", display: "block", marginBottom: 8 }}>Message</label>
                  <textarea
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    placeholder="Type your message to residents…"
                    rows={4}
                    style={{ width: "100%", borderRadius: 11, border: "1px solid #E1E6F0", padding: "12px 14px", font: "500 14px 'Hanken Grotesk'", color: "#16233C", resize: "vertical", outline: "none", boxSizing: "border-box" }}
                  />
                  <div style={{ font: "500 11px 'Hanken Grotesk'", color: "#9AA3B5", marginTop: 4, textAlign: "right" }}>
                    Sending to: <strong style={{ color: "#2B5BD7" }}>{msgWard ? `${stats?.wards?.find(w => w.ward === msgWard)?.count ?? "?"} residents in ${msgWard}` : `all ${stats?.total ?? ""} residents`}</strong>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setShowMsgModal(false)} style={{ flex: 1, height: 44, border: "2px solid #E1E6F0", borderRadius: 11, background: "#F3F5FA", color: "#5A6678", font: "600 14px 'Hanken Grotesk'", cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!msgText.trim() || msgSending}
                    style={{ flex: 2, height: 44, border: "none", borderRadius: 11, background: !msgText.trim() ? "#B8C7F0" : "#2B5BD7", color: "#fff", font: "700 14px 'Hanken Grotesk'", cursor: !msgText.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: msgText.trim() ? "0 8px 20px -8px rgba(43,91,215,.6)" : "none" }}
                  >
                    {msgSending ? "Sending…" : " Send broadcast"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div style={{ margin: "16px 34px 0", padding: "12px 18px", background: "#FBEAE8", border: "1px solid #F4C5C2", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ font: "500 13px 'Hanken Grotesk'", color: "#C8453A" }}>{error}</span>
          <button onClick={load} style={{ marginLeft: 16, padding: "6px 14px", borderRadius: 8, background: "#C8453A", color: "#fff", border: "none", font: "600 12px 'Hanken Grotesk'", cursor: "pointer" }}>Retry</button>
        </div>
      )}

      {/* ── Body ── */}
      <div style={{ padding: "28px 34px 40px", display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>

        {/* KPI Strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5 }}>
          <KpiCard
            iconBg="#E7EEFF" iconColor="#2B5BD7" iconEl={<MIcon name="groups" style={{ fontSize: 20, color: "#2B5BD7" }} />}
            label="Total Registered Residents"
            value={loading ? "—" : fmt(total)}
            sub={`${pct(verified, total)}% profile complete`}
          />
          <KpiCard
            iconBg="#E6F4EC" iconColor="#1E8A5B" iconEl={<MIcon name="check_circle" style={{ fontSize: 20, color: "#1E8A5B" }} />}
            label="Verified Residents"
            value={loading ? "—" : fmt(verified)}
            sub="Address-confirmed citizens"
          />
          <KpiCard
            iconBg="#EDEAFB" iconColor="#6B4FD8" iconEl={<MIcon name="bolt" style={{ fontSize: 20, color: "#6B4FD8" }} />}
            label="Active Residents·30d"
            value={loading ? "—" : fmt(active30d)}
            sub={`${pct(active30d, total)}% of registered`}
            subGreen
          />
          <KpiCard
            iconBg="#FCF1E0" iconColor="#C9871F" iconEl={<MIcon name="person_add" style={{ fontSize: 20, color: "#C9871F" }} />}
            label="New Residents·30d"
            value={loading ? "—" : `${fmt(new30d)}`}
            sub={newPct >= 0 ? `+${newPct}% vs. previous month` : `${newPct}% vs. previous month`}
            subGreen={newPct >= 0}
          />
        </div>

        {/* Row: segments + growth */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>

          {/* Audience segments */}
          <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: "24px 26px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <div style={{ font: "700 16px 'Hanken Grotesk'", color: "#16233C" }}>Resident Groups</div>
                <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginTop: 2 }}>
                  {wards.length > 0 ? "Residents grouped by ward" : "Who makes up your base"}
                </div>
              </div>
              <span style={{ font: "600 12px 'Hanken Grotesk'", color: "#9AA3B5" }}>Size · Share</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {loading
                ? [1, 2, 3].map((i) => <div key={i} style={{ height: 42, background: "#F3F5FA", borderRadius: 10 }} />)
                : segments.map((s) => <SegmentRow key={s.label} {...s} />)
              }
            </div>
          </div>

          {/* Registration growth */}
          <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: "24px 26px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)", display: "flex", flexDirection: "column" }}>
            <div style={{ font: "700 16px 'Hanken Grotesk'", color: "#16233C", marginBottom: 3 }}>Resident Growth Trend</div>
            <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginBottom: 6 }}>Residents joining, last 12 months</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 14 }}>
              <span style={{ font: "400 38px 'Newsreader', Georgia, serif", color: "#16233C", lineHeight: .9 }}>{fmt(total)}</span>
              {growthTotal > 0 && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#E6F4EC", color: "#1E7A50", font: "700 12px 'Hanken Grotesk'", padding: "4px 9px", borderRadius: 20, marginBottom: 5 }}>
                  {growthPct !== null ? `↑ ${growthPct}%` : `+${fmt(growthTotal)} this year`}
                </span>
              )}
            </div>

            {/* SVG chart */}
            <svg viewBox="0 0 360 170" style={{ width: "100%", height: "auto", display: "block" }} preserveAspectRatio="none">
              <defs>
                <linearGradient id="cFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2B5BD7" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#2B5BD7" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="50" x2="360" y2="50" stroke="#EEF1F7" />
              <line x1="0" y1="110" x2="360" y2="110" stroke="#EEF1F7" />
              {growth.length >= 2 ? (
                <>
                  <path d={area} fill="url(#cFill)" />
                  <path d={line} fill="none" stroke="#2B5BD7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  {dots && <circle cx={dots[0]} cy={dots[1]} r="5.5" fill="#2B5BD7" stroke="#fff" strokeWidth="3" />}
                </>
              ) : (
                <>
                  <path d="M0,150 L60,140 L120,125 L180,108 L240,88 L300,62 L360,30 L360,170 L0,170 Z" fill="url(#cFill)" />
                  <polyline points="0,150 60,140 120,125 180,108 240,88 300,62 360,30" fill="none" stroke="#2B5BD7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="360" cy="30" r="5.5" fill="#2B5BD7" stroke="#fff" strokeWidth="3" />
                </>
              )}
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              {labels.map((l, i) => (
                <span key={i} style={{ font: `${i === 3 ? "700" : "600"} 11px 'Hanken Grotesk'`, color: i === 3 ? "#2B5BD7" : "#9AA3B5" }}>{l}</span>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto", paddingTop: 16, borderTop: "1px solid #F0F2F7" }}>
              <MIcon name="campaign" style={{ fontSize: 16, color: "#1E7A50" }} />
              <span style={{ font: "500 12px 'Hanken Grotesk'", color: "#5A6678" }}>
                {new30d > 0
                  ? `${fmt(new30d)} new residents joined in the last 30 days`
                  : "Track registrations month by month"}
              </span>
            </div>
          </div>
        </div>

        {/* Row: funnel + most engaged */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 20 }}>

          {/* Engagement funnel */}
          <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: "24px 26px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ font: "700 16px 'Hanken Grotesk'", color: "#16233C", marginBottom: 3 }}>Resident Engagement Journey</div>
            <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginBottom: 20 }}>How residents move from signed-up to advocate</div>
            {loading
              ? <div style={{ height: 180, background: "#F3F5FA", borderRadius: 10 }} />
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <FunnelBar label="Registered"             value={total}     total={total} widthPct={100}                        bg="#1B3C8F" />
                  <FunnelBar label="Active (filed report)"  value={active30d} total={total} widthPct={Math.max(pct(active30d, total), 8)}  bg="#2B5BD7" />
                  <FunnelBar label="Engaged (2+ reports)"   value={engaged}   total={total} widthPct={Math.max(pct(engaged, total), 6)}    bg="#5C84E0" />
                  <FunnelBar label="Advocates (5+ reports)" value={advocates} total={total} widthPct={Math.max(pct(advocates, total), 4)}  bg="#8FAEEC" textDark />
                </div>
              )
            }
          </div>

          {/* Most engaged residents */}
          <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: "24px 26px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <div style={{ font: "700 16px 'Hanken Grotesk'", color: "#16233C" }}>Top Active Residents</div>
                <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginTop: 2 }}>Your strongest advocates this quarter</div>
              </div>
              <span
                onClick={() => navigate(ROUTES.adminUsers)}
                style={{ font: "600 13px 'Hanken Grotesk'", color: "#2B5BD7", cursor: "pointer", textDecoration: "none" }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
              >View directory</span>
            </div>

            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} style={{ height: 56, background: "#F3F5FA", borderRadius: 10, marginBottom: 8 }} />
              ))
            ) : topResidents.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {topResidents.map((r, i) => (
                  <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 0", borderBottom: i < topResidents.length - 1 ? "1px solid #F4F6FA" : "none" }}>
                    <div className="notranslate" translate="no" style={{ width: 40, height: 40, borderRadius: "50%", background: AVATAR_COLORS[i % AVATAR_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", font: "700 14px 'Hanken Grotesk'", color: "#fff", flexShrink: 0 }}>
                      {r.initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="notranslate" translate="no" style={{ font: "700 14px 'Hanken Grotesk'", color: "#16233C" }}>{r.name}</div>
                      <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6" }}>Ward: {r.ward || "—"}</div>
                    </div>
                    {i === 0 && (
                      <span className="notranslate" translate="no" style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#FCF1E0", color: "#B5781A", font: "700 11px 'Hanken Grotesk'", padding: "4px 10px", borderRadius: 20, flexShrink: 0 }}>
                        🔥 Top advocate
                      </span>
                    )}
                    {i > 0 && (
                      <span style={{ font: "600 12px 'Hanken Grotesk'", color: "#5A6678", flexShrink: 0 }}>
                        {r.complaints} report{r.complaints !== 1 ? "s" : ""}
                      </span>
                    )}
                    <span style={{ font: "700 13px 'Hanken Grotesk'", color: "#16233C", width: 60, textAlign: "right", flexShrink: 0 }}>
                      {r.complaints * 10} pts
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#8590A6", font: "500 13px 'Hanken Grotesk'" }}>
                No engagement data yet
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

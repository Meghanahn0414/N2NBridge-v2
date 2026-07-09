import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthRole, getAuthUser, getRepRolePrefix } from "../../../services/authStorage";
import api from "../../../shared/services/api";
import { ROUTES } from "../../../app/routes/RouteConstants";
import "../styles/mla-layout.css";
import MIcon from "../../../components/MIcon";
import ExportButton from "../../../components/ExportButton";

const DATE_OPTIONS = [
  { label: "Last 30 Days",  days: 30  },
  { label: "Last 90 Days",  days: 90  },
  { label: "Last 6 Months", days: 180 },
  { label: "Last 12 Months",days: 365 },
];


const INSIGHTS_KEY     = "mla_insights_cache";
const ANALYTICS_KEY    = "mla_analytics_cache";
const CONSTITUENTS_KEY = "mla_constituents_cache";

function readCache(key) {
  try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}
function writeCache(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function useMLAInsights(days) {
  const cachedInsights = readCache(INSIGHTS_KEY);
  const [data, setData]       = useState(cachedInsights);
  const [loading, setLoading] = useState(!cachedInsights);
  const role = getAuthRole();
  const shouldFetchSurvey = role === "ADMIN" || role === "MLA";
  // Tracks the most recently fired request so a slow, stale response (e.g. from
  // a date range the user already clicked away from) can't overwrite fresher
  // data once it finally resolves — these calls can take 15-30s when the
  // sentiment-scoring cache (Redis) is unavailable, so out-of-order responses
  // are common when switching the date picker a few times in a row.
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    Promise.all([
      api.get("/api/mla/insights", { params: { days } }),
      shouldFetchSurvey
        ? api.get("/api/surveys/analytics", { params: { days } }).catch(() => null)
        : Promise.resolve(null),
    ]).then(([insightsRes, surveyRes]) => {
      if (requestId !== requestIdRef.current) return; // a newer request superseded this one
      const insights = insightsRes?.data?.data || insightsRes?.data || null;
      const survey   = surveyRes?.data?.data   || null;
      const merged   = insights ? { ...insights, surveyAnalytics: survey } : null;
      if (merged) writeCache(INSIGHTS_KEY, merged);
      setData(merged);
    }).catch(() => {})
      .finally(() => { if (requestId === requestIdRef.current) setLoading(false); });
  }, [days, shouldFetchSurvey]);
  return { data, loading };
}

function useAnalytics(days) {
  const cachedAnalytics = readCache(ANALYTICS_KEY);
  const [data, setData]       = useState(cachedAnalytics);
  const [loading, setLoading] = useState(!cachedAnalytics);
  const requestIdRef = useRef(0);
  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    api.get("/api/analytics/dashboard", { params: { days } })
      .then(r => {
        if (requestId !== requestIdRef.current) return; // a newer request superseded this one
        const fresh = r?.data?.data || r?.data || null;
        if (fresh) writeCache(ANALYTICS_KEY, fresh);
        setData(fresh);
      })
      .catch(() => {})
      .finally(() => { if (requestId === requestIdRef.current) setLoading(false); });
  }, [days]);
  return { data, loading };
}

// Resident/constituent stats — merged in from the old standalone Constituents
// page (GET /api/campaigns/constituents/stats). Kept as its own hook (rather
// than folded into useAnalytics) since it's a different endpoint with its own
// cache key and doesn't depend on the date-range picker above.
function useConstituents(days) {
  const cached = readCache(CONSTITUENTS_KEY);
  const [stats, setStats]     = useState(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError]     = useState(null);

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    api.get("/api/campaigns/constituents/stats", { params: { days } })
      .then((r) => {
        const fresh = r.data?.data ?? r.data;
        if (fresh) writeCache(CONSTITUENTS_KEY, fresh);
        setStats(fresh);
      })
      .catch((e) => {
        console.error("[Constituents] stats fetch failed:", e);
        setError("Could not load resident data. Check that the backend is running.");
      })
      .finally(() => setLoading(false));
  }, [days]);

  // Resident Growth Trend's window follows the header's date-range picker
  // (same `days` the Grievance Trend / analytics cards use), so this needs
  // to refetch whenever that selection changes.
  useEffect(() => { load(); }, [load]);

  return { stats, loading, error, reload: load };
}

function fmtResolutionTime(ms) {
  if (!ms) return "—";
  const hours = ms / 3_600_000;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function GaugeArc({ pct }) {
  const filled = pct != null ? Math.round(2.83 * pct) : 0;
  const color  = pct != null ? (pct >= 60 ? "#9FE8C2" : pct >= 40 ? "#FCD97B" : "#F08080") : "#fff";
  return (
    <svg viewBox="0 0 220 130" style={{ width: 230, height: "auto" }}>
      <path d="M20,118 A90,90 0 0 1 200,118" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="16" strokeLinecap="round" />
      <path d="M20,118 A90,90 0 0 1 200,118" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" strokeDasharray={`${filled} 283`} />
    </svg>
  );
}

// MS is now an alias for MIcon — SVG icons immune to Google Translate
function MS({ children, style }) {
  return <MIcon name={children} style={style} />;
}

function InfoTip({ text, children }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6, cursor: "default", padding: "0 8px", minWidth: 24, minHeight: 24 }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
      aria-label={text}
    >
      {children}
      {/* Hidden until this whole group (label/children + icon) is hovered —
          `children` must be placed INSIDE InfoTip (not as a sibling next to
          it) for that hover area to include the label text, not just the
          tiny icon itself. */}
      <span style={{ width: 20, height: 20, borderRadius: 999, background: "#EFF6FF", border: "1px solid #DDE7F5", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontSize: 12, fontWeight: 700, fontStyle: "italic", fontFamily: "Georgia, 'Times New Roman', serif", opacity: open ? 1 : 0, transition: "opacity .12s ease" }}>
        i
      </span>
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20,
          padding: "10px 12px",
          width: 260,
          background: "#ffffff",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          boxShadow: "0 16px 32px rgba(15,23,42,0.12)",
          font: "500 12px 'Hanken Grotesk'",
          color: "#475569",
          lineHeight: 1.4,
          textAlign: "left",
          whiteSpace: "normal",
        }}>
          {text}
        </div>
      )}
    </span>
  );
}

/* ── Click-to-reveal data tooltip (chart points / bars) ─────────
   Unlike InfoTip (hover, decorative "i" badge), this attaches directly to a
   data element — a chart circle, a bar row — so clicking the actual data
   shows how that number was computed. Positioning is relative to whichever
   wrapper passes `align` ("center" for chart points, "left" for list rows). */
function TipBubble({ text, align = "center" }) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        left: align === "center" ? "50%" : 0,
        transform: align === "center" ? "translateX(-50%)" : "none",
        zIndex: 30,
        padding: "9px 12px",
        minWidth: 190,
        maxWidth: 260,
        background: "#16233C",
        color: "#EAF0FB",
        borderRadius: 10,
        boxShadow: "0 14px 28px -8px rgba(15,23,42,.35)",
        font: "500 11.5px 'Hanken Grotesk'",
        lineHeight: 1.45,
        textAlign: "left",
        whiteSpace: "normal",
        cursor: "default",
      }}
    >
      {text}
    </div>
  );
}

/* ── Notification Bell ───────────────────────────────────────── */
function NotificationBell() {
  const [open, setOpen]         = useState(false);
  const [notifs, setNotifs]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const ref = useRef(null);

  const unread = notifs.filter(n => !n.isRead).length;

  const fetchNotifs = () => {
    setLoading(true);
    api.get("/api/notifications/unread")
      .then(r => setNotifs(r?.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
  }, []);

  // Refresh badge immediately when NotificationProvider finds new items
  useEffect(() => {
    window.addEventListener('app-notification-updated', fetchNotifs);
    return () => window.removeEventListener('app-notification-updated', fetchNotifs);
  }, []);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const markOne = (id) => {
    api.put(`/api/notifications/${id}/read`).catch(() => {});
    setNotifs(prev => prev.map(n => n._id === id || n.id === id ? { ...n, isRead: true } : n));
  };

  const markAll = () => {
    // Was /api/notifications/mark-all-read — real path is /read-all.
    api.post("/api/notifications/read-all").catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const typeIcon = (type) => {
    const t = (type || "").toUpperCase();
    if (t.includes("GRIEVANCE") || t.includes("COMPLAINT")) return "report";
    if (t.includes("ALERT"))   return "warning";
    if (t.includes("EVENT"))   return "event";
    if (t.includes("MESSAGE")) return "chat";
    return "notifications";
  };

  const timeAgo = (iso) => {
    if (!iso) return "";
    // Same fix as Header.jsx's parseNotificationDate: this backend's
    // createdAt values come from Python's datetime.utcnow() — naive but
    // always UTC. A plain `new Date(iso)` on a string with no "Z"/offset is
    // parsed as LOCAL time by the browser, which silently applies the wrong
    // offset (e.g. undercounts elapsed time by 5.5h in IST), making
    // just-created notifications appear hours old. Append "Z" when the
    // string has no timezone marker so it's parsed as UTC.
    const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(iso);
    const diff = Date.now() - new Date(hasTz ? iso : iso + "Z").getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifs(); }}
        style={{ width:44, height:44, background:"#fff", border:`1px solid ${open ? "#2B5BD7" : "#E1E6F0"}`, borderRadius:13, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", cursor:"pointer", outline:"none", flexShrink:0 }}
      >
        <MS style={{ fontSize:21, color: open ? "#2B5BD7" : "#16233C" }}>notifications</MS>
        {unread > 0 && (
          <span style={{ position:"absolute", top:7, right:7, minWidth:16, height:16, borderRadius:8, background:"#C8453A", border:"2px solid #F3F5FA", display:"flex", alignItems:"center", justifyContent:"center", font:"700 9px 'Hanken Grotesk'", color:"#fff", padding:"0 3px" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position:"absolute", top:52, right:0, width:360, background:"#fff", border:"1px solid #E1E6F0", borderRadius:18, boxShadow:"0 16px 40px -12px rgba(20,35,60,.22)", zIndex:200, overflow:"hidden" }}>
          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px 10px", borderBottom:"1px solid #F0F2F7" }}>
            <div style={{ font:"700 14px 'Hanken Grotesk'", color:"#16233C" }}>
              Notifications {unread > 0 && <span style={{ marginLeft:6, background:"#EEF2FF", color:"#2B5BD7", font:"700 11px 'Hanken Grotesk'", padding:"2px 7px", borderRadius:8 }}>{unread} new</span>}
            </div>
            {unread > 0 && (
              <button onClick={markAll} style={{ font:"600 12px 'Hanken Grotesk'", color:"#2B5BD7", background:"none", border:"none", cursor:"pointer", padding:0 }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight:380, overflowY:"auto" }}>
            {loading && notifs.length === 0 ? (
              <div style={{ padding:"32px 18px", textAlign:"center", font:"500 13px 'Hanken Grotesk'", color:"#8590A6" }}>Loading…</div>
            ) : notifs.length === 0 ? (
              <div style={{ padding:"36px 18px", textAlign:"center" }}>
                <MS style={{ fontSize:32, color:"#C5CEDE" }}>notifications_none</MS>
                <div style={{ font:"500 13px 'Hanken Grotesk'", color:"#8590A6", marginTop:8 }}>No notifications yet</div>
              </div>
            ) : notifs.map((n, i) => {
              const id = n._id || n.id;
              const read = n.isRead || n.is_read;
              return (
                <div key={id || i}
                  onClick={() => !read && markOne(id)}
                  style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"13px 18px", borderBottom: i < notifs.length-1 ? "1px solid #F7F8FB" : "none", background: read ? "#fff" : "#F5F8FF", cursor: read ? "default" : "pointer", transition:"background 0.15s" }}
                >
                  <div style={{ width:34, height:34, borderRadius:10, background: read ? "#F0F2F7" : "#EEF2FF", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <MS style={{ fontSize:17, color: read ? "#8590A6" : "#2B5BD7" }}>{typeIcon(n.type)}</MS>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ font:`${read ? "500" : "700"} 13px 'Hanken Grotesk'`, color:"#16233C", marginBottom:2, lineHeight:1.4 }}>{n.title || "Notification"}</div>
                    {n.body && <div style={{ font:"400 12px 'Hanken Grotesk'", color:"#8590A6", lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{n.body}</div>}
                    <div style={{ font:"500 11px 'Hanken Grotesk'", color:"#B0B9CC", marginTop:3 }}>{timeAgo(n.createdAt || n.created_at)}</div>
                  </div>
                  {!read && <span style={{ width:7, height:7, borderRadius:"50%", background:"#2B5BD7", flexShrink:0, marginTop:5 }} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Resident helpers (ported from the old Constituents page) ───────── */
function fmt(n) {
  if (n == null) return "—";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toString();
}

function pctOf(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

const AVATAR_COLORS = ["#2B5BD7", "#1E8A5B", "#6B4FD8", "#C9871F", "#C8453A"];

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

function SegmentRow({ icon, label, count, engPct, color = "#2B5BD7", bg = "#E7EEFF", iconColor = "#2B5BD7" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <MIcon name={icon} style={{ fontSize: 20, color: iconColor }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <InfoTip text={`Residents in ${label} ward with ${engPct}% segment share.`}>
            <span style={{ font: "700 14px 'Hanken Grotesk'", color: "#16233C" }}>{label}</span>
          </InfoTip>
          <InfoTip text={`${fmt(count)} residents in ${label} district, representing ${engPct}% of the total.`}>
            <span style={{ font: "600 13px 'Hanken Grotesk'", color: "#5A6678" }}>
              {fmt(count)} · <span style={{ color: engPct >= 60 ? "#1E7A50" : "#B5781A" }}>{engPct}%</span>
            </span>
          </InfoTip>
        </div>
        <div style={{ height: 7, borderRadius: 5, background: "#EEF1F7" }}>
          <div style={{ width: `${engPct}%`, height: "100%", borderRadius: 5, background: color }} />
        </div>
      </div>
    </div>
  );
}

function FunnelBar({ label, value, total, widthPct, bg, textDark }) {
  // widthPct is deliberately floored (Math.max(pctOf(...), 4-8)) so a 0%
  // stage still renders a visible sliver of bar — that's fine for the bar's
  // WIDTH, but the label was reusing that same floored number as the
  // percentage TEXT, so a genuinely 0% stage (e.g. no one has filed 2+
  // reports yet) displayed the floor value ("6%", "4%") instead of "0%".
  // The label must always reflect the real, unclamped percentage.
  const displayPct = pctOf(value, total);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <InfoTip text={`Out of ${fmt(total)} registered residents, ${fmt(value)} are in the ${label} stage.`}>
          <span style={{ font: "600 13px 'Hanken Grotesk'", color: "#16233C" }}>{label}</span>
        </InfoTip>
        <InfoTip text={`${displayPct}% of the total resident base is in this stage.`}>
          <span style={{ font: "700 13px 'Hanken Grotesk'", color: "#16233C" }}>{fmt(value)}</span>
        </InfoTip>
      </div>
      <div style={{ height: 38, width: `${widthPct}%`, borderRadius: 10, background: bg, display: "flex", alignItems: "center", padding: "0 14px" }}>
        <InfoTip text={`${displayPct}% of total residents are in ${label}.`}>
          <span style={{ font: "700 12px 'Hanken Grotesk'", color: textDark ? "#16233C" : "#fff" }}>{displayPct}%</span>
        </InfoTip>
      </div>
    </div>
  );
}

function KpiCard({ iconBg, iconColor, iconEl, label, value, sub, subGreen, labelTooltip, valueTooltip, subTooltip }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 18, padding: "18px 20px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {/* notranslate prevents GT from wrapping the emoji in <font> and duplicating it */}
          <span className="notranslate" translate="no" style={{ fontSize: 20, color: iconColor, lineHeight: 1, display: "block" }}>{iconEl}</span>
        </div>
        <InfoTip text={labelTooltip || label}>
          <span style={{ font: "600 12px 'Hanken Grotesk','Noto Sans Kannada',sans-serif", color: "#8590A6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
        </InfoTip>
      </div>
      <InfoTip text={valueTooltip || `${label} value`}>
        <div style={{ fontFamily: "'Newsreader','Noto Sans Kannada',serif", fontSize: "clamp(20px,2.5vw,30px)", fontWeight: 400, color: "#16233C", lineHeight: 1.2 }}>{value}</div>
      </InfoTip>
      <InfoTip text={subTooltip || sub}>
        <div style={{ font: "500 12px 'Hanken Grotesk','Noto Sans Kannada',sans-serif", color: subGreen ? "#1E7A50" : "#8590A6", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>
      </InfoTip>
    </div>
  );
}

const KPI = [
  { icon: "task_alt",   iconBg: "#E7EEFF", iconColor: "#2B5BD7", label: "Resolved Complaints",    sparkColor: "#2B5BD7", tooltip: "Resolved Complaints = count of grievances with status RESOLVED during the selected date range." },
  { icon: "bolt",       iconBg: "#E6F4EC", iconColor: "#1E8A5B", label: "Avg. Resolution Time",   sparkColor: "#1E8A5B", tooltip: "Avg. Resolution Time = mean time from complaint creation to resolution for resolved cases in the selected period." },
  { icon: "how_to_vote",iconBg: "#FCF1E0", iconColor: "#C9871F", label: "Events Organized",    sparkColor: "#C9871F", tooltip: "Events Organized = published entries from the Events feature (out of Draft status) plus published Communication Center campaigns of type \"Event\"." },
];

export default function ExecutiveDashboard() {
  const pg       = { background: "#F3F5FA", minHeight: "100vh", fontFamily: "'Hanken Grotesk', sans-serif" };
  const navigate = useNavigate();

  // Ward only exists as a concept for Councillors — MLA/MP representatives
  // are elected from an assembly/parliamentary constituency, not a ward — so
  // the "Ward: —" line under Top Active Citizens only makes sense for a
  // Councillor's dashboard and is hidden for MLA/MP below.
  const repTitle = String(getAuthUser()?.title || getAuthUser()?.rep_type || "").toUpperCase();
  const isCouncillor = repTitle === "COUNCILLOR";

  const [selectedDays, setSelectedDays] = useState(365);
  const [showDateMenu,  setShowDateMenu] = useState(false);
  const dateRef      = useRef(null);
  const dashboardRef = useRef(null);
  const selectedOption = DATE_OPTIONS.find(o => o.days === selectedDays) || DATE_OPTIONS[3];

  useEffect(() => {
    const handler = (e) => { if (dateRef.current && !dateRef.current.contains(e.target)) setShowDateMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Click-to-reveal tooltips on chart points / bars (Grievance Trend, Support by
  // Area, Grievances by Category) — one shared "which tip is open" id so opening
  // a new one closes the previous, and clicking anywhere else closes it too.
  const [activeTip, setActiveTip] = useState(null);
  useEffect(() => {
    const handler = () => setActiveTip(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);
  const toggleTip = (id) => (e) => { e.stopPropagation(); setActiveTip(prev => (prev === id ? null : id)); };

  const { data: insights, loading: insightsLoading } = useMLAInsights(selectedDays);
  const { data: analytics, loading: analyticsLoading } = useAnalytics(selectedDays);
  const { stats: residentStats, loading: residentsLoading, error: residentsError, reload: reloadResidents } = useConstituents(selectedDays);
  const isRefreshing = insightsLoading || analyticsLoading || residentsLoading;

  const sentiment = insights?.publicSentiment || null;
  const byGroup   = insights?.approvalByGroup || null;
  const moving    = insights?.movingNumbers   || null;
  const peers     = insights?.peerRanking     || null;

  // KPI values
  // byStatus keys are the raw grievance status values (Title Case: "Open",
  // "In Progress", "Resolved", ...) — this used to read the ALL-CAPS
  // "RESOLVED" key, which never matched, so "Resolved Complaints" always
  // showed "—" regardless of real data. Same bug already fixed in
  // CareerOutlook.jsx and analytics/service.py; this file had its own
  // separate copy of it.
  const resolved  = analytics?.grievances?.byStatus?.Resolved ?? null;
  const total     = analytics?.grievances?.total ?? null;
  const avgTime   = analytics?.resolutionTime?.avgResolutionTime ?? null;
  const eventsOrganized = analytics?.events?.publishedEvents ?? null;

  // First card: "12/33" — resolved out of total
  const resolvedDisplay = resolved != null
    ? (total != null ? `${resolved}/${total}` : `${resolved}`)
    : "—";

  const KPI_VALUES = [
    { value: resolvedDisplay, trend: analytics?.grievances?.trend },
    { value: avgTime != null ? fmtResolutionTime(avgTime) : "—", trend: null },
    { value: eventsOrganized != null ? eventsOrganized : "—", trend: analytics?.events?.trend },
  ];

  const sentDist = analytics?.sentimentDistribution || null;
  const approvalPct = sentiment?.hasData
    ? sentiment.positive?.pct ?? null
    : (sentDist?.total > 0 ? sentDist.positivePct ?? null : null);
  const approvalResponses = sentiment?.hasData ? sentiment.total : sentDist?.total ?? null;
  const approvalTrend = sentiment?.positiveTrend ?? null;

  // Election probability is computed server-side (mla/sentiment_service.py → /api/mla/insights)
  const electionProb = insights?.electionProbability || {};
  const strongProb   = electionProb.strongReelection ?? null;
  const compProb     = electionProb.competitiveRace  ?? null;
  const atRiskProb   = electionProb.atRisk           ?? null;
  const gaugeLen = approvalPct != null ? Math.round(2.83 * approvalPct) : 0;


  const effectiveSentiment = sentiment?.hasData
    ? sentiment
    : (sentDist?.total > 0 ? {
        hasData: true,
        positive: { pct: sentDist.positivePct ?? 0 },
        neutral:  { pct: sentDist.neutralPct  ?? 0 },
        negative: { pct: sentDist.negativePct  ?? 0 },
        total: sentDist.total,
        positiveTrend: null,
        _fallback: true,
      } : null);

  const dashboardCards = [
    { id: "overview", title: "Grievance Overview", type: "overview", tooltip: "Breakdown of all grievances by current status — New, Assigned, In Progress, and Resolved — for the selected date range." },
    { id: "category", title: "Grievances by Category", type: "category", tooltip: "Grievance volume grouped by category (e.g. Roads, Water, Electricity), showing the top categories for the selected date range." },
  ];

  const categoryStats = analytics?.grievances?.byCategory
    ? Object.entries(analytics.grievances.byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7)
      .map(([label, value]) => ({ label, value }))
    : [];

  // byStatus keys are the RAW values actually written to grievance.status —
  // Title Case with spaces ("Open", "Assigned", "In Progress", "Resolved",
  // "Closed"), set directly in Backend/src/grievances/routes.py (create:
  // "Open" at line 255, assign: "Assigned" at line 611, etc.) — NOT the
  // ALL-CAPS GrievanceStatus enum values (NEW/ASSIGNED/IN_PROGRESS/...) from
  // grievances/model.py, which that enum's create() helper sets but which
  // isn't the code path actually wired to the citizen-facing create route.
  // Reading grievanceStats.NEW/.ASSIGNED/etc. here always returned undefined
  // — which is exactly why every bucket showed 0 while the total (a plain
  // count_documents, unaffected by status casing) showed the real count.
  const grievanceStats = analytics?.grievances?.byStatus || {};
  const totalGrievances = analytics?.grievances?.total ?? 0;
  const overviewItems = [
    { label: "New", value: grievanceStats["Open"] ?? 0, color: "#2563EB" },
    { label: "Assigned", value: grievanceStats["Assigned"] ?? 0, color: "#FBBF24" },
    { label: "In Progress", value: (grievanceStats["In Progress"] ?? 0) + (grievanceStats["On Hold"] ?? 0), color: "#F97316" },
    { label: "Resolved", value: (grievanceStats["Resolved"] ?? 0) + (grievanceStats["Closed"] ?? 0), color: "#22C55E" },
  ];
  const overviewTotal = overviewItems.reduce((sum, item) => sum + item.value, 0);

  /* ── Grievance Trend (Last 6 Months) ─────────────────────────── */
  const trendMonths = analytics?.grievances?.trendSeries?.months || [
    "Dec 2024", "Jan 2025", "Feb 2025", "Mar 2025", "Apr 2025", "May 2025",
  ];
  const trendReceived = analytics?.grievances?.trendSeries?.received || [320, 780, 480, 860, 640, 1150];
  const trendResolved = analytics?.grievances?.trendSeries?.resolved || [160, 600, 260, 700, 520, 980];

  /* ── Citizen Satisfaction Index ──────────────────────────────── */
  // Reuses the same real approval/sentiment figures (effectiveSentiment / approvalPct)
  // already computed above from /api/mla/insights — no mock fallback for the value.
  // The "+X% from last period" delta is only backed by real data when approvalPct is
  // sourced from the AI-sentiment pipeline (sentiment.hasData); the satisfactionRating
  // fallback pipeline has no trend equivalent, so we show nothing rather than a fake number.
  const hasSatisfactionData = approvalPct != null;
  const satisfactionPct = approvalPct ?? 0;
  const satisfactionDelta = (sentiment?.hasData && approvalTrend != null) ? approvalTrend : null;
  const satisfactionLabel = satisfactionPct >= 75 ? "Good" : satisfactionPct >= 50 ? "Fair" : "Needs Attention";
  // Below this many responses, the percentage swings wildly with each new grievance
  // and shouldn't be read as a real signal — flagged in plain language on the card.
  const LOW_SAMPLE_THRESHOLD = 30;
  const satisfactionSampleIsLow = hasSatisfactionData && (approvalResponses ?? 0) < LOW_SAMPLE_THRESHOLD;

  /* ── Resident / constituent data (merged from the old Constituents page) ──
     `verified` is intentionally not surfaced anywhere below: GET
     /api/campaigns/constituents/stats never computes it, so it's always 0 —
     showing it (or a "% profile complete" derived from it) would be a fake
     number, not real data, so that card and sub-label were dropped rather
     than merged in. */
  const residentsTotal = residentStats?.total     ?? 0;
  const active30d      = residentStats?.active30d ?? 0;
  const new30d         = residentStats?.new30d    ?? 0;
  const newPct         = residentStats?.newPct    ?? 0;
  const engaged         = residentStats?.engaged   ?? 0;
  const advocates       = residentStats?.advocates ?? 0;
  const growth          = residentStats?.growth    ?? [];
  const residentGroups  = residentStats?.residentGroups ?? [];
  // Backend calls this topCitizens, not topResidents — same shape
  // (name/initials/mobile/complaints), just a naming mismatch.
  const topResidents = residentStats?.topCitizens ?? residentStats?.topResidents ?? [];

  const { line, area, dots } = buildGrowthPath(growth);
  const growthChartLabels = growthLabels(growth);

  const segments = residentGroups.length > 0
    ? residentGroups.slice(0, 5).map((g, i) => ({
        icon: g.icon || "group",
        label: g.label,
        count: g.count,
        engPct: g.pct,
        color: i < 3 ? "#2B5BD7" : "#C9871F",
        bg:    i < 3 ? "#E7EEFF" : "#FCF1E0",
        iconColor: i < 3 ? "#2B5BD7" : "#C9871F",
      }))
    : [
        { icon: "group",    label: "Families & parents",   count: 0, engPct: 0, color: "#2B5BD7", bg: "#E7EEFF", iconColor: "#2B5BD7" },
        { icon: "place",    label: "Long-term residents",  count: 0, engPct: 0, color: "#2B5BD7", bg: "#E7EEFF", iconColor: "#2B5BD7" },
      ];

  const growthTotal  = growth.reduce((s, g) => s + g.count, 0);
  const priorTotal   = residentsTotal - growthTotal;
  const hasBaseline  = priorTotal > 0;
  const growthPct    = hasBaseline ? Math.round((growthTotal / priorTotal) * 100) : null;

  /* ── Resident search (moved from the topbar of the old Constituents page) ── */
  const [searchQ, setSearchQ]             = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch]       = useState(false);
  const searchRef   = useRef(null);
  const searchTimer = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  /* ── Message a segment (moved from the old Constituents page) ── */
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgWard, setMsgWard]           = useState("");
  const [msgText, setMsgText]           = useState("");
  const [msgSending, setMsgSending]     = useState(false);
  const [msgSent, setMsgSent]           = useState(false);

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

  return (
    <>
      <style>{`@keyframes mla-spin { to { transform: rotate(360deg); } }`}</style>
      {/* Topbar */}
      <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 34px", background:"#F3F5FA", position:"sticky", top:0, zIndex:10, borderBottom:"1px solid #E5E9F1", gap:16, flexWrap:"wrap", minHeight:72 }}>
        <div style={{ flex:1, minWidth:0, maxWidth:"60%" }}>
          <div style={{ font:"500 12px 'Hanken Grotesk','Noto Sans Kannada',sans-serif", color:"#8590A6", marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>Welcome Back, Representative</div>
          <h1 style={{ fontFamily:"'Newsreader','Noto Sans Kannada',serif", fontSize:"clamp(16px,2.2vw,26px)", fontWeight:400, color:"#16233C", margin:0, letterSpacing:"-.01em", lineHeight:1.25, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>Overview &amp; Standing</h1>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", flexShrink:0 }}>

          {isRefreshing && (
            <span style={{ display:"flex", alignItems:"center", gap:6, font:"600 12px 'Hanken Grotesk'", color:"#2B5BD7" }}>
              <MS style={{ fontSize:15, animation:"mla-spin 0.8s linear infinite" }}>sync</MS>
              Updating…
            </span>
          )}

          {/* Resident search */}
          <div ref={searchRef} style={{ position: "relative" }}>
            <div style={{ height: 40, background: "#fff", border: `1px solid ${showSearch ? "#2B5BD7" : "#E1E6F0"}`, borderRadius: 13, display: "flex", alignItems: "center", gap: 9, padding: "0 14px", width: 210, transition: "border-color 0.15s" }}>
              <MIcon name="search" style={{ fontSize: 16, color: "#9AA3B5" }} />
              <input
                value={searchQ}
                onChange={handleSearchChange}
                onFocus={() => setShowSearch(true)}
                placeholder="Find Citizen"
                style={{ border: "none", outline: "none", font: "500 13px 'Hanken Grotesk'", color: "#16233C", background: "transparent", width: "100%" }}
              />
              {searchQ && (
                <button onClick={() => { setSearchQ(""); setSearchResults([]); }} style={{ border: "none", background: "none", cursor: "pointer", color: "#9AA3B5", fontSize: 15, padding: 0, flexShrink: 0 }}>✕</button>
              )}
            </div>
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
          {/* Date filter dropdown */}
          <div ref={dateRef} style={{ position:"relative" }}>
            <button onClick={() => setShowDateMenu(v => !v)}
              style={{ height:40, background:"#fff", border:`1px solid ${showDateMenu?"#2B5BD7":"#E1E6F0"}`, borderRadius:13, display:"flex", alignItems:"center", gap:7, padding:"0 12px", cursor:"pointer", outline:"none", maxWidth:200, overflow:"hidden" }}>
              <MS style={{ fontSize:18, color:"#2B5BD7", flexShrink:0 }}>calendar_month</MS>
              <span style={{ font:"600 13px 'Hanken Grotesk','Noto Sans Kannada',sans-serif", color:"#16233C", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{selectedOption.label}</span>
              <MS style={{ fontSize:18, color:"#9AA3B5", flexShrink:0 }}>{showDateMenu ? "expand_less" : "expand_more"}</MS>
            </button>
            {showDateMenu && (
              <div style={{ position:"absolute", top:50, right:0, background:"#fff", border:"1px solid #E1E6F0", borderRadius:13, boxShadow:"0 8px 24px rgba(20,35,60,.12)", minWidth:180, zIndex:100, overflow:"hidden" }}>
                {DATE_OPTIONS.map(opt => (
                  <button key={opt.days} onClick={() => { setSelectedDays(opt.days); setShowDateMenu(false); }}
                    style={{ display:"block", width:"100%", padding:"11px 16px", textAlign:"left", background: opt.days === selectedDays ? "#EEF2FF" : "transparent",
                      border:"none", font:`${opt.days === selectedDays ? "700" : "500"} 13px 'Hanken Grotesk'`,
                      color: opt.days === selectedDays ? "#2B5BD7" : "#16233C", cursor:"pointer" }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export button */}
          <ExportButton
            filename={`${getRepRolePrefix()}-overview`}
            pdfRef={dashboardRef}
            pdfOrientation="landscape"
            data={[
              { metric: 'Approval Rating',         value: approvalPct != null ? `${approvalPct}%` : '—' },
              { metric: 'Positive Sentiment',      value: effectiveSentiment?.positive?.pct != null ? `${effectiveSentiment.positive.pct}%` : '—' },
              { metric: 'Neutral Sentiment',       value: effectiveSentiment?.neutral?.pct  != null ? `${effectiveSentiment.neutral.pct}%`  : '—' },
              { metric: 'Negative Sentiment',      value: effectiveSentiment?.negative?.pct != null ? `${effectiveSentiment.negative.pct}%` : '—' },
              { metric: 'Strong Re-election',      value: strongProb  != null ? `${strongProb}%`  : '—' },
              { metric: 'Competitive Race',        value: compProb    != null ? `${compProb}%`    : '—' },
              { metric: 'At Risk',                 value: atRiskProb  != null ? `${atRiskProb}%`  : '—' },
              { metric: 'Resolved Grievances',     value: resolved    != null ? String(resolved)  : '—' },
              { metric: 'Total Grievances',        value: total       != null ? String(total)      : '—' },
              { metric: 'Events Organized',        value: eventsOrganized != null ? String(eventsOrganized) : '—' },
              { metric: 'Total Registered Residents', value: fmt(residentsTotal) },
              { metric: 'Active Residents (30d)',  value: fmt(active30d) },
              { metric: 'New Residents (30d)',     value: fmt(new30d) },
              ...residentGroups.slice(0, 10).map(g => ({ metric: g.label, value: String(g.count) })),
            ]}
            columns={[
              { key: 'metric', label: 'Metric' },
              { key: 'value',  label: 'Value'  },
            ]}
          />

          <NotificationBell />

        </div>
      </header>

      {/* Message a segment modal */}
      {showMsgModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(14,22,38,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowMsgModal(false); }}
        >
          <div style={{ width: 480, background: "#fff", borderRadius: 22, boxShadow: "0 24px 60px rgba(14,22,38,0.2)", overflow: "hidden" }}>
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
                <div style={{ marginBottom: 18 }}>
                  <label style={{ font: "600 13px 'Hanken Grotesk'", color: "#16233C", display: "block", marginBottom: 8 }}>Target ward</label>
                  <select
                    value={msgWard}
                    onChange={e => setMsgWard(e.target.value)}
                    style={{ width: "100%", height: 44, borderRadius: 11, border: "1px solid #E1E6F0", padding: "0 14px", font: "500 14px 'Hanken Grotesk'", color: "#16233C", background: "#fff", outline: "none", cursor: "pointer" }}
                  >
                    <option value="">All residents</option>
                    {(residentStats?.wards || []).map(w => (
                      <option key={w.ward} value={w.ward}>{w.ward} ({w.count} residents)</option>
                    ))}
                  </select>
                </div>

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
                    Sending to: <strong style={{ color: "#2B5BD7" }}>{msgWard ? `${residentStats?.wards?.find(w => w.ward === msgWard)?.count ?? "?"} residents in ${msgWard}` : `all ${residentStats?.total ?? ""} residents`}</strong>
                  </div>
                </div>

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

      <div ref={dashboardRef} style={{ ...pg, padding:"28px 34px 40px", display:"flex", flexDirection:"column", gap:20, opacity: isRefreshing ? 0.45 : 1, transition:"opacity 0.25s ease", pointerEvents: isRefreshing ? "none" : "auto" }}>

        {/* Resident data error banner */}
        {residentsError && (
          <div style={{ padding: "12px 18px", background: "#FBEAE8", border: "1px solid #F4C5C2", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ font: "500 13px 'Hanken Grotesk'", color: "#C8453A" }}>{residentsError}</span>
            <button onClick={reloadResidents} style={{ marginLeft: 16, padding: "6px 14px", borderRadius: 8, background: "#C8453A", color: "#fff", border: "none", font: "600 12px 'Hanken Grotesk'", cursor: "pointer" }}>Retry</button>
          </div>
        )}

        {/* KPI strip — grievance / office metrics. Fixed 4-column grid (not
            auto-fit) so all four cards always stay on one line instead of
            wrapping to a second row on narrower screens. */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4, minmax(0, 1fr))", gap:20 }}>
          {KPI.map((k, i) => {
            const kv = KPI_VALUES[i];
            const trendVal = (kv.trend != null && kv.trend !== 0) ? kv.trend : null;
            const trendLabel = trendVal != null ? `${trendVal > 0 ? "↑" : "↓"} ${Math.abs(trendVal)}%` : "—";
            const trendColor = trendVal != null ? (trendVal > 0 ? "#1E8A5B" : "#C8453A") : "#C0C7D4";
            // Sub-label: for complaints card show "out of X total"
            const subLabel = i === 0 && resolved != null && total != null
              ? `${resolved} resolved out of ${total} total`
              : k.label;
            return (
              <div key={k.label} style={{ background:"#fff", border:"1px solid #EAEDF4", borderRadius:18, padding:"18px 20px", boxShadow:"0 14px 30px -22px rgba(20,35,60,.3)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                  <div style={{ width:38, height:38, borderRadius:11, background:k.iconBg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <MS style={{ fontSize:21, color:k.iconColor }}>{k.icon}</MS>
                  </div>
                  <span style={{ font:"600 12px 'Hanken Grotesk'", color:trendColor }}>{trendLabel}</span>
                </div>
                <div style={{ fontFamily:"'Newsreader','Noto Sans Kannada',serif", fontSize:"clamp(18px,2vw,28px)", fontWeight:400, color:"#16233C", lineHeight:1.2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{kv.value}</div>
                {/* overflow/ellipsis moved onto the label <span> itself, not this
                    row — this row also holds InfoTip's absolutely-positioned
                    popup, which `overflow:hidden` here was silently clipping,
                    so the icon showed but its tooltip text never did. */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, font:"500 12px 'Hanken Grotesk','Noto Sans Kannada',sans-serif", color:"#8590A6", marginTop:4 }}>
                  <InfoTip text={k.tooltip}>
                    <span style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{k.label}</span>
                  </InfoTip>
                </div>
                {/* Trend bar — width proportional to value, no fake sparkline */}
                <div style={{ marginTop:12, height:4, borderRadius:3, background:"#F0F2F7", overflow:"hidden" }}>
                  <div style={{
                    height:"100%", borderRadius:3, background: k.sparkColor,
                    width: i === 0 && resolved != null && total != null ? `${Math.min(100, (resolved / total) * 100)}%`
                         : i === 0 && resolved != null ? `${Math.min(100, (resolved / 50) * 100)}%`
                         : i === 2 && eventsOrganized != null ? `${Math.min(100, (eventsOrganized / 20) * 100)}%`
                         : "40%",
                    opacity: 0.5,
                  }} />
                </div>
              </div>
            );
          })}

          {/* Total Registered Citizens — same card markup as the KPI.map cards
              above (icon box + trend top row, big value, label + info tip,
              proportional trend bar) so all four look identical. */}
          {(() => {
            const citizensTrendVal = residentStats && newPct !== 0 ? newPct : null;
            const citizensTrendLabel = citizensTrendVal != null ? `${citizensTrendVal > 0 ? "↑" : "↓"} ${Math.abs(citizensTrendVal)}%` : "—";
            const citizensTrendColor = citizensTrendVal != null ? (citizensTrendVal > 0 ? "#1E8A5B" : "#C8453A") : "#C0C7D4";
            const activeShare = residentStats ? Math.min(100, pctOf(active30d, residentsTotal)) : 0;
            return (
              <div style={{ background:"#fff", border:"1px solid #EAEDF4", borderRadius:18, padding:"18px 20px", boxShadow:"0 14px 30px -22px rgba(20,35,60,.3)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                  <div style={{ width:38, height:38, borderRadius:11, background:"#E7EEFF", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <MS style={{ fontSize:21, color:"#2B5BD7" }}>groups</MS>
                  </div>
                  <span style={{ font:"600 12px 'Hanken Grotesk'", color:citizensTrendColor }}>{citizensTrendLabel}</span>
                </div>
                <div style={{ fontFamily:"'Newsreader','Noto Sans Kannada',serif", fontSize:"clamp(18px,2vw,28px)", fontWeight:400, color:"#16233C", lineHeight:1.2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{residentStats ? fmt(residentsTotal) : "—"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, font:"500 12px 'Hanken Grotesk','Noto Sans Kannada',sans-serif", color:"#8590A6", marginTop:4 }}>
                  <InfoTip text="Total registered residents in your constituency.">
                    <span style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>Total Registered Citizens</span>
                  </InfoTip>
                </div>
                <div style={{ marginTop:12, height:4, borderRadius:3, background:"#F0F2F7", overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:3, background:"#2B5BD7", width:`${activeShare}%`, opacity:0.5 }} />
                </div>
              </div>
            );
          })()}
        </div>

        {/* KPI strip — resident metrics (merged from Constituents; Verified
            Residents dropped as it's never computed, always 0) — Total
            Registered Citizens moved up into the grid above; only the
            commented-out extra resident cards remain here for now. */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:20 }}>
          {/* <KpiCard
            iconBg="#EDEAFB" iconColor="#6B4FD8" iconEl={<MIcon name="bolt" style={{ fontSize: 20, color: "#6B4FD8" }} />}
            label="Active Citizens"
            labelTooltip="Citizens who have engaged with services or filed reports in the last month."
            value={residentStats ? fmt(active30d) : "—"}
            valueTooltip={residentStats ? `${fmt(active30d)} active residents in 30 days` : "No data"}
            sub={`${pctOf(active30d, residentsTotal)}% of registered`}
            subTooltip="Share of the total registered base active in the past month."
            subGreen
          />
          <KpiCard
            iconBg="#FCF1E0" iconColor="#C9871F" iconEl={<MIcon name="person_add" style={{ fontSize: 20, color: "#C9871F" }} />}
            label="New Citizens"
            labelTooltip="Citizens registered in last month"
            value={residentStats ? `${fmt(new30d)}` : "—"}
            valueTooltip={residentStats ? `${fmt(new30d)} new registrations` : "No data"}
            sub={newPct >= 0 ? `+${newPct}% vs. previous month` : `${newPct}% vs. previous month`}
            subTooltip="Month-over-month growth rate for recent registrations."
            subGreen={newPct >= 0}
          /> */}
        </div>


        {/* Row 1: Grievance Trend + Support by Area */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(380px, 1fr))", gap:20 }}>

          {/* Grievance Trend (Last 6 Months) */}
          <div style={{ background:"#fff", borderRadius:22, padding:24, border:"1px solid #EAEDF4", boxShadow:"0 14px 30px -22px rgba(20,35,60,.18)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, flexWrap:"wrap", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <InfoTip text={`Received = grievances created in each calendar month. Resolved = grievances marked RESOLVED or CLOSED in each calendar month (by the date they were resolved, not created). Bucketed to match therange selected above.`}>
                  <div style={{ font:"700 18px 'Hanken Grotesk'", color:"#16233C" }}>Grievance Trend</div>
                </InfoTip>
              </div>
              <div style={{ display:"flex", gap:14 }}>
                <span style={{ display:"flex", alignItems:"center", gap:6, font:"600 12px 'Hanken Grotesk'", color:"#475569" }}>
                  <span style={{ width:10, height:10, borderRadius:999, background:"#2563EB", display:"inline-block" }} /> Received
                </span>
                <span style={{ display:"flex", alignItems:"center", gap:6, font:"600 12px 'Hanken Grotesk'", color:"#475569" }}>
                  <span style={{ width:10, height:10, borderRadius:999, background:"#22C55E", display:"inline-block" }} /> Resolved
                </span>
              </div>
            </div>
            {(() => {
              const W = 480, H = 210, PAD_L = 40, PAD_R = 10, PAD_T = 10, PAD_B = 26;
              const rawMax = Math.max(1, ...trendReceived, ...trendResolved);
              // Round the axis ceiling up to a friendly step so gridlines land on whole numbers
              const step = Math.pow(10, Math.max(0, String(Math.ceil(rawMax)).length - 1));
              const maxV = Math.ceil(rawMax / step) * step || 1;
              // When maxV is small (e.g. 1-4), rounding [0, .25, .5, .75, 1] * maxV
              // to whole numbers collapses several steps onto the same integer
              // (e.g. maxV=1 -> [0,0,1,1,1]) — dedupe so we don't render/key
              // multiple gridlines on top of each other.
              const ticks = [...new Set([0, maxV * 0.25, maxV * 0.5, maxV * 0.75, maxV].map(v => Math.round(v)))];
              const n = trendMonths.length;
              const toX = (i) => PAD_L + (i / (n - 1)) * (W - PAD_L - PAD_R);
              const toY = (v) => H - PAD_B - (v / maxV) * (H - PAD_T - PAD_B);
              const linePath = (arr) => arr.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`).join(" ");
              return (
                <div style={{ background:"#F9FAFC", borderRadius:14, padding:"10px 12px 4px" }}>
                  <div style={{ position:"relative" }}>
                    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:220, overflow:"visible" }}>
                      {ticks.map(t => (
                        <g key={t}>
                          <line x1={PAD_L} x2={W - PAD_R} y1={toY(t)} y2={toY(t)} stroke="#EAEDF4" strokeWidth="1" />
                          <text x={PAD_L - 8} y={toY(t) + 4} textAnchor="end" style={{ font:"500 9px 'Hanken Grotesk'", fill:"#B0B8C9" }}>{t}</text>
                        </g>
                      ))}
                      <path d={linePath(trendReceived)} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                      <path d={linePath(trendResolved)} fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                      {trendReceived.map((v, i) => (
                        <circle key={`r${i}`} cx={toX(i)} cy={toY(v)} r="6" fill="#fff" stroke="#2563EB" strokeWidth="2"
                          style={{ cursor:"pointer" }} onClick={toggleTip(`trend-r-${i}`)} />
                      ))}
                      {trendResolved.map((v, i) => (
                        <circle key={`s${i}`} cx={toX(i)} cy={toY(v)} r="6" fill="#fff" stroke="#22C55E" strokeWidth="2"
                          style={{ cursor:"pointer" }} onClick={toggleTip(`trend-s-${i}`)} />
                      ))}
                    </svg>
                    {trendReceived.map((v, i) => activeTip === `trend-r-${i}` && (
                      <div key={`tr-${i}`} style={{ position:"absolute", left:`${(toX(i)/W)*100}%`, top:`${(toY(v)/H)*100}%` }}>
                        <TipBubble text={`${trendMonths[i]} · Received: ${v} grievance${v !== 1 ? "s" : ""} created this calendar month.`} />
                      </div>
                    ))}
                    {trendResolved.map((v, i) => activeTip === `trend-s-${i}` && (
                      <div key={`ts-${i}`} style={{ position:"absolute", left:`${(toX(i)/W)*100}%`, top:`${(toY(v)/H)*100}%` }}>
                        <TipBubble text={`${trendMonths[i]} · Resolved: ${v} grievance${v !== 1 ? "s" : ""} marked RESOLVED or CLOSED this calendar month (counted by resolution date, not creation date).`} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:2, padding:`0 ${PAD_R}px 0 ${PAD_L}px`, gap:4 }}>
                    {trendMonths.map((m, i) => (
                      <span key={i} title={m} style={{ font:"500 9px 'Hanken Grotesk'", color:"#B0B8C9", whiteSpace:"nowrap" }}>{m.split(" ")[0]}</span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Approval by neighborhood */}
          <div style={{ background:"#fff", border:"1px solid #EAEDF4", borderRadius:22, padding:24, boxShadow:"0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <InfoTip text="Support by Area = approval percentage by area (ward for Councillors, assembly constituency for MLAs, parliamentary constituency for MPs), plotted from low to high on the gradient.">
                  <div style={{ font:"700 16px 'Hanken Grotesk'", color:"#16233C" }}>Support by Area</div>
                </InfoTip>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ font:"500 11px 'Hanken Grotesk'", color:"#8590A6" }}>Low</span>
                <div style={{ width:70, height:8, borderRadius:4, background:"linear-gradient(90deg,#F2D9D5,#C9871F,#2B5BD7,#1B3C8F)" }} />
                <span style={{ font:"500 11px 'Hanken Grotesk'", color:"#8590A6" }}>High</span>
              </div>
            </div>
            <div style={{ font:"500 12px 'Hanken Grotesk'", color:"#8590A6", marginBottom:6 }}>
              {peers?.totalWards ?? 0} area{(peers?.totalWards ?? 0) === 1 ? "" : "s"}
            </div>
            {peers?.hasData && peers.wards?.some(w => (w.total ?? 0) > 0 && (w.total ?? 0) < 5) && (
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:14, padding:"7px 10px", background:"#FEF3E2", border:"1px solid #FBE3B8", borderRadius:9 }}>
                <MS style={{ fontSize:13, color:"#C9871F", flexShrink:0 }}>warning</MS>
                <span style={{ font:"500 10.5px 'Hanken Grotesk'", color:"#92620E", lineHeight:1.35 }}>
                  Areas marked with very few grievances shouldn't be read as a firm approval score yet.
                </span>
              </div>
            )}
            {peers?.hasData ? (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {peers.wards.map((w) => {
                  const pct = w.approvalPct ?? 0;
                  const barColor = pct >= 60 ? "#2B5BD7" : pct >= 40 ? "#C9871F" : "#C8453A";
                  const tipId = `ward-${w.wardId}`;
                  const wardSampleIsLow = (w.total ?? 0) < 5;
                  return (
                    <div key={w.wardId} style={{ position:"relative" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3, alignItems:"center" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <InfoTip text={`Ward ${w.wardName}: ${pct}% approval, ${w.total ?? 0} grievances.`}>
                            <span style={{ font:"600 11px 'Hanken Grotesk'", color:"#16233C" }}>
                              Ward {w.wardName}
                            </span>
                          </InfoTip>
                        </div>
                        <span style={{ font:"700 11px 'Hanken Grotesk'", color: barColor }}>{pct}%</span>
                      </div>
                      <div onClick={toggleTip(tipId)} style={{ height:6, borderRadius:3, background:"#F0F2F7", cursor:"pointer" }}>
                        <div style={{ height:"100%", width:`${pct}%`, borderRadius:3, background: barColor, transition:"width .4s" }} />
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:2 }}>
                        <span style={{ font:"400 10px 'Hanken Grotesk'", color:"#B0B8C9" }}>
                          {w.total} {w.total !== 1 ? "grievances" : "grievance"}
                        </span>
                        {wardSampleIsLow && (
                          <span style={{ font:"600 9px 'Hanken Grotesk'", color:"#C9871F", background:"#FEF3E2", padding:"1px 6px", borderRadius:6 }}>
                            low sample
                          </span>
                        )}
                      </div>
                      {activeTip === tipId && (
                        <TipBubble
                          align="left"
                          text={`Ward ${w.wardName}: ${w.total ?? 0} grievance${(w.total ?? 0) !== 1 ? "s" : ""} recorded in the selected date range. Approval (${pct}%) = share of this ward's AI-sentiment-scored grievances that came back positive.${wardSampleIsLow ? " With this few grievances, treat the % as a rough early signal, not a firm reading." : ""}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:140 }}>
                <span style={{ font:"500 13px 'Hanken Grotesk'", color:"#C0C7D4" }}>No area data</span>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard cards row below Trend and Support */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:20, alignItems:"start" }}>
          {dashboardCards.map(card => {
            if (card.type === "overview") {
              // Full pie (solid wedges from center, percentage labels inside
              // each slice) — not a ring/donut. angle 0 = 12 o'clock, growing
              // clockwise.
              const pieRadius = 70;
              const pieCenter = 80;
              const polarPoint = (angleDeg, r) => {
                const rad = (angleDeg * Math.PI) / 180;
                return { x: pieCenter + r * Math.sin(rad), y: pieCenter - r * Math.cos(rad) };
              };
              const describeWedge = (startAngle, endAngle) => {
                const p1 = polarPoint(startAngle, pieRadius);
                const p2 = polarPoint(endAngle, pieRadius);
                const largeArc = endAngle - startAngle > 180 ? 1 : 0;
                return `M ${pieCenter} ${pieCenter} L ${p1.x} ${p1.y} A ${pieRadius} ${pieRadius} 0 ${largeArc} 1 ${p2.x} ${p2.y} Z`;
              };
              let pieCursor = 0;
              const pieSlices = overviewItems.map((item) => {
                const pct = overviewTotal > 0 ? item.value / overviewTotal : 0;
                const startAngle = pieCursor * 360;
                pieCursor += pct;
                const endAngle = pieCursor * 360;
                const midAngle = (startAngle + endAngle) / 2;
                const labelPos = polarPoint(midAngle, pieRadius * 0.62);
                return { ...item, pct, startAngle, endAngle, labelPos };
              });
              return (
                <div key={card.id} style={{ background: "#fff", borderRadius: 22, padding: 24, border: "1px solid #EAEDF4", boxShadow: "0 14px 30px -22px rgba(20,35,60,.18)" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                    <InfoTip text={card.tooltip}>
                      <div style={{ font:"700 18px 'Hanken Grotesk'", color:"#16233C" }}>{card.title}</div>
                    </InfoTip>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"160px 1fr", gap:24, alignItems:"center" }}>
                    <div style={{ position:"relative", width:160, height:160 }}>
                      <svg viewBox="0 0 160 160" style={{ width:"100%", height:"100%" }}>
                        {overviewTotal > 0 ? (
                          pieSlices.map((slice) => (
                            slice.pct > 0 && (
                              <g key={slice.label}>
                                <path d={describeWedge(slice.startAngle, slice.endAngle)} fill={slice.color} stroke="#fff" strokeWidth="1.5" />
                                {slice.pct >= 0.04 && (
                                  <text x={slice.labelPos.x} y={slice.labelPos.y} textAnchor="middle" dominantBaseline="middle"
                                    style={{ font: "700 13px 'Hanken Grotesk'", fill: "#fff" }}>
                                    {Math.round(slice.pct * 100)}%
                                  </text>
                                )}
                              </g>
                            )
                          ))
                        ) : (
                          <circle cx={pieCenter} cy={pieCenter} r={pieRadius} fill="#EAEDF4" />
                        )}
                      </svg>
                    </div>
                    <div style={{ display:"grid", gap:12 }}>
                      {overviewItems.map(item => (
                        <div key={item.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, font:"600 12px 'Hanken Grotesk'", color:"#475569" }}>
                          <span style={{ display:"inline-flex", alignItems:"center", gap:8, minWidth:120 }}>
                            <span style={{ width:10, height:10, borderRadius:999, background:item.color, display:"inline-block" }} />
                            {item.label}
                          </span>
                          <span>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => navigate("/rep/grievances")} style={{ marginTop:18, width:"100%", height:44, background:"#2563EB", color:"#fff", border:"none", borderRadius:14, font:"700 13px 'Hanken Grotesk'", cursor:"pointer" }}>View All Grievances</button>
                </div>
              );
            }

            if (card.type === "category") {
              const colors = ["#2563EB", "#F59E0B", "#22C55E", "#A855F7", "#EF4444", "#0C4A6E", "#10B981"];
              const maxValue = categoryStats[0]?.value || 1;
              const categoryTotal = categoryStats.reduce((sum, i) => sum + i.value, 0);
              return (
                <div key={card.id} style={{ background: "#fff", borderRadius: 22, padding: 24, border: "1px solid #EAEDF4", boxShadow: "0 14px 30px -22px rgba(20,35,60,.18)" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                    <InfoTip text={card.tooltip}>
                      <div style={{ font:"700 18px 'Hanken Grotesk'", color:"#16233C" }}>{card.title}</div>
                    </InfoTip>
                  </div>
                  {categoryStats.length > 0 ? (
                    <div style={{ display:"grid", gap:14 }}>
                      {categoryStats.map((item, idx) => {
                        const width = Math.round((item.value / maxValue) * 100);
                        const pctOfTotal = categoryTotal > 0 ? Math.round((item.value / categoryTotal) * 100) : 0;
                        const tipId = `cat-${item.label}`;
                        return (
                          <div key={item.label} style={{ position:"relative" }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8, font:"600 12px 'Hanken Grotesk'", color:"#16233C" }}>
                              <span>{item.label}</span>
                              <span>{item.value}</span>
                            </div>
                            <div onClick={toggleTip(tipId)} style={{ height:10, borderRadius:99, background:"#F1F5F9", cursor:"pointer" }}>
                              <div style={{ width:`${width}%`, height:"100%", borderRadius:99, background: colors[idx % colors.length] }} />
                            </div>
                            {activeTip === tipId && (
                              <TipBubble
                                align="left"
                                text={`${item.label}: ${item.value} grievance${item.value !== 1 ? "s" : ""} categorized as "${item.label}" in the selected date range — ${pctOfTotal}% of the ${categoryTotal} categorized grievances shown here.`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:140 }}>
                      <span style={{ font:"500 13px 'Hanken Grotesk'", color:"#C0C7D4" }}>No category data</span>
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Row: Resident Groups + Resident Growth Trend (merged from Constituents) */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>

          <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: "24px 26px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <InfoTip text="Citizen Groups shows how many of your citizens have reported each kind of grievance, and their share of the total base.">
                  <div style={{ font: "700 16px 'Hanken Grotesk'", color: "#16233C" }}>Citizen Groups</div>
                </InfoTip>
                <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginTop: 2 }}>
                  {residentGroups.length > 0 ? "Citizens grouped by grievance category" : "Who makes up your base"}
                </div>
              </div>
              <InfoTip text="Size is citizen count; share is the percentage of total citizens in each group.">
                <span style={{ font: "600 12px 'Hanken Grotesk'", color: "#9AA3B5" }}>Size · Share</span>
              </InfoTip>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {!residentStats
                ? [1, 2, 3].map((i) => <div key={i} style={{ height: 42, background: "#F3F5FA", borderRadius: 10 }} />)
                : segments.map((s) => <SegmentRow key={s.label} {...s} />)
              }
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: "24px 26px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)", display: "flex", flexDirection: "column" }}>
            <InfoTip text={`Citizen Growth Trend shows new registrations within the range selected above, plus the current total base.`} >
              <div style={{ font: "700 16px 'Hanken Grotesk'", color: "#16233C", marginBottom: 3 }}>Citizen Growth Trend</div>
            </InfoTip>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 14 }}>
              <span style={{ font: "400 38px 'Newsreader', Georgia, serif", color: "#16233C", lineHeight: .9 }}>{fmt(residentsTotal)}</span>
              {growthTotal > 0 && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#E6F4EC", color: "#1E7A50", font: "700 12px 'Hanken Grotesk'", padding: "4px 9px", borderRadius: 20, marginBottom: 5 }}>
                  {growthPct !== null ? `↑ ${growthPct}%` : `+${fmt(growthTotal)} this year`}
                </span>
              )}
            </div>

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
              {growthChartLabels.map((l, i) => (
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

        {/* Row: Resident Engagement Journey + Top Active Residents (merged from Constituents) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 20 }}>

          <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: "24px 26px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <InfoTip text="Resident Engagement Journey visualizes the funnel from all registered residents to active users and advocates." >
              <div style={{ font: "700 16px 'Hanken Grotesk'", color: "#16233C", marginBottom: 3 }}>Citizen Engagement Journey</div>
            </InfoTip>
            <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginBottom: 20 }}>How Citizens move from signed-up to advocate</div>
            {residentsLoading
              ? <div style={{ height: 180, background: "#F3F5FA", borderRadius: 10 }} />
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <FunnelBar label="Registered"             value={residentsTotal} total={residentsTotal} widthPct={100}                        bg="#1B3C8F" />
                  <FunnelBar label="Active (filed report)"  value={active30d} total={residentsTotal} widthPct={Math.max(pctOf(active30d, residentsTotal), 8)}  bg="#2B5BD7" />
                  <FunnelBar label="Engaged (2+ reports)"   value={engaged}   total={residentsTotal} widthPct={Math.max(pctOf(engaged, residentsTotal), 6)}    bg="#5C84E0" />
                  <FunnelBar label="Advocates (5+ reports)" value={advocates} total={residentsTotal} widthPct={Math.max(pctOf(advocates, residentsTotal), 4)}  bg="#8FAEEC" textDark />
                </div>
              )
            }
          </div>

          <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: "24px 26px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <InfoTip text="Top Active Citizens highlights the most engaged citizens by recent report activity." >
                  <div style={{ font: "700 16px 'Hanken Grotesk'", color: "#16233C" }}>Top Active Citizens</div>
                </InfoTip>
                <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginTop: 2 }}>Your strongest advocates this quarter</div>
              </div>
              <span
                onClick={() => navigate(ROUTES.mlaCitizenList)}
                style={{ font: "600 13px 'Hanken Grotesk'", color: "#2B5BD7", cursor: "pointer", textDecoration: "none" }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
              >View directory</span>
            </div>

            {residentsLoading ? (
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
                      {isCouncillor && (
                        <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6" }}>Ward: {r.ward || "—"}</div>
                      )}
                    </div>
                    {i === 0 && (
                      <span className="notranslate" translate="no" style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#FCF1E0", color: "#B5781A", font: "700 11px 'Hanken Grotesk'", padding: "4px 10px", borderRadius: 20, flexShrink: 0 }}>
                        🔥 Top Advocate
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

        {/* Row: Citizen Satisfaction */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:20, alignItems:"start" }}>

          {/* Citizen Satisfaction Index */}
          <div style={{ background:"#fff", borderRadius:22, padding:24, border:"1px solid #EAEDF4", boxShadow:"0 14px 30px -22px rgba(20,35,60,.18)", display:"flex", flexDirection:"column", alignItems:"center" }}>
            <InfoTip text="Approval rating computed from AI sentiment analysis of citizen feedback and grievance comments, or overall ratings when sentiment data isn't yet available.">
              <div style={{ font:"700 18px 'Hanken Grotesk'", color:"#16233C", alignSelf:"flex-start", marginBottom:8 }}>Citizen Satisfaction Index</div>
            </InfoTip>
            {hasSatisfactionData ? (
              <>
                <div style={{ position:"relative", width:220, marginTop:10 }}>
                  <svg viewBox="0 0 220 130" style={{ width:"100%", height:"auto" }}>
                    <defs>
                      <linearGradient id="satGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#EF4444" />
                        <stop offset="35%" stopColor="#F59E0B" />
                        <stop offset="65%" stopColor="#FBBF24" />
                        <stop offset="100%" stopColor="#22C55E" />
                      </linearGradient>
                    </defs>
                    <path d="M20,118 A90,90 0 0 1 200,118" fill="none" stroke="url(#satGrad)" strokeWidth="18" strokeLinecap="round" />
                  </svg>
                  <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", paddingTop:20 }}>
                    <div style={{ fontFamily:"'Newsreader','Noto Sans Kannada',serif", fontSize:34, fontWeight:400, color:"#16233C", lineHeight:1 }}>{satisfactionPct}%</div>
                    <div style={{ font:"600 13px 'Hanken Grotesk'", color:"#8590A6", marginTop:4 }}>{satisfactionLabel}</div>
                  </div>
                </div>
                {satisfactionDelta != null && (
                  <div style={{ font:"600 12px 'Hanken Grotesk'", color: satisfactionDelta >= 0 ? "#1E8A5B" : "#C8453A", marginTop:10 }}>
                    {satisfactionDelta >= 0 ? "+" : ""}{satisfactionDelta}% from last period
                  </div>
                )}
                <div style={{ font:"500 11px 'Hanken Grotesk'", color:"#8590A6", marginTop:8, textAlign:"center" }}>
                  Based on {approvalResponses ?? 0} citizen response{(approvalResponses ?? 0) === 1 ? "" : "s"}
                </div>
                {satisfactionSampleIsLow && (
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:10, padding:"8px 12px", background:"#FEF3E2", border:"1px solid #FBE3B8", borderRadius:10, maxWidth:280 }}>
                    <MS style={{ fontSize:14, color:"#C9871F", flexShrink:0 }}>warning</MS>
                    <span style={{ font:"500 11px 'Hanken Grotesk'", color:"#92620E", lineHeight:1.4 }}>
                      Based on very few responses — this number can swing a lot as more come in, so treat it as early signal, not a firm reading.
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:180 }}>
                <span style={{ font:"500 13px 'Hanken Grotesk'", color:"#C0C7D4" }}>No satisfaction data available</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

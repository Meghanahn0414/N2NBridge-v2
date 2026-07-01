import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthRole } from "../../../services/authStorage";
import api from "../../../shared/services/api";
import MIcon from "../../../components/MIcon";
import ExportButton from "../../../components/ExportButton";

const DATE_OPTIONS = [
  { label: "Last 30 Days",  days: 30  },
  { label: "Last 90 Days",  days: 90  },
  { label: "Last 6 Months", days: 180 },
  { label: "Last 12 Months",days: 365 },
];


const INSIGHTS_KEY  = "mla_insights_cache";
const ANALYTICS_KEY = "mla_analytics_cache";

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
      style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "0 8px", minWidth: 24, minHeight: 24 }}
      onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
      tabIndex={0}
      aria-label={text}
    >
      {children}
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
    api.post("/api/notifications/mark-all-read").catch(() => {});
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
    const diff = Date.now() - new Date(iso).getTime();
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

const KPI = [
  { icon: "task_alt",   iconBg: "#E7EEFF", iconColor: "#2B5BD7", label: "Resolved Complaints",    sparkColor: "#2B5BD7", tooltip: "Resolved Complaints = count of grievances with status RESOLVED during the selected date range." },
  { icon: "bolt",       iconBg: "#E6F4EC", iconColor: "#1E8A5B", label: "Avg. Resolution Time",   sparkColor: "#1E8A5B", tooltip: "Avg. Resolution Time = mean time from complaint creation to resolution for resolved cases in the selected period." },
  { icon: "groups",     iconBg: "#EDEAFB", iconColor: "#6B4FD8", label: "Registered Citizens",    sparkColor: "#6B4FD8", tooltip: "Registered Citizens = total number of citizen accounts in the system at the time of reporting." },
  { icon: "how_to_vote",iconBg: "#FCF1E0", iconColor: "#C9871F", label: "Events Organized",    sparkColor: "#C9871F", tooltip: "Events Organized = published entries from the Events feature (out of Draft status) plus published Communication Center campaigns of type \"Event\"." },
];

export default function ExecutiveDashboard() {
  const pg       = { background: "#F3F5FA", minHeight: "100vh", fontFamily: "'Hanken Grotesk', sans-serif" };
  const navigate = useNavigate();

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
  const isRefreshing = insightsLoading || analyticsLoading;

  const sentiment = insights?.publicSentiment || null;
  const byGroup   = insights?.approvalByGroup || null;
  const moving    = insights?.movingNumbers   || null;
  const peers     = insights?.peerRanking     || null;

  // KPI values
  const resolved  = analytics?.grievances?.byStatus?.RESOLVED ?? null;
  const total     = analytics?.grievances?.total ?? null;
  const avgTime   = analytics?.resolutionTime?.avgResolutionTime ?? null;
  const citizens  = analytics?.users?.byRole?.CITIZEN ?? null;
  const eventsOrganized = analytics?.events?.publishedEvents ?? null;

  // First card: "12/33" — resolved out of total
  const resolvedDisplay = resolved != null
    ? (total != null ? `${resolved}/${total}` : `${resolved}`)
    : "—";

  const KPI_VALUES = [
    { value: resolvedDisplay, trend: analytics?.grievances?.trend },
    { value: avgTime != null ? fmtResolutionTime(avgTime) : "—", trend: null },
    { value: citizens  != null ? citizens  : "—", trend: analytics?.users?.trend },
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
    { id: "overview", title: "Grievance Overview", type: "overview" },
    { id: "category", title: "Grievances by Category", type: "category" },
  ];

  const categoryStats = analytics?.grievances?.byCategory
    ? Object.entries(analytics.grievances.byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7)
      .map(([label, value]) => ({ label, value }))
    : [];

  // Bucketed from the real GrievanceStatus enum (NEW, ASSIGNED, IN_PROGRESS,
  // ON_HOLD, RESOLVED, CLOSED, REJECTED) — there is no PENDING/ESCALATED status
  // in the schema, so those mock categories are replaced with real ones below.
  const grievanceStats = analytics?.grievances?.byStatus || {};
  const totalGrievances = analytics?.grievances?.total ?? 0;
  const overviewItems = [
    { label: "New", value: grievanceStats.NEW ?? 0, color: "#2563EB" },
    { label: "Assigned", value: grievanceStats.ASSIGNED ?? 0, color: "#FBBF24" },
    { label: "In Progress", value: (grievanceStats.IN_PROGRESS ?? 0) + (grievanceStats.ON_HOLD ?? 0), color: "#F97316" },
    { label: "Resolved", value: (grievanceStats.RESOLVED ?? 0) + (grievanceStats.CLOSED ?? 0), color: "#22C55E" },
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
            filename="mla-overview"
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
              { metric: 'Citizens',                value: citizens    != null ? String(citizens)   : '—' },
              { metric: 'Events Organized',        value: eventsOrganized != null ? String(eventsOrganized) : '—' },
            ]}
            columns={[
              { key: 'metric', label: 'Metric' },
              { key: 'value',  label: 'Value'  },
            ]}
          />

          <NotificationBell />

        </div>
      </header>

      <div ref={dashboardRef} style={{ ...pg, padding:"28px 34px 40px", display:"flex", flexDirection:"column", gap:20, opacity: isRefreshing ? 0.45 : 1, transition:"opacity 0.25s ease", pointerEvents: isRefreshing ? "none" : "auto" }}>

        {/* KPI strip */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4, minmax(220px, 1fr))", gap:20 }}>
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
                <div style={{ display: "flex", alignItems: "center", gap: 6, font:"500 12px 'Hanken Grotesk','Noto Sans Kannada',sans-serif", color:"#8590A6", marginTop:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  <span>{k.label}</span>
                  <InfoTip text={k.tooltip} />
                </div>
                {/* Trend bar — width proportional to value, no fake sparkline */}
                <div style={{ marginTop:12, height:4, borderRadius:3, background:"#F0F2F7", overflow:"hidden" }}>
                  <div style={{
                    height:"100%", borderRadius:3, background: k.sparkColor,
                    width: i === 0 && resolved != null && total != null ? `${Math.min(100, (resolved / total) * 100)}%`
                         : i === 0 && resolved != null ? `${Math.min(100, (resolved / 50) * 100)}%`
                         : i === 2 && citizens  != null ? `${Math.min(100, (citizens / 100) * 100)}%`
                         : i === 3 && eventsOrganized != null ? `${Math.min(100, (eventsOrganized / 20) * 100)}%`
                         : "40%",
                    opacity: 0.5,
                  }} />
                </div>
              </div>
            );
          })}
        </div>


        {/* Row 1: Grievance Trend + Support by Area */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(380px, 1fr))", gap:20 }}>

          {/* Grievance Trend (Last 6 Months) */}
          <div style={{ background:"#fff", borderRadius:22, padding:24, border:"1px solid #EAEDF4", boxShadow:"0 14px 30px -22px rgba(20,35,60,.18)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, flexWrap:"wrap", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ font:"700 18px 'Hanken Grotesk'", color:"#16233C" }}>Grievance Trend (Last 6 Months)</div>
                <InfoTip text="Received = grievances created in each calendar month. Resolved = grievances marked RESOLVED or CLOSED in each calendar month (by the date they were resolved, not created). Always shows the last 6 calendar months regardless of the date-range filter above." />
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
              const ticks = [0, maxV * 0.25, maxV * 0.5, maxV * 0.75, maxV].map(v => Math.round(v));
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
                <div style={{ font:"700 16px 'Hanken Grotesk'", color:"#16233C" }}>Support by Area</div>
                <InfoTip text="Support by Area = approval percentage by ward area, plotted from low to high on the gradient." />
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ font:"500 11px 'Hanken Grotesk'", color:"#8590A6" }}>Low</span>
                <div style={{ width:70, height:8, borderRadius:4, background:"linear-gradient(90deg,#F2D9D5,#C9871F,#2B5BD7,#1B3C8F)" }} />
                <span style={{ font:"500 11px 'Hanken Grotesk'", color:"#8590A6" }}>High</span>
              </div>
            </div>
            <div style={{ font:"500 12px 'Hanken Grotesk'", color:"#8590A6", marginBottom:6 }}>
              {peers?.totalWards ?? 0} ward areas
            </div>
            {peers?.hasData && peers.wards?.some(w => (w.total ?? 0) > 0 && (w.total ?? 0) < 5) && (
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:14, padding:"7px 10px", background:"#FEF3E2", border:"1px solid #FBE3B8", borderRadius:9 }}>
                <MS style={{ fontSize:13, color:"#C9871F", flexShrink:0 }}>warning</MS>
                <span style={{ font:"500 10.5px 'Hanken Grotesk'", color:"#92620E", lineHeight:1.35 }}>
                  Wards marked with very few grievances shouldn't be read as a firm approval score yet.
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
                          <span style={{ font:"600 11px 'Hanken Grotesk'", color:"#16233C" }}>
                            Ward {w.wardName}
                          </span>
                          <InfoTip text={`Ward ${w.wardName}: ${pct}% approval, ${w.total ?? 0} grievances.`} />
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
              const donutRadius = 64;
              const circumference = 2 * Math.PI * donutRadius;
              let offset = 0;
              return (
                <div key={card.id} style={{ background: "#fff", borderRadius: 22, padding: 24, border: "1px solid #EAEDF4", boxShadow: "0 14px 30px -22px rgba(20,35,60,.18)" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                    <div style={{ font:"700 18px 'Hanken Grotesk'", color:"#16233C" }}>{card.title}</div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"120px 1fr", gap:20, alignItems:"center" }}>
                    <div style={{ position:"relative", width:120, height:120 }}>
                      <svg viewBox="0 0 160 160" style={{ width:"100%", height:"100%" }}>
                        <circle cx="80" cy="80" r="64" fill="#F8FAFD" />
                        {overviewItems.map((item, idx) => {
                          const pct = overviewTotal > 0 ? item.value / overviewTotal : 0;
                          const dash = Math.round(circumference * pct);
                          const dashOffset = Math.round(circumference * (1 - offset));
                          offset += pct;
                          return (
                            <circle key={item.label}
                              cx="80" cy="80" r="64"
                              fill="none" stroke={item.color}
                              strokeWidth="16"
                              strokeDasharray={`${dash} ${circumference - dash}`}
                              strokeDashoffset={dashOffset}
                              transform="rotate(-90 80 80)"
                              strokeLinecap="round"
                            />
                          );
                        })}
                        <circle cx="80" cy="80" r="44" fill="#fff" />
                      </svg>
                      <div style={{ position:"absolute", inset:0, display:"grid", placeItems:"center", font:"700 20px 'Hanken Grotesk'", color:"#16233C" }}>{totalGrievances}</div>
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
                    <div style={{ font:"700 18px 'Hanken Grotesk'", color:"#16233C" }}>{card.title}</div>
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

        {/* Row: Citizen Satisfaction */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:20, alignItems:"start" }}>

          {/* Citizen Satisfaction Index */}
          <div style={{ background:"#fff", borderRadius:22, padding:24, border:"1px solid #EAEDF4", boxShadow:"0 14px 30px -22px rgba(20,35,60,.18)", display:"flex", flexDirection:"column", alignItems:"center" }}>
            <div style={{ font:"700 18px 'Hanken Grotesk'", color:"#16233C", alignSelf:"flex-start", marginBottom:8 }}>Citizen Satisfaction Index</div>
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

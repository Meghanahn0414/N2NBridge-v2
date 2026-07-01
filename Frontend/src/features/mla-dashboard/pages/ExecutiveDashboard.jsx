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

  useEffect(() => {
    Promise.all([
      api.get("/api/mla/insights", { params: { days } }),
      shouldFetchSurvey
        ? api.get("/api/surveys/analytics", { params: { days } }).catch(() => null)
        : Promise.resolve(null),
    ]).then(([insightsRes, surveyRes]) => {
      const insights = insightsRes?.data?.data || insightsRes?.data || null;
      const survey   = surveyRes?.data?.data   || null;
      const merged   = insights ? { ...insights, surveyAnalytics: survey } : null;
      if (merged) writeCache(INSIGHTS_KEY, merged);
      setData(merged);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [days, shouldFetchSurvey]);
  return { data, loading };
}

function useAnalytics(days) {
  const [data, setData] = useState(() => readCache(ANALYTICS_KEY));
  useEffect(() => {
    api.get("/api/analytics/dashboard", { params: { days } })
      .then(r => {
        const fresh = r?.data?.data || r?.data || null;
        if (fresh) writeCache(ANALYTICS_KEY, fresh);
        setData(fresh);
      })
      .catch(() => {});
  }, [days]);
  return data;
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
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen(o => !o)}
      tabIndex={0}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      aria-label={text}
    >
      {children}
      <span style={{ width: 20, height: 20, borderRadius: 999, background: "#EFF6FF", border: "1px solid #DDE7F5", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontSize: 12, fontWeight: 700, opacity: open ? 1 : 0, transition: "opacity .12s ease" }}>
        ?
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
  { icon: "how_to_vote",iconBg: "#FCF1E0", iconColor: "#C9871F", label: "Event Registrations",    sparkColor: "#C9871F", tooltip: "Event Registrations = total citizen event registrations recorded during the selected period." },
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

  const { data: insights } = useMLAInsights(selectedDays);
  const analytics = useAnalytics(selectedDays);

  const sentiment = insights?.publicSentiment || null;
  const byGroup   = insights?.approvalByGroup || null;
  const moving    = insights?.movingNumbers   || null;
  const peers     = insights?.peerRanking     || null;
  const trend     = insights?.sentimentTrend  || null;
  const survey    = insights?.surveyAnalytics || null;

  // KPI values
  const resolved  = analytics?.grievances?.byStatus?.RESOLVED ?? null;
  const total     = analytics?.grievances?.total ?? null;
  const avgTime   = analytics?.resolutionTime?.avgResolutionTime ?? null;
  const citizens  = analytics?.users?.byRole?.CITIZEN ?? null;
  const pollPart  = analytics?.events?.totalRegistrations ?? null;

  // First card: "12/33" — resolved out of total
  const resolvedDisplay = resolved != null
    ? (total != null ? `${resolved}/${total}` : `${resolved}`)
    : "—";

  const KPI_VALUES = [
    { value: resolvedDisplay, trend: analytics?.grievances?.trend },
    { value: avgTime != null ? fmtResolutionTime(avgTime) : "—", trend: null },
    { value: citizens  != null ? citizens  : "—", trend: analytics?.users?.trend },
    { value: pollPart  != null ? pollPart  : "—", trend: analytics?.events?.trend },
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
    { id: "map", title: "Constituency Map", type: "map" },
    { id: "overview", title: "Grievance Overview", type: "overview" },
    { id: "category", title: "Grievances by Category", type: "category" },
    { id: "notifications", title: "Recent Notifications", type: "notifications" },
  ];

  const categoryStats = analytics?.grievances?.byCategory
    ? Object.entries(analytics.grievances.byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7)
      .map(([label, value]) => ({ label, value }))
    : [
      { label: "Water Supply", value: 320 },
      { label: "Roads", value: 278 },
      { label: "Electricity", value: 196 },
      { label: "Healthcare", value: 154 },
      { label: "Education", value: 98 },
      { label: "Pension", value: 76 },
      { label: "Revenue", value: 64 },
    ];

  const grievanceStats = analytics?.grievances?.byStatus || {};
  const totalGrievances = analytics?.grievances?.total ?? 1248;
  const overviewItems = [
    { label: "New", value: grievanceStats.NEW ?? 218, color: "#2563EB" },
    { label: "In Progress", value: grievanceStats.IN_PROGRESS ?? 453, color: "#F97316" },
    { label: "Pending", value: grievanceStats.PENDING ?? 362, color: "#FBBF24" },
    { label: "Resolved", value: grievanceStats.RESOLVED ?? 1067, color: "#22C55E" },
    { label: "Escalated", value: grievanceStats.ESCALATED ?? 67, color: "#EF4444" },
  ];
  const overviewTotal = overviewItems.reduce((sum, item) => sum + item.value, 0);

  const notificationItems = analytics?.notifications?.recent || [
    { title: "High Priority: Water shortage reported in Ward 23, Shantipur", time: "10 mins ago", icon: "warning", color: "#DC2626" },
    { title: "Project \"CC Road - Village Rampur\" is delayed", time: "35 mins ago", icon: "event", color: "#F59E0B" },
    { title: "MGNREGA: 42 new works approved", time: "1 hour ago", icon: "task_alt", color: "#2563EB" },
    { title: "Meeting Reminder: Village Visit to Navagaon on 24 May 2025", time: "2 hours ago", icon: "meeting_room", color: "#16A34A" },
    { title: "Low Fund Utilization Alert in Education Sector", time: "3 hours ago", icon: "school", color: "#8B5CF6" },
  ];

  const mapLegend = [
    { label: "Villages", color: "#16A34A" },
    { label: "Schools", color: "#2563EB" },
    { label: "Hospitals", color: "#7C3AED" },
    { label: "Roads", color: "#F59E0B" },
    { label: "Water Sources", color: "#3B82F6" },
    { label: "Anganwadis", color: "#EF4444" },
    { label: "Other Assets", color: "#64748B" },
  ];

  return (
    <>
      {/* Topbar */}
      <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 34px", background:"#F3F5FA", position:"sticky", top:0, zIndex:10, borderBottom:"1px solid #E5E9F1", gap:16, flexWrap:"wrap", minHeight:72 }}>
        <div style={{ flex:1, minWidth:0, maxWidth:"60%" }}>
          <div style={{ font:"500 12px 'Hanken Grotesk','Noto Sans Kannada',sans-serif", color:"#8590A6", marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>Welcome Back, Representative</div>
          <h1 style={{ fontFamily:"'Newsreader','Noto Sans Kannada',serif", fontSize:"clamp(16px,2.2vw,26px)", fontWeight:400, color:"#16233C", margin:0, letterSpacing:"-.01em", lineHeight:1.25, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>Overview &amp; Standing</h1>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", flexShrink:0 }}>

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
              { metric: 'Poll Participation',      value: pollPart    != null ? String(pollPart)   : '—' },
            ]}
            columns={[
              { key: 'metric', label: 'Metric' },
              { key: 'value',  label: 'Value'  },
            ]}
          />

          <NotificationBell />

        </div>
      </header>

      <div ref={dashboardRef} style={{ ...pg, padding:"28px 34px 40px", display:"flex", flexDirection:"column", gap:20 }}>

        {/* KPI strip */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:20 }}>
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
                         : i === 3 && pollPart  != null ? `${Math.min(100, (pollPart / 200) * 100)}%`
                         : "40%",
                    opacity: 0.5,
                  }} />
                </div>
              </div>
            );
          })}
        </div>


        {/* Row 1: Career trajectory + Election scenarios */}
        <div style={{ display:"grid", gridTemplateColumns:"1.55fr 1fr", gap:20 }}>

          {/* Career trajectory */}
          <div style={{ background:"#fff", border:"1px solid #EAEDF4", borderRadius:22, padding:"26px 28px", boxShadow:"0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22 }}>
              <div>
                <InfoTip text="Trend Over Time = historical approval percentages from sentiment data plus future projections based on current approval and momentum metrics.">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, font: "700 16px 'Hanken Grotesk'", color: "#16233C" }}>
                    <span>Trend Over Time</span>
                  </div>
                </InfoTip>
                <div style={{ font:"500 12px 'Hanken Grotesk'", color:"#8590A6", marginTop:4 }}>Standing projected to the next election</div>
              </div>
              <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#E7EEFF", color:"#2B5BD7", font:"700 12px 'Hanken Grotesk'", padding:"6px 12px", borderRadius:20 }}>
                {survey?.avgScore != null ? `⭐ ${survey.avgScore}/5 survey` : approvalPct != null ? `${approvalPct}% approval` : "—"}
              </span>
            </div>
            {(() => {
              const realPts = trend?.points?.filter(p => p.approvalPct != null) || [];
              const base = approvalPct ?? (realPts.length > 0 ? realPts[realPts.length-1].approvalPct : null);

              if (base == null) {
                return (
                  <div style={{ height:180, display:"flex", alignItems:"center", justifyContent:"center", background:"#F9FAFC", borderRadius:14 }}>
                    <span style={{ font:"500 13px 'Hanken Grotesk'", color:"#C0C7D4" }}>No projection data available</span>
                  </div>
                );
              }

              const now = new Date();
              const fmt = (mOffset) => {
                const d = new Date(now); d.setMonth(d.getMonth() + mOffset);
                return d.toLocaleDateString("en-IN", { month:"short" });
              };

              let timeline;
              if (realPts.length >= 5) {
                timeline = realPts.map(p => ({ label: p.month.split(" ")[0], val: p.approvalPct, proj: false }));
                timeline.push({ label: fmt(+12), val: base, proj: true });
                timeline.push({ label: fmt(+24), val: base, proj: true });
              } else if (realPts.length >= 2) {
                timeline = realPts.map(p => ({ label: p.month.split(" ")[0], val: p.approvalPct, proj: false }));
                timeline.push({ label: fmt(+12), val: base, proj: true });
                timeline.push({ label: fmt(+24), val: base, proj: true });
              } else {
                const hist = realPts.length === 1 ? realPts[0].approvalPct : base;
                timeline = [
                  { label: fmt(-8), val: hist, proj: false },
                  { label: fmt(-4), val: hist, proj: false },
                  { label: "Now",   val: base,  proj: false },
                  { label: fmt(+12),val: base,  proj: true  },
                  { label: fmt(+24),val: base,  proj: true  },
                ];
              }

              const todayIdx = timeline.reduce((acc, p, i) => (!p.proj ? i : acc), 0);
              const W = 560, H = 140, PAD = 12;
              const vals = timeline.map(p => p.val);
              const minV = Math.max(0, Math.min(...vals) - 10);
              const maxV = Math.min(100, Math.max(...vals) + 10);
              const toX = (i) => PAD + (i / (timeline.length - 1)) * (W - PAD * 2);
              const toY = (v) => H - PAD - ((v - minV) / (maxV - minV || 1)) * (H - PAD * 2);

              const solidPath = timeline.slice(0, todayIdx + 1).map((p, i) => `${i===0?"M":"L"}${toX(i)},${toY(p.val)}`).join(" ");
              const dashPath  = timeline.slice(todayIdx).map((p, i) => `${i===0?"M":"L"}${toX(todayIdx+i)},${toY(p.val)}`).join(" ");
              const areaPath  = `${solidPath} L${toX(todayIdx)},${H-PAD} L${toX(0)},${H-PAD} Z`;

              return (
                <div style={{ background:"#F9FAFC", borderRadius:14, padding:"10px 12px 4px", position:"relative" }}>
                  <InfoTip text="Trend graph = past data points from sentiment approval history plus projected future values based on current approval and momentum.">
                    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:160, overflow:"visible" }}>
                      <defs>
                        <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2B5BD7" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#2B5BD7" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {[0,25,50,75,100].map(v => {
                        if (v < minV || v > maxV) return null;
                        return <line key={v} x1={PAD} x2={W-PAD} y1={toY(v)} y2={toY(v)} stroke="#EAEDF4" strokeWidth="1" />;
                      })}
                      <path d={areaPath} fill="url(#tGrad)" />
                      <path d={solidPath} fill="none" stroke="#2B5BD7" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                      {dashPath && <path d={dashPath} fill="none" stroke="#2B5BD7" strokeWidth="2" strokeDasharray="5 4" strokeOpacity="0.45" strokeLinejoin="round" />}
                      {timeline.slice(0, todayIdx + 1).map((p, i) => (
                        <circle key={i} cx={toX(i)} cy={toY(p.val)} r="3.5" fill="#fff" stroke="#2B5BD7" strokeWidth="2" />
                      ))}
                      <line x1={toX(todayIdx)} x2={toX(todayIdx)} y1={PAD} y2={H-PAD} stroke="#2B5BD7" strokeWidth="1.5" strokeDasharray="4 3" />
                    </svg>
                  </InfoTip>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:2, padding:`0 ${PAD}px` }}>
                    {timeline.map((p, i) => (
                      <span key={i} style={{ font:"500 9px 'Hanken Grotesk'",
                        color: i===todayIdx ? "#2B5BD7" : p.proj ? "#D0D5E0" : "#B0B8C9",
                        fontWeight: i===todayIdx ? 700 : 500 }}>
                        {p.label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
              {["Elected", "", "Today", "", "Election"].map((l,i) => (
                <span key={i} style={{ font:`${l==="Today"?"700":"600"} 11px 'Hanken Grotesk'`, color:l==="Today"?"#2B5BD7":"#9AA3B5" }}>{l}</span>
              ))}
            </div>
            <div style={{ display:"flex", gap:12, marginTop:18, paddingTop:18, borderTop:"1px solid #F0F2F7" }}>
              {(() => {
                const now = new Date();
                const campaignDate = new Date(now); campaignDate.setMonth(now.getMonth() + 18);
                const electionDate = new Date(now); electionDate.setMonth(now.getMonth() + 24);
                const fmt = d => d.toLocaleDateString("en-IN", { month:"short", year:"numeric" });
                return [
                  ["#2B5BD7", "Mid-Term Review",
                    survey?.avgScore != null
                      ? `Now · ⭐ ${survey.avgScore}/5 (${survey.totalResponses} responses)`
                      : `Now · ${approvalPct != null ? approvalPct+"% approval" : "—"}`
                  ],
                  ["#C2CADA", "Campaign Opens", fmt(campaignDate)],
                  ["#C2CADA", "Election Day",   fmt(electionDate)],
                ].map(([c,lbl,s]) => (
                  <div key={lbl} style={{ flex:1, display:"flex", gap:10 }}>
                    <span style={{ width:9, height:9, borderRadius:"50%", background:c, marginTop:4, flexShrink:0, display:"block" }} />
                    <div>
                      <div style={{ font:"700 12px 'Hanken Grotesk'", color:"#16233C" }}>{lbl}</div>
                      <div style={{ font:"500 11px 'Hanken Grotesk'", color:"#8590A6" }}>{s}</div>
                    </div>
                  </div>
                ));
              })()}
            </div>
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
            <div style={{ font:"500 12px 'Hanken Grotesk'", color:"#8590A6", marginBottom:18 }}>
              {peers?.totalWards ?? 0} ward areas
            </div>
            {peers?.hasData ? (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {peers.wards.map((w) => {
                  const pct = w.approvalPct ?? 0;
                  const barColor = pct >= 60 ? "#2B5BD7" : pct >= 40 ? "#C9871F" : "#C8453A";
                  return (
                    <div key={w.wardId}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3, alignItems:"center" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ font:"600 11px 'Hanken Grotesk'", color:"#16233C" }}>
                            Ward {w.wardName}
                          </span>
                          <InfoTip text={`Ward ${w.wardName}: ${pct}% approval, ${w.total ?? 0} grievances.`} />
                        </div>
                        <span style={{ font:"700 11px 'Hanken Grotesk'", color: barColor }}>{pct}%</span>
                      </div>
                      <div style={{ height:6, borderRadius:3, background:"#F0F2F7" }}>
                        <div style={{ height:"100%", width:`${pct}%`, borderRadius:3, background: barColor, transition:"width .4s" }} />
                      </div>
                      <div style={{ font:"400 10px 'Hanken Grotesk'", color:"#B0B8C9", marginTop:2 }}>
                        {w.total} {w.total !== 1 ? "grievances" : "grievance"}
                      </div>
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
        <div style={{ display:"grid", gridTemplateColumns:"1.8fr 1fr 1fr 0.95fr", gap:20, alignItems:"start" }}>
          {dashboardCards.map(card => {
            if (card.type === "map") {
              return (
                <div key={card.id} style={{ background: "#fff", borderRadius: 22, padding: 24, border: "1px solid #EAEDF4", boxShadow: "0 14px 30px -22px rgba(20,35,60,.18)" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                    <div style={{ font:"700 18px 'Hanken Grotesk'", color:"#16233C" }}>{card.title}</div>
                  </div>
                  <div style={{ minHeight:260, borderRadius:20, background:"linear-gradient(180deg,#FDFEFF 0%,#EFF6FF 100%)", border:"1px solid #E5E9F1", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", inset:0, background:"url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=400 height=250 viewBox=\'0 0 400 250\'%3E%3Crect width=400 height=250 fill=%23F8FAFD/%3E%3Cpath d=\'M15 110C55 90 120 80 165 90C200 100 240 95 297 115C325 125 368 135 385 147\' stroke=%23D6E4FF stroke-width=8 fill=none/%3E%3Cpath d=\'M40 175C84 160 130 135 180 146C221 154 260 165 315 149\' stroke=%23E2E8F0 stroke-width=8 fill=none/%3E%3C/svg%3E') center/cover", opacity:0.85 }} />
                    <div style={{ position:"absolute", top:36, left:32, width:18, height:18, borderRadius:999, background:"#16A34A", boxShadow:"0 0 0 6px rgba(22,163,74,.18)" }} />
                    <div style={{ position:"absolute", top:80, left:120, width:18, height:18, borderRadius:999, background:"#2563EB", boxShadow:"0 0 0 6px rgba(37,99,235,.18)" }} />
                    <div style={{ position:"absolute", top:130, left:210, width:18, height:18, borderRadius:999, background:"#7C3AED", boxShadow:"0 0 0 6px rgba(124,58,237,.18)" }} />
                    <div style={{ position:"absolute", top:52, right:40, width:18, height:18, borderRadius:999, background:"#EF4444", boxShadow:"0 0 0 6px rgba(239,68,68,.18)" }} />
                    <div style={{ position:"absolute", bottom:34, right:100, width:18, height:18, borderRadius:999, background:"#F59E0B", boxShadow:"0 0 0 6px rgba(245,158,11,.18)" }} />
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:10, marginTop:18, font:"500 11px 'Hanken Grotesk'", color:"#475569" }}>
                    {mapLegend.map(item => (
                      <div key={item.label} style={{ display:"flex", alignItems:"center", gap:8, minWidth:0, overflow:"hidden" }}>
                        <span style={{ width:10, height:10, borderRadius:999, background:item.color, flexShrink:0 }} />
                        <span style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

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
                          const pct = item.value / overviewTotal;
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
                  <button style={{ marginTop:18, width:"100%", height:44, background:"#2563EB", color:"#fff", border:"none", borderRadius:14, font:"700 13px 'Hanken Grotesk'", cursor:"pointer" }}>View All Grievances</button>
                </div>
              );
            }

            if (card.type === "category") {
              const colors = ["#2563EB", "#F59E0B", "#22C55E", "#A855F7", "#EF4444", "#0C4A6E", "#10B981"];
              const maxValue = categoryStats[0]?.value || 1;
              return (
                <div key={card.id} style={{ background: "#fff", borderRadius: 22, padding: 24, border: "1px solid #EAEDF4", boxShadow: "0 14px 30px -22px rgba(20,35,60,.18)" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                    <div style={{ font:"700 18px 'Hanken Grotesk'", color:"#16233C" }}>{card.title}</div>
                  </div>
                  <div style={{ display:"grid", gap:14 }}>
                    {categoryStats.map((item, idx) => {
                      const width = Math.round((item.value / maxValue) * 100);
                      return (
                        <div key={item.label}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8, font:"600 12px 'Hanken Grotesk'", color:"#16233C" }}>
                            <span>{item.label}</span>
                            <span>{item.value}</span>
                          </div>
                          <div style={{ height:10, borderRadius:99, background:"#F1F5F9" }}>
                            <div style={{ width:`${width}%`, height:"100%", borderRadius:99, background: colors[idx % colors.length] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return (
              <div key={card.id} style={{ background: "#fff", borderRadius: 22, padding: 24, border: "1px solid #EAEDF4", boxShadow: "0 14px 30px -22px rgba(20,35,60,.18)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                  <div style={{ font:"700 18px 'Hanken Grotesk'", color:"#16233C" }}>{card.title}</div>
                  <button style={{ font:"600 12px 'Hanken Grotesk'", color:"#2563EB", background:"transparent", border:"none", cursor:"pointer" }}>View All</button>
                </div>
                <div style={{ display:"grid", gap:16 }}>
                  {notificationItems.map((note, idx) => (
                    <div key={idx} style={{ display:"flex", alignItems:"flex-start", gap:12, paddingBottom: idx < notificationItems.length-1 ? 14 : 0, borderBottom: idx < notificationItems.length-1 ? "1px solid #F0F2F7" : "none" }}>
                      <div style={{ width:34, height:34, borderRadius:14, background:"#F8FAFD", display:"grid", placeItems:"center", color:note.color }}>
                        <MS style={{ fontSize:18 }}>{note.icon}</MS>
                      </div>
                      <div>
                        <div style={{ font:"600 13px 'Hanken Grotesk'", color:"#16233C", marginBottom:4 }}>{note.title}</div>
                        <div style={{ font:"500 11px 'Hanken Grotesk'", color:"#6B7280" }}>{note.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

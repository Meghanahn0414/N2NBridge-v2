import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthRole } from "../../../services/authStorage";
import api from "../../../shared/services/api";
import MIcon from "../../../components/MIcon";

const DATE_OPTIONS = [
  { label: "Last 30 Days",  days: 30  },
  { label: "Last 90 Days",  days: 90  },
  { label: "Last 6 Months", days: 180 },
  { label: "Last 12 Months",days: 365 },
];

const KPI = [
  { icon: "task_alt",    iconBg: "#E7EEFF", iconColor: "#2B5BD7", label: "Complaints Resolved", sparkColor: "#2B5BD7" },
  { icon: "bolt",        iconBg: "#E6F4EC", iconColor: "#1E8A5B", label: "Avg Response Time",   sparkColor: "#1E8A5B" },
  { icon: "groups",      iconBg: "#EDEAFB", iconColor: "#6B4FD8", label: "Engaged Constituents",sparkColor: "#6B4FD8" },
  { icon: "how_to_vote", iconBg: "#FCF1E0", iconColor: "#C9871F", label: "Poll Participation",  sparkColor: "#C9871F" },
];

function useMLAInsights(days) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const role = getAuthRole();
  const shouldFetchSurvey = role === "ADMIN" || role === "MLA";

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/api/mla/insights", { params: { days } }),
      shouldFetchSurvey
        ? api.get("/api/surveys/analytics", { params: { days } }).catch(() => null)
        : Promise.resolve(null),
    ]).then(([insightsRes, surveyRes]) => {
      const insights = insightsRes?.data?.data || insightsRes?.data || null;
      const survey   = surveyRes?.data?.data   || null;
      setData(insights ? { ...insights, surveyAnalytics: survey } : null);
    }).catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [days, shouldFetchSurvey]);
  return { data, loading };
}

function useAnalytics(days) {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get("/api/analytics/dashboard", { params: { days } })
      .then(r => setData(r?.data?.data || r?.data || null))
      .catch(() => setData(null));
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

const KPI = [
  { icon: "task_alt",   iconBg: "#E7EEFF", iconColor: "#2B5BD7", label: "People Surveyed",     sparkColor: "#2B5BD7" },
  { icon: "bolt",       iconBg: "#E6F4EC", iconColor: "#1E8A5B", label: "Average Time Spent",   sparkColor: "#1E8A5B" },
  { icon: "groups",     iconBg: "#EDEAFB", iconColor: "#6B4FD8", label: "People Participating", sparkColor: "#6B4FD8" },
  { icon: "how_to_vote",iconBg: "#FCF1E0", iconColor: "#C9871F", label: "Poll Participation Rate",   sparkColor: "#C9871F" },
];

export default function ExecutiveDashboard() {
  const pg       = { background: "#F3F5FA", minHeight: "100vh", fontFamily: "'Hanken Grotesk', sans-serif" };
  const navigate = useNavigate();

  const [selectedDays, setSelectedDays] = useState(365);
  const [showDateMenu,  setShowDateMenu] = useState(false);
  const dateRef      = useRef(null);
  const dashboardRef = useRef(null);
  const [exporting, setExporting] = useState(false);
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

  const Φ = (z) => {
    const s = z < 0 ? -1 : 1, x = Math.abs(z);
    const t2 = 1 / (1 + 0.3275911 * x);
    const p = t2 * (0.254829592 + t2 * (-0.284496736 + t2 * (1.421413741 + t2 * (-1.453152027 + t2 * 1.061405429))));
    return 0.5 + s * 0.5 * (1 - p * Math.exp(-x * x / 2));
  };

  let strongProb = null, compProb = null, atRiskProb = null;
  if (approvalPct != null) {
    const σ = 15;
    const voteShare = Math.max(5, Math.min(95, 0.5 * approvalPct + 25 - 5));
    const pStrong = (1 - Φ((55 - voteShare) / σ)) * 100;
    const pLoss   = Φ((45 - voteShare) / σ)         * 100;
    strongProb = Math.max(1, Math.round(pStrong));
    atRiskProb = Math.max(1, Math.round(pLoss));
    compProb   = Math.max(1, 100 - strongProb - atRiskProb);
  }
  const gaugeLen = approvalPct != null ? Math.round(2.83 * approvalPct) : 0;

  const handleExport = async () => {
    if (exporting) return;
    const el = dashboardRef.current;
    if (!el || !window.html2canvas || !window.jspdf) return;
    setExporting(true);
    try {
      const canvas = await window.html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#F3F5FA", logging: false });
      const { jsPDF } = window.jspdf;
      const pdf   = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const W     = pdf.internal.pageSize.getWidth();
      const H     = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      const pdfH  = W / ratio;
      const pages = Math.ceil(pdfH / H);
      for (let i = 0; i < pages; i++) {
        if (i > 0) pdf.addPage();
        const srcY   = i * (canvas.height / pages);
        const sliceH = canvas.height / pages;
        const sc = document.createElement("canvas");
        sc.width = canvas.width; sc.height = sliceH;
        sc.getContext("2d").drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        pdf.addImage(sc.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, W, H);
      }
      pdf.save(`mla-dashboard-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error("PDF export failed:", e);
    } finally {
      setExporting(false);
    }
  };

  const effectiveSentiment = sentiment?.hasData
    ? sentiment
    : (sentDist?.total > 0 ? {
        hasData: true,
        positive: { pct: sentDist.positivePct ?? 0 },
        neutral:  { pct: sentDist.neutralPct  ?? 0 },
        negative: { pct: sentDist.negativePct ?? 0 },
        total: sentDist.total,
        positiveTrend: null,
        _fallback: true,
      } : null);

  return (
    <>
      {/* Topbar */}
      <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 34px", background:"#F3F5FA", position:"sticky", top:0, zIndex:10, borderBottom:"1px solid #E5E9F1", gap:16, flexWrap:"wrap", minHeight:72 }}>
        <div style={{ flex:1, minWidth:0, maxWidth:"60%" }}>
          <div style={{ font:"500 12px 'Hanken Grotesk','Noto Sans Kannada',sans-serif", color:"#8590A6", marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>Welcome back, Representative</div>
          <h1 style={{ fontFamily:"'Newsreader','Noto Sans Kannada',serif", fontSize:"clamp(16px,2.2vw,26px)", fontWeight:400, color:"#16233C", margin:0, letterSpacing:"-.01em", lineHeight:1.25, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>Overview &amp; standing</h1>
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
          <button onClick={handleExport} disabled={exporting}
            style={{ height:40, background: exporting ? "#F3F5FA" : "#fff", border:"1px solid #E1E6F0", borderRadius:13, display:"flex", alignItems:"center", gap:7, padding:"0 12px", cursor: exporting ? "not-allowed" : "pointer", outline:"none", opacity: exporting ? 0.7 : 1, maxWidth:140, overflow:"hidden" }}>
            <MS style={{ fontSize:18, color:"#5A6678", flexShrink:0 }}>{exporting ? "hourglass_top" : "ios_share"}</MS>
            <span style={{ font:"600 13px 'Hanken Grotesk','Noto Sans Kannada',sans-serif", color:"#16233C", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{exporting ? "Exporting…" : "Export"}</span>
          </button>

          {/* Notifications button */}
          <button onClick={() => navigate("/rep/daily-briefing")}
            style={{ width:44, height:44, background:"#fff", border:"1px solid #E1E6F0", borderRadius:13, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", cursor:"pointer", outline:"none" }}>
            <MS style={{ fontSize:21, color:"#16233C" }}>notifications</MS>
            {(analytics?.alerts?.unread ?? 0) > 0 && (
              <span style={{ position:"absolute", top:10, right:11, width:8, height:8, borderRadius:"50%", background:"#C8453A", border:"1.5px solid #fff" }} />
            )}
          </button>

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
                <div style={{ font:"500 12px 'Hanken Grotesk','Noto Sans Kannada',sans-serif", color:"#8590A6", marginTop:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{k.label}</div>
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
                <div style={{ font:"700 16px 'Hanken Grotesk'", color:"#16233C" }}>Trend Over Time</div>
                <div style={{ font:"500 12px 'Hanken Grotesk'", color:"#8590A6" }}>Standing projected to the next election</div>
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

          {/* Election scenarios */}
          <div style={{ background:"#fff", border:"1px solid #EAEDF4", borderRadius:22, padding:24, boxShadow:"0 14px 30px -22px rgba(20,35,60,.3)", display:"flex", flexDirection:"column" }}>
            <div style={{ font:"700 16px 'Hanken Grotesk'", color:"#16233C", marginBottom:4 }}>Winning Chances</div>
            <div style={{ font:"500 12px 'Hanken Grotesk'", color:"#8590A6", marginBottom:18 }}>Modeled on current momentum</div>
            <div style={{ display:"flex", flexDirection:"column", gap:11, flex:1 }}>
              {[
                { icon:"verified", iconC:"#1E8A5B", border:"#2B5BD7", bg:"#F5F8FF", label:"Strong Re-election", glow:true,  prob: strongProb, barColor:"#2B5BD7" },
                { icon:"balance",  iconC:"#C9871F", border:"#EEF1F7", bg:"#fff",    label:"Competitive Race",  glow:false, prob: compProb,   barColor:"#C9871F" },
                { icon:"warning",  iconC:"#C8453A", border:"#EEF1F7", bg:"#fff",    label:"At Risk",           glow:false, prob: atRiskProb, barColor:"#C8453A" },
              ].map(s => (
                <div key={s.label} style={{ border:`${s.glow?"1.5":"1"}px solid ${s.border}`, background:s.bg, borderRadius:15, padding:"15px 16px", ...(s.glow?{boxShadow:"0 0 0 3px rgba(43,91,215,.06)"}:{}) }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                    <span style={{ display:"flex", alignItems:"center", gap:7, font:"700 14px 'Hanken Grotesk'", color:"#16233C" }}>
                      <MIcon name={s.icon} style={{ fontSize:19, color:s.iconC }} />
                      {s.label}
                    </span>
                    <span style={{ font:"400 22px 'Newsreader'", color:s.glow?"#2B5BD7":s.iconC }}>
                      {s.prob != null ? `${s.prob}%` : "—"}
                    </span>
                  </div>
                  <div style={{ height:6, borderRadius:4, background:"#E1E6F0", overflow:"hidden" }}>
                    {s.prob != null && <div style={{ width:`${s.prob}%`, height:"100%", borderRadius:4, background:s.barColor }} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Public sentiment + Approval by group + What's moving your numbers */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20 }}>

          {/* Public sentiment */}
          <div style={{ background:"#fff", border:"1px solid #EAEDF4", borderRadius:22, padding:24, boxShadow:"0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ font:"700 16px 'Hanken Grotesk'", color:"#16233C", marginBottom:4 }}>Public Opinion</div>
            <div style={{ font:"500 12px 'Hanken Grotesk'", color:"#8590A6", marginBottom:20 }}>
              {effectiveSentiment?._fallback ? "From satisfaction ratings" : "From comments & grievances"}
            </div>
            {effectiveSentiment?.hasData ? (
              <>
                <div style={{ display:"flex", height:14, borderRadius:8, overflow:"hidden", marginBottom:20 }}>
                  <div style={{ width:`${effectiveSentiment.positive.pct}%`, background:"#1E8A5B" }} />
                  <div style={{ width:`${effectiveSentiment.neutral.pct}%`,  background:"#C9871F" }} />
                  <div style={{ width:`${effectiveSentiment.negative.pct}%`, background:"#C8453A" }} />
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {[
                    ["#1E8A5B", "Positive", effectiveSentiment.positive.pct],
                    ["#C9871F", "Neutral",  effectiveSentiment.neutral.pct],
                    ["#C8453A", "Negative", effectiveSentiment.negative.pct],
                  ].map(([c,l,pct]) => (
                    <div key={l} style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ width:11, height:11, borderRadius:3, background:c, flexShrink:0 }} />
                      <span style={{ flex:1, font:"600 14px 'Hanken Grotesk'", color:"#16233C" }}>{l}</span>
                      <span style={{ font:"700 15px 'Hanken Grotesk'", color:"#16233C" }}>{pct}%</span>
                    </div>
                  ))}
                </div>
                {effectiveSentiment.positiveTrend != null && (
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginTop:20, paddingTop:16, borderTop:"1px solid #F0F2F7" }}>
                    <MS style={{ fontSize:18, color: effectiveSentiment.positiveTrend >= 0 ? "#1E8A5B" : "#C8453A" }}>
                      {effectiveSentiment.positiveTrend >= 0 ? "arrow_upward" : "arrow_downward"}
                    </MS>
                    <span style={{ font:"500 12px 'Hanken Grotesk'", color:"#5A6678" }}>
                      {effectiveSentiment.positiveTrend >= 0
                        ? `Positive sentiment up ${Math.abs(effectiveSentiment.positiveTrend)}% vs last period`
                        : `Positive sentiment down ${Math.abs(effectiveSentiment.positiveTrend)}% vs last period`}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ display:"flex", height:14, borderRadius:8, overflow:"hidden", marginBottom:20, background:"#F0F2F7" }} />
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {[["#1E8A5B","Positive"],["#C9871F","Neutral"],["#C8453A","Negative"]].map(([c,l]) => (
                    <div key={l} style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ width:11, height:11, borderRadius:3, background:c, flexShrink:0 }} />
                      <span style={{ flex:1, font:"600 14px 'Hanken Grotesk'", color:"#16233C" }}>{l}</span>
                      <span style={{ font:"700 15px 'Hanken Grotesk'", color:"#C0C7D4" }}>—</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Approval by group */}
          <div style={{ background:"#fff", border:"1px solid #EAEDF4", borderRadius:22, padding:24, boxShadow:"0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ font:"700 16px 'Hanken Grotesk'", color:"#16233C", marginBottom:4 }}>Support by Age Group</div>
            <div style={{ font:"500 12px 'Hanken Grotesk'", color:"#8590A6", marginBottom:20 }}>Where your support is strongest</div>
            <div style={{ display:"flex", flexDirection:"column", gap:17 }}>
              {(byGroup?.groups || [
                {label:"18–29"}, {label:"30–44"}, {label:"45–59"}, {label:"60+"}
              ]).map(g => {
                const pct = g.approvalPct;
                const hasVal = pct != null;
                const color = hasVal ? pct >= 65 ? "#2B5BD7" : pct >= 50 ? "#C9871F" : "#C8453A" : null;
                return (
                  <div key={g.label}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ font:"600 13px 'Hanken Grotesk'", color:"#16233C" }}>{g.label}</span>
                      <span style={{ font:"700 13px 'Hanken Grotesk'", color: hasVal ? color : "#C0C7D4" }}>
                        {hasVal ? `${pct}%` : "—"}
                      </span>
                    </div>
                    <div style={{ height:8, borderRadius:5, background:"#EEF1F7", overflow:"hidden" }}>
                      {hasVal && <div style={{ width:`${pct}%`, height:"100%", borderRadius:5, background:color }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* What's moving your numbers */}
          <div style={{ background:"#fff", border:"1px solid #EAEDF4", borderRadius:22, padding:24, boxShadow:"0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ font:"700 16px 'Hanken Grotesk'", color:"#16233C", marginBottom:4 }}>Top Issues Affecting Public Opinion</div>
            <div style={{ font:"500 12px 'Hanken Grotesk'", color:"#8590A6", marginBottom:18 }}>Issues with the biggest impact</div>
            {moving?.hasData ? (
              <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
                {moving.drivers.map((d, i) => {
                  const pos = d.impact >= 0;
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:38, height:38, flexShrink:0, borderRadius:11, background: pos?"#E6F4EC":"#FBEAE8", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <MS style={{ fontSize:20, color: pos?"#1E8A5B":"#C8453A" }}>{d.icon}</MS>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ font:"700 13px 'Hanken Grotesk'", color:"#16233C", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{d.label}</div>
                        <div style={{ font:"500 11px 'Hanken Grotesk'", color:"#8590A6" }}>{d.sub}</div>
                      </div>
                      <span style={{ font:"700 14px 'Hanken Grotesk'", color: pos?"#1E8A5B":"#C8453A", flexShrink:0 }}>
                        {pos ? "+" : ""}{d.impact}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", minHeight:160 }}>
                <span style={{ font:"500 13px 'Hanken Grotesk'", color:"#C0C7D4" }}>No data available</span>
              </div>
            )}
          </div>
        </div>

        {/* Row 2.5: Standing vs. peers + Approval by neighborhood */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1.55fr", gap:20 }}>

          {/* Standing vs. peers */}
          <div style={{ background:"#fff", border:"1px solid #EAEDF4", borderRadius:22, padding:24, boxShadow:"0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ font:"700 16px 'Hanken Grotesk'", color:"#16233C", marginBottom:4 }}>Compared to Other Wards</div>
            <div style={{ font:"500 12px 'Hanken Grotesk'", color:"#8590A6", marginBottom:18 }}>Approval rank among wards</div>
            {peers?.hasData ? (
              peers.totalWards === 1 ? (
                <>
                  <div style={{ display:"flex", alignItems:"flex-end", gap:8, marginBottom:8 }}>
                    <span style={{ font:"400 46px 'Newsreader'", color:"#2B5BD7", lineHeight:.9 }}>#1</span>
                    <span style={{ font:"500 13px 'Hanken Grotesk'", color:"#8590A6", paddingBottom:6 }}>of 1 ward</span>
                  </div>
                  <div style={{ font:"500 12px 'Hanken Grotesk'", color:"#C0C7D4" }}>Only ward in the system</div>
                </>
              ) : (
                <>
                  <div style={{ display:"flex", alignItems:"flex-end", gap:8, marginBottom:16 }}>
                    <span style={{ font:"400 46px 'Newsreader'", color:"#2B5BD7", lineHeight:.9 }}>#{peers.wards[0]?.rank ?? "—"}</span>
                    <span style={{ font:"500 13px 'Hanken Grotesk'", color:"#8590A6", paddingBottom:6 }}>of {peers.totalWards} wards</span>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {peers.wards.slice(0, 4).map((w) => {
                      const barColor = w.rank === 1 ? "#2B5BD7" : w.approvalPct >= 50 ? "#1E8A5B" : "#C9871F";
                      return (
                        <div key={w.wardId}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                            <span style={{ font:"600 11px 'Hanken Grotesk'", color:"#16233C" }}>#{w.rank} {w.wardName}</span>
                            <span style={{ font:"600 11px 'Hanken Grotesk'", color: barColor }}>{w.approvalPct}%</span>
                          </div>
                          <div style={{ height:5, borderRadius:3, background:"#F0F2F7" }}>
                            <div style={{ height:"100%", width:`${w.approvalPct}%`, borderRadius:3, background: barColor }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )
            ) : (
              <>
                <div style={{ display:"flex", alignItems:"flex-end", gap:14, marginBottom:20 }}>
                  <span style={{ font:"400 46px 'Newsreader'", color:"#2B5BD7", lineHeight:.9 }}>—</span>
                </div>
                <div style={{ font:"500 13px 'Hanken Grotesk'", color:"#C0C7D4" }}>No peer data available</div>
              </>
            )}
          </div>

          {/* Approval by neighborhood */}
          <div style={{ background:"#fff", border:"1px solid #EAEDF4", borderRadius:22, padding:24, boxShadow:"0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
              <div style={{ font:"700 16px 'Hanken Grotesk'", color:"#16233C" }}>Support by Area</div>
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
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                        <span style={{ font:"600 11px 'Hanken Grotesk'", color:"#16233C" }}>
                          Ward {w.wardName}
                        </span>
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

        {/* Row 3: Overall Approval + Re-election Outlook */}
        <div style={{ display:"grid", gridTemplateColumns:"1.55fr 1fr", gap:20 }}>

          {/* Overall Approval Rating */}
          <div style={{ background:"#fff", border:"1px solid #EAEDF4", borderRadius:22, padding:"26px 28px", boxShadow:"0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:18 }}>
              <div>
                <div style={{ font:"600 13px 'Hanken Grotesk'", color:"#8590A6", textTransform:"uppercase", letterSpacing:".05em", marginBottom:10 }}>Your Approval Score</div>
                <div style={{ display:"flex", alignItems:"flex-end", gap:14 }}>
                  <span style={{ font:"400 60px 'Newsreader'", color:"#16233C", lineHeight:.9, letterSpacing:"-.02em" }}>
                    {approvalPct != null ? `${Math.round(approvalPct)}%` : "—"}
                  </span>
                  {approvalTrend != null && (
                    <span style={{ display:"inline-flex", alignItems:"center", gap:4, background: approvalTrend >= 0 ? "#E6F4EC" : "#FBEAE8", color: approvalTrend >= 0 ? "#1E7A50" : "#C8453A", font:"700 14px 'Hanken Grotesk'", padding:"6px 11px", borderRadius:20, marginBottom:6 }}>
                      <MS style={{ fontSize:17 }}>{approvalTrend >= 0 ? "arrow_upward" : "arrow_downward"}</MS>
                      {Math.abs(Math.round(approvalTrend))} pts
                    </span>
                  )}
                </div>
                <div style={{ font:"500 13px 'Hanken Grotesk'", color:"#8590A6", marginTop:8 }}>
                  {approvalTrend != null ? `${approvalTrend >= 0 ? "+" : ""}${Math.round(approvalTrend)} pts vs. last quarter · ` : ""}
                  based on {approvalResponses != null ? approvalResponses.toLocaleString() : "—"} resident responses
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ font:"600 12px 'Hanken Grotesk'", color:"#8590A6", marginBottom:4 }}>People's Satisfaction</div>
                <div style={{ font:"400 26px 'Newsreader'", color:"#2B5BD7" }}>
                  {approvalPct != null ? `${Math.round(approvalPct / 10)}/10` : "—"}
                </div>
                <div style={{ font:"500 12px 'Hanken Grotesk'", color:"#8590A6" }}>Composite Index</div>
              </div>
            </div>
            {approvalPct != null ? (
              <div style={{ borderTop:"1px solid #F0F2F7", marginTop:8, paddingTop:18 }}>
                <div style={{ font:"600 11px 'Hanken Grotesk'", color:"#9AA3B5", marginBottom:10 }}>SENTIMENT BREAKDOWN</div>
                <div style={{ display:"flex", height:12, borderRadius:8, overflow:"hidden", marginBottom:8 }}>
                  <div style={{ width:`${effectiveSentiment?.positive?.pct ?? 0}%`, background:"#1E8A5B" }} />
                  <div style={{ width:`${effectiveSentiment?.neutral?.pct  ?? 0}%`, background:"#C9871F" }} />
                  <div style={{ width:`${effectiveSentiment?.negative?.pct ?? 0}%`, background:"#C8453A" }} />
                </div>
                <div style={{ display:"flex", gap:16 }}>
                  {[["#1E8A5B","Positive",effectiveSentiment?.positive?.pct],["#C9871F","Neutral",effectiveSentiment?.neutral?.pct],["#C8453A","Negative",effectiveSentiment?.negative?.pct]].map(([c,l,p])=>(
                    <span key={l} style={{ display:"flex", alignItems:"center", gap:5, font:"500 11px 'Hanken Grotesk'", color:"#5A6678" }}>
                      <span style={{ width:8, height:8, borderRadius:2, background:c, display:"inline-block" }} />
                      {l} {p != null ? `${p}%` : "—"}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ height:100, display:"flex", alignItems:"center", justifyContent:"center", borderTop:"1px solid #F0F2F7", marginTop:8, paddingTop:18 }}>
                <span style={{ font:"500 13px 'Hanken Grotesk'", color:"#C0C7D4" }}>No rating data available</span>
              </div>
            )}
          </div>

          {/* Re-election Outlook */}
          <div style={{ background:"linear-gradient(165deg,#1B3C8F,#2B5BD7)", borderRadius:22, padding:"26px 28px", color:"#fff", display:"flex", flexDirection:"column", boxShadow:"0 18px 36px -22px rgba(43,91,215,.7)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ font:"600 13px 'Hanken Grotesk'", color:"rgba(255,255,255,.82)", textTransform:"uppercase", letterSpacing:".05em" }}>Chance of Re-Election</span>
              <MS style={{ fontSize:20, color:"rgba(255,255,255,.7)" }}>help</MS>
            </div>
            <div style={{ display:"flex", justifyContent:"center", margin:"6px 0 0" }}>
              <GaugeArc pct={approvalPct} />
            </div>
            <div style={{ textAlign:"center", marginTop:-10 }}>
              <div style={{ font:"400 48px 'Newsreader'", color:"#fff", lineHeight:1 }}>
                {strongProb != null ? `${strongProb}%` : "—"}
              </div>
              <div style={{ font:"600 13px 'Hanken Grotesk'", color:"rgba(255,255,255,.85)" }}>
                {strongProb != null
                  ? strongProb >= 50 ? "Likely to hold seat" : compProb >= 40 ? "Competitive race" : "At risk — action needed"
                  : "Insufficient data"}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,.14)", borderRadius:12, padding:"11px 14px", marginTop:18 }}>
              <MS style={{ fontSize:20, color: approvalTrend != null ? (approvalTrend >= 0 ? "#9FE8C2" : "#F08080") : "#9FE8C2" }}>
                {approvalTrend != null ? (approvalTrend >= 0 ? "trending_up" : "trending_down") : "trending_up"}
              </MS>
              <span style={{ font:"600 13px 'Hanken Grotesk'", color:"#fff" }}>
                {approvalTrend != null
                  ? (approvalTrend >= 0
                      ? `Approval up ${Math.abs(Math.round(approvalTrend))} pts this quarter`
                      : `Approval down ${Math.abs(Math.round(approvalTrend))} pts this quarter`)
                  : approvalPct != null
                    ? `${Math.round(approvalPct)}% approval among residents`
                    : "Momentum data unavailable"}
              </span>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:12 }}>
              <div style={{ flex:1, background:"rgba(255,255,255,.1)", borderRadius:12, padding:"12px 13px" }}>
                <div style={{ font:"400 22px 'Newsreader'", color:"#fff" }}>
                  {analytics?.events?.totalEvents != null ? `${analytics.events.totalEvents} events` : "—"}
                </div>
                <div style={{ font:"500 11px 'Hanken Grotesk'", color:"rgba(255,255,255,.78)" }}>Events Held</div>
              </div>
              <div style={{ flex:1, background:"rgba(255,255,255,.1)", borderRadius:12, padding:"12px 13px" }}>
                <div style={{ font:"400 22px 'Newsreader'", color:"#fff" }}>
                  {approvalPct != null ? `~${Math.min(100, Math.round(approvalPct * 0.9))}%` : "—"}
                </div>
                <div style={{ font:"500 11px 'Hanken Grotesk'", color:"rgba(255,255,255,.78)" }}>Projected Vote Share</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

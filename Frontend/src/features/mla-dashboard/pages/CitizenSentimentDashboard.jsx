import { useState, useEffect, useRef } from "react";
import api from "../../../shared/services/api";
import MIcon from "../../../components/MIcon";
import ExportButton from "../../../components/ExportButton";

function MS({ children, style }) {
  return <MIcon name={children} style={style} />;
}

const PERIOD_DAYS = { "3M": 90, "6M": 180, "12M": 365, "All": 730 };

const POPULARITY_CACHE_KEY = "mla_popularity_cache";
function readPopularityCache() {
  try {
    // Own cache first, then fall back to Executive Dashboard's shared insights cache
    const v = sessionStorage.getItem(POPULARITY_CACHE_KEY) || sessionStorage.getItem("mla_insights_cache");
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}

function usePopularityData(days) {
  const cached = readPopularityCache();
  const [data, setData]       = useState(cached);
  const [loading, setLoading] = useState(!cached);
  useEffect(() => {
    api.get("/api/mla/insights", { params: { days } })
      .then(r => {
        const fresh = r?.data?.data || r?.data || null;
        if (fresh) { try { sessionStorage.setItem(POPULARITY_CACHE_KEY, JSON.stringify(fresh)); } catch {} }
        setData(fresh);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);
  return { data, loading };
}

/* ── Approval Line Chart ──────────────────────────────────────── */
function InfoTip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center", padding: "0 6px", minWidth: 20, cursor: "pointer" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen(open => !open)}
      tabIndex={0}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      aria-label={text}
    >
      <span
        style={{
          marginLeft: 8,
          cursor: "help",
          color: "#2563eb",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          borderRadius: 999,
          background: "#eff6ff",
          fontSize: 12,
          fontWeight: 700,
          border: "1px solid #dbeafe",
          lineHeight: 1,
          opacity: open ? 1 : 0.55,
          transition: "opacity .12s ease",
          fontStyle: "italic",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
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
          boxShadow: "0 16px 32px rgba(15, 23, 42, 0.12)",
          font: "500 12px 'Hanken Grotesk'",
          color: "#475569",
          lineHeight: 1.4,
          textAlign: "left",
        }}>
          {text}
        </div>
      )}
    </span>
  );
}

function SourceTooltipRow({ icon, label, value, tooltip, width }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{ position: "relative", marginBottom: 18 }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen(open => !open)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7, cursor: "pointer" }}>
        <MS style={{ fontSize: 18, color: "#2B5BD7" }}>{icon}</MS>
        <span style={{ flex: 1, font: "600 13px 'Hanken Grotesk'", color: "#16233C" }}>{label}</span>
        <span style={{ font: "700 13px 'Hanken Grotesk'", color: value != null ? "#16233C" : "#C0C7D4" }}>
          {value != null ? value.toLocaleString() : "—"}
        </span>
      </div>
      <div style={{ height: 7, borderRadius: 5, background: "#EEF1F7", overflow: "hidden" }}>
        <div style={{ height: "100%", width: width || "0%", background: "#2B5BD7", borderRadius: 5, opacity: 0.55, transition: "width .4s" }} />
      </div>
      {open && tooltip && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          zIndex: 20,
          marginTop: 8,
          padding: "10px 12px",
          maxWidth: 300,
          background: "#ffffff",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          boxShadow: "0 16px 32px rgba(15, 23, 42, 0.12)",
          font: "500 12px 'Hanken Grotesk'",
          color: "#475569",
          lineHeight: 1.4,
        }}>
          {tooltip}
        </div>
      )}
    </div>
  );
}

function AgeGroupBar({ group, tooltip }) {
  const [open, setOpen] = useState(false);
  const pct = group.approvalPct;
  const color = pct != null ? (pct >= 60 ? "#2B5BD7" : pct >= 40 ? "#E3B778" : "#D86C5E") : "#EEF1F7";
  const height = pct != null ? `${pct}%` : "30%";

  return (
    <div
      style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, height: "100%", justifyContent: "flex-end", cursor: "pointer" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen(open => !open)}
    >
      <span style={{ font: "700 14px 'Hanken Grotesk'", color: pct != null ? "#16233C" : "#C0C7D4" }}>
        {pct != null ? `${pct}%` : "—"}
      </span>
      <div style={{ width: "100%", height: height, background: color, borderRadius: "8px 8px 0 0", transition: "height .4s" }} />
      <span style={{ font: "600 12px 'Hanken Grotesk'", color: "#5A6678" }}>{group.label}</span>
      {open && tooltip && (
        <div style={{
          position: "absolute",
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%) translateY(-8px)",
          zIndex: 20,
          padding: "10px 12px",
          maxWidth: 260,
          background: "#ffffff",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          boxShadow: "0 16px 32px rgba(15, 23, 42, 0.12)",
          font: "500 12px 'Hanken Grotesk'",
          color: "#475569",
          lineHeight: 1.4,
          textAlign: "center",
        }}>
          {tooltip}
        </div>
      )}
    </div>
  );
}

function ApprovalLineChart({ points }) {
  const pts = (points || []).filter(p => p.approvalPct != null);
  if (pts.length === 0) return (
    <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#F9FAFC", borderRadius: 12 }}>
      <span style={{ font: "500 13px 'Hanken Grotesk'", color: "#C0C7D4" }}>No trend data</span>
    </div>
  );

  const W = 560, H = 140, PAD = 12;
  const vals = pts.map(p => p.approvalPct);
  const minV = Math.max(0, Math.min(...vals) - 10);
  const maxV = Math.min(100, Math.max(...vals) + 10);
  const toX  = i  => PAD + (i / Math.max(pts.length - 1, 1)) * (W - PAD * 2);
  const toY  = v  => H - PAD - ((v - minV) / (maxV - minV || 1)) * (H - PAD * 2);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(p.approvalPct)}`).join(" ");
  const area = `${line} L${toX(pts.length - 1)},${H - PAD} L${toX(0)},${H - PAD} Z`;
  const markerRef = useRef(null);
  const [markerOpen, setMarkerOpen] = useState(false);
  const [markerPos, setMarkerPos] = useState(null);

  function updateMarkerPos() {
    if (!markerRef.current) return;
    const r = markerRef.current.getBoundingClientRect();
    setMarkerPos({ left: Math.round(r.left + r.width / 2), top: Math.round(r.top) });
  }

  function markerEnter() { updateMarkerPos(); setMarkerOpen(true); }
  function markerMove() { updateMarkerPos(); }
  function markerLeave() { setMarkerOpen(false); }

  return (
    <div style={{ background: "#F9FAFC", borderRadius: 12, padding: "10px 12px 4px" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 160, overflow: "visible" }}>
        <defs>
          <linearGradient id="apGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2B5BD7" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#2B5BD7" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[25, 50, 75].map(v => (
          v >= minV && v <= maxV
            ? <line key={v} x1={PAD} x2={W - PAD} y1={toY(v)} y2={toY(v)} stroke="#EAEDF4" strokeWidth="1" />
            : null
        ))}
        <path d={area} fill="url(#apGrad)" />
        <path d={line} fill="none" stroke="#2B5BD7" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={toX(i)} cy={toY(p.approvalPct)} r="3.5" fill="#fff" stroke="#2B5BD7" strokeWidth="2" />
        ))}
        {/* "Now" marker */}
        <g ref={markerRef}
           onMouseEnter={markerEnter}
           onMouseMove={markerMove}
           onMouseLeave={markerLeave}
           onFocus={markerEnter}
           onBlur={markerLeave}
           style={{ cursor: 'pointer' }}>
          <line x1={toX(pts.length - 1)} x2={toX(pts.length - 1)} y1={PAD} y2={H - PAD}
            stroke="#2B5BD7" strokeWidth="1.5" strokeDasharray="4 3" />
          <circle cx={toX(pts.length - 1)} cy={PAD} r="6" fill="#fff" stroke="#2B5BD7" strokeWidth="2" />
        </g>
      </svg>
      {markerOpen && markerPos && (
        (() => {
          const last = pts[pts.length - 1] || null;
          const month = last ? last.month : null;
          const approval = last && last.approvalPct != null ? `${last.approvalPct}%` : '—';
          const total = last && last.total != null ? last.total : 0;
          const posPct = last && last.positivePct != null ? `${last.positivePct}%` : '—';
          const neuPct = last && last.neutralPct != null ? `${last.neutralPct}%` : '—';
          const negPct = last && last.negativePct != null ? `${last.negativePct}%` : '—';
          const posCount = last && last.total ? Math.round((last.positivePct/100) * last.total) : null;
          const neuCount = last && last.total ? Math.round((last.neutralPct/100) * last.total) : null;
          const negCount = last && last.total ? Math.round((last.negativePct/100) * last.total) : null;
          const content = last ? (
            `${month}: Approval ${approval} (approval = positive + neutral ÷ total)\n` +
            `Sample: ${posCount ?? '—'} positive, ${neuCount ?? '—'} neutral, ${negCount ?? '—'} negative — total ${total}`
          ) : 'Now: most recent data point';

          return (
            <div style={{
              whiteSpace: 'pre-wrap',
              position: 'fixed',
              left: markerPos.left,
              top: markerPos.top - 8,
              transform: 'translateX(-50%) translateY(-100%)',
              zIndex: 9999,
              padding: '8px 10px',
              maxWidth: 320,
              background: '#ffffff',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              boxShadow: '0 16px 32px rgba(15,23,42,0.12)',
              font: "500 12px 'Hanken Grotesk'",
              color: '#475569',
            }}>
              {content}
            </div>
          );
        })()
      )}
      <div style={{ display: "flex", justifyContent: "space-between", padding: `0 ${PAD}px`, marginTop: 2 }}>
        {pts.map((p, i) => (
          <span key={i} style={{ font: "500 9px 'Hanken Grotesk'", color: i === pts.length - 1 ? "#2B5BD7" : "#B0B8C9", fontWeight: i === pts.length - 1 ? 700 : 500 }}>
            {p.month.split(" ")[0]}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Stacked Bar Chart (sentiment mix) ────────────────────────── */
function SentimentSegment({ height, color, label, tooltip }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{ position: "relative", width: "100%", height, background: color, cursor: "pointer" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen(open => !open)}
      tabIndex={0}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {open && tooltip && (
        <div style={{
          position: "absolute",
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%) translateY(-8px)",
          zIndex: 20,
          padding: "10px 12px",
          maxWidth: 240,
          background: "#ffffff",
          border: "1px solid #E2E8F0",
          borderRadius: 10,
          boxShadow: "0 16px 32px rgba(15, 23, 42, 0.12)",
          font: "500 12px 'Hanken Grotesk'",
          color: "#475569",
          lineHeight: 1.4,
          textAlign: "center",
          whiteSpace: "normal",
        }}>
          {tooltip}
        </div>
      )}
    </div>
  );
}

function DivergingSegment({ width, color, label, tooltip }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  function updatePos() {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ left: Math.round(r.left + r.width / 2), top: Math.round(r.top) });
  }

  function handleEnter() {
    updatePos();
    setOpen(true);
  }

  function handleMove() {
    updatePos();
  }

  function handleLeave() {
    setOpen(false);
  }

  return (
    <div
      ref={ref}
      role="button"
      aria-label={tooltip}
      style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flex: `0 0 ${width}`, minWidth: 10, padding: "0 6px", boxSizing: "border-box", background: color, height: "100%", cursor: "pointer" }}
      onMouseEnter={handleEnter}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={() => { updatePos(); setOpen(o => !o); }}
      tabIndex={0}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      <span style={{ font: "700 12px 'Hanken Grotesk'", color: "#fff", pointerEvents: "none" }}>{label}</span>
      {open && tooltip && pos && (
        <div style={{
          position: "fixed",
          left: pos.left,
          top: pos.top - 8,
          transform: "translateX(-50%) translateY(-100%)",
          zIndex: 9999,
          padding: "8px 10px",
          maxWidth: 260,
          background: "#ffffff",
          border: "1px solid #E2E8F0",
          borderRadius: 10,
          boxShadow: "0 16px 32px rgba(15,23,42,0.12)",
          font: "500 12px 'Hanken Grotesk'",
          color: "#475569",
          textAlign: "center",
          pointerEvents: "auto",
        }}>
          {tooltip}
        </div>
      )}
    </div>
  );
}

function LegendSwatch({ color, label, count, pct, tooltip }) {
  const [open, setOpen] = useState(false);
  const showPct = pct != null ? `${pct}%` : null;
  const showCount = count != null ? `${count}` : null;
  const labelText = `${label}${showCount ? ` ${showCount}` : ""}${showPct ? ` (${showPct})` : ""}`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", position: "relative" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen(o => !o)}
    >
      <span style={{ width: 11, height: 11, borderRadius: 3, background: color }} />
      <span style={{ font: "600 12px 'Hanken Grotesk'", color: "#5A6678" }}>{labelText}</span>
      {open && tooltip && (
        <div style={{
          position: "absolute",
          top: "110%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 30,
          padding: "8px 10px",
          maxWidth: 220,
          background: "#ffffff",
          border: "1px solid #E2E8F0",
          borderRadius: 10,
          boxShadow: "0 12px 24px rgba(15,23,42,0.12)",
          font: "500 12px 'Hanken Grotesk'",
          color: "#475569",
          textAlign: "center",
        }}>
          {tooltip}
        </div>
      )}
    </div>
  );
}

function SentimentMixChart({ points }) {
  const pts = (points || []).filter(p => p.total > 0);
  if (pts.length === 0) return (
    <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", background: "#F9FAFC", borderRadius: 12 }}>
      <span style={{ font: "500 13px 'Hanken Grotesk'", color: "#C0C7D4" }}>No data</span>
    </div>
  );
  return (
    <div style={{ background: "#F9FAFC", borderRadius: 12, padding: "12px 12px 6px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140 }}>
        {pts.map((p, i) => (
          <div key={i} style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", gap: 1, borderRadius: 8, overflow: "visible" }}>
            <SentimentSegment
              height={`${p.negativePct ?? 0}%`}
              color="#D86C5E"
              label="Negative"
              tooltip={`Negative feedback: ${p.negativePct ?? 0}% of responses for ${p.month}.`}
            />
            <SentimentSegment
              height={`${p.neutralPct ?? 0}%`}
              color="#E3B778"
              label="Neutral"
              tooltip={`Neutral feedback: ${p.neutralPct ?? 0}% of responses for ${p.month}.`}
            />
            <SentimentSegment
              height={`${p.positivePct ?? 0}%`}
              color="#1E8A5B"
              label="Positive"
              tooltip={`Positive feedback: ${p.positivePct ?? 0}% of responses for ${p.month}.`}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        {pts.map((p, i) => (
          <span key={i} style={{ font: "500 9px 'Hanken Grotesk'", color: i === pts.length - 1 ? "#2B5BD7" : "#B0B8C9", fontWeight: i === pts.length - 1 ? 700 : 500 }}>
            {p.month.split(" ")[0]}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function CitizenSentimentDashboard() {
  const [period, setPeriod] = useState("12M");
  const pageRef = useRef(null);
  const days = PERIOD_DAYS[period];
  const { data, loading } = usePopularityData(days);
  const pg = { background: "#F3F5FA", minHeight: "100vh", fontFamily: "'Hanken Grotesk', sans-serif" };

  const sentiment  = data?.publicSentiment  || null;
  const byGroup    = data?.approvalByGroup  || null;
  const moving     = data?.movingNumbers    || null;
  const trend      = data?.sentimentTrend   || null;
  const sources    = data?.feedbackSources  || null;

  const posPct = sentiment?.positive?.pct ?? null;
  const neuPct = sentiment?.neutral?.pct  ?? null;
  const negPct = sentiment?.negative?.pct ?? null;
  const netScore = (posPct != null && negPct != null) ? Math.round(posPct - negPct) : null;

  const trendPts  = trend?.points || [];
  const validPts  = trendPts.filter(p => p.approvalPct != null);
  const approvals = validPts.map(p => p.approvalPct);
  const curApproval  = approvals.length > 0 ? approvals[approvals.length - 1] : null;
  const moLow  = approvals.length > 0 ? Math.min(...approvals) : null;
  const moHigh = approvals.length > 0 ? Math.max(...approvals) : null;
  const prevApproval = approvals.length > 1 ? approvals[approvals.length - 2] : null;
  const approvalDelta = (curApproval != null && prevApproval != null) ? Math.round(curApproval - prevApproval) : null;

  return (
    <>
      {/* Topbar */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 34px", background: "#F3F5FA", position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid #E5E9F1", gap: 16, flexWrap: "wrap", minHeight: 72 }}>
        <div style={{ flex: 1, minWidth: 0, maxWidth: "60%" }}>
          <div style={{ font: "500 12px 'Hanken Grotesk','Noto Sans Kannada',sans-serif", color: "#8590A6", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>How Residents feel about your work</div>
          <h1 style={{ fontFamily: "'Newsreader','Noto Sans Kannada',serif", fontSize: "clamp(16px,2.2vw,26px)", fontWeight: 400, color: "#16233C", margin: 0, letterSpacing: "-.01em", lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Popularity</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#fff", border: "1px solid #E1E6F0", borderRadius: 13, padding: 5 }}>
            {["3M", "6M", "12M", "All"].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ font: `${period === p ? "700" : "600"} 13px 'Hanken Grotesk'`, color: period === p ? "#fff" : "#7A839A", background: period === p ? "#2B5BD7" : "transparent", border: "none", borderRadius: 9, padding: "8px 14px", cursor: "pointer" }}>
                {p}
              </button>
            ))}
          </div>
          <ExportButton
            filename={`citizen-sentiment-${period}`}
            pdfRef={pageRef}
            data={[
              { metric: 'Approval Rating',  value: curApproval != null ? `${curApproval}%` : '—' },
              { metric: 'Period Low',       value: moLow  != null ? `${moLow}%`  : '—' },
              { metric: 'Period High',      value: moHigh != null ? `${moHigh}%` : '—' },
              { metric: 'Net Score',        value: netScore != null ? String(netScore) : '—' },
              { metric: 'Positive',         value: posPct != null ? `${posPct}%` : '—' },
              { metric: 'Neutral',          value: neuPct != null ? `${neuPct}%` : '—' },
              { metric: 'Negative',         value: negPct != null ? `${negPct}%` : '—' },
            ]}
            columns={[
              { key: 'metric', label: 'Metric' },
              { key: 'value',  label: 'Value' },
            ]}
          />
        </div>
      </header>

      <div ref={pageRef} style={{ ...pg, padding: "28px 34px 40px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Row 1: Approval over time + Net sentiment score */}
        <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 20 }}>

          {/* Approval over time */}
          <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: "26px 28px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <div style={{ font: "700 16px 'Hanken Grotesk'", color: "#16233C" }}>Overall Approval Rating</div>
              <InfoTip text="Latest approval % from citizen sentiment trend data." />
            </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 13 }}>
                  <span style={{ font: "400 52px 'Newsreader'", color: "#16233C", lineHeight: .9, letterSpacing: "-.02em" }}>
                    {curApproval != null ? `${curApproval}%` : "—"}
                  </span>
                  {approvalDelta != null && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: approvalDelta >= 0 ? "#E6F4EC" : "#FBEAE8", color: approvalDelta >= 0 ? "#1E7A50" : "#C8453A", font: "700 14px 'Hanken Grotesk'", padding: "6px 11px", borderRadius: 20, marginBottom: 5 }}>
                      <MS style={{ fontSize: 17 }}>{approvalDelta >= 0 ? "arrow_upward" : "arrow_downward"}</MS>
                      {approvalDelta >= 0 ? "up" : "down"} {Math.abs(approvalDelta)} points
                    </span>
                  )}
                  {approvalDelta == null && curApproval != null && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#F0F2F7", color: "#8590A6", font: "700 14px 'Hanken Grotesk'", padding: "6px 11px", borderRadius: 20, marginBottom: 5 }}>
                      not enough data yet
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 18 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6" }}>Lowest point</span>
                    <InfoTip text={`The lowest approval rating recorded during the last ${period}. Approval rating comes from citizen sentiment (positive feedback share) over time.`} />
                  </div>
                  <div style={{ font: "400 20px 'Newsreader'", color: "#16233C" }}>{moLow != null ? `${moLow}%` : "—"}</div>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6" }}>Highest point</span>
                    <InfoTip text={`The highest approval rating recorded during the last ${period}. Approval rating comes from citizen sentiment (positive feedback share) over time.`} />
                  </div>
                  <div style={{ font: "400 20px 'Newsreader'", color: "#2B5BD7" }}>{moHigh != null ? `${moHigh}%` : "—"}</div>
                </div>
              </div>
            </div>
            <ApprovalLineChart points={trendPts} />
          </div>

          {/* Net sentiment score */}
          <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: "26px 28px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div style={{ font: "700 16px 'Hanken Grotesk'", color: "#16233C" }}>Citizen Mood Score</div>
              <InfoTip text="How this number is worked out: the share of feedback that's positive, minus the share that's negative. A higher number means more people are happy; a lower (or negative) number means more people are unhappy." />
            </div>
            <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginBottom: 20 }}>Happy feedback minus unhappy feedback</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 6 }}>
              <span style={{ font: "400 56px 'Newsreader'", color: netScore != null ? (netScore >= 0 ? "#1E8A5B" : "#C8453A") : "#C0C7D4", lineHeight: .85 }}>
                {netScore != null ? `${netScore > 0 ? "+" : ""}${netScore}` : "—"}
              </span>
            </div>
            <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginBottom: 24 }}>
              {sentiment?.hasData
                ? netScore >= 0 ? "More citizens are happy than unhappy" : "More citizens are unhappy than happy"
                : "Not enough feedback yet to tell"}
            </div>
            {/* Diverging bar: positive | neutral | negative (interactive) */}
            <div style={{ display: "flex", height: 34, borderRadius: 9, overflow: "visible", marginBottom: 14 }}>
              <DivergingSegment
                width={`${posPct ?? 0}%`}
                color="#1E8A5B"
                label={posPct != null && posPct > 10 ? `${posPct}%` : ""}
                tooltip={`Positive: ${sentiment?.positive?.count ?? 0} / ${sentiment?.total ?? 0} = ${posPct ?? 0}% — share of responses classified as positive over the last ${days} days. (Positive if sentimentScore > 0.08; counts include reports, comments, polls and surveys.)`}
              />
              <DivergingSegment
                width={`${neuPct ?? 0}%`}
                color="#E3B778"
                label={neuPct != null && neuPct > 10 ? `${neuPct}%` : ""}
                tooltip={`Neutral: ${sentiment?.neutral?.count ?? 0} / ${sentiment?.total ?? 0} = ${neuPct ?? 0}% — share of responses classified as neutral over the last ${days} days.`}
              />
              <DivergingSegment
                width={`${negPct ?? 0}%`}
                color="#D86C5E"
                label={negPct != null && negPct > 10 ? `${negPct}%` : ""}
                tooltip={`Negative: ${sentiment?.negative?.count ?? 0} / ${sentiment?.total ?? 0} = ${negPct ?? 0}% — share of responses classified as negative over the last ${days} days. (Negative if sentimentScore < -0.08)`}
              />
            </div>
            <div style={{ display: "flex", gap: 18, marginTop: "auto" }}>
              {[["#1E8A5B", "Positive", posPct], ["#E3B778", "Neutral", neuPct], ["#D86C5E", "Negative", negPct]].map(([c, l, v]) => (
                <LegendSwatch
                  key={l}
                  color={c}
                  label={l}
                  count={sentiment && sentiment[l.toLowerCase()] ? sentiment[l.toLowerCase()].count : null}
                  pct={sentiment && sentiment[l.toLowerCase()] ? sentiment[l.toLowerCase()].pct : v}
                  tooltip={`${l}: ${sentiment && sentiment[l.toLowerCase()] ? `${sentiment[l.toLowerCase()].count} / ${sentiment.total} = ${sentiment[l.toLowerCase()].pct}%` : `${v ?? 0}%`} (computed over last ${days} days).`} />
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Sentiment mix over time + Where feedback comes from */}
        <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 20 }}>

          {/* Sentiment mix over time */}
          <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: "26px 28px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ font: "700 16px 'Hanken Grotesk'", color: "#16233C" }}>How Citizens Feel Over Time</div>
                  <InfoTip text="Shows the mix of happy, neutral, and unhappy feedback from citizens, month by month." />
                </div>
                <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginTop: 2 }}>Happy, neutral, and unhappy feedback, last {period}</div>
              </div>
              <div style={{ display: "flex", gap: 14 }}>
                {[["#1E8A5B", "Positive"], ["#E3B778", "Neutral"], ["#D86C5E", "Negative"]].map(([c, l]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: c }} />
                    <span style={{ font: "600 12px 'Hanken Grotesk'", color: "#5A6678" }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <SentimentMixChart points={trendPts} />
          </div>

          {/* Where feedback comes from */}
          <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: 24, boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ font: "700 16px 'Hanken Grotesk'", color: "#16233C", marginBottom: 4 }}>Where Feedback Comes From</div>
              <InfoTip text="Where citizens are sending their feedback from: app reports, comments, and surveys." />
            </div>
            <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginBottom: 20 }}>
              {sources?.total != null ? `${sources.total.toLocaleString()} responses this period` : "No responses yet this period"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { icon: "report",      label: "In-app reports",  val: sources?.reports,  tooltip: "Counts citizen reports submitted through the mobile app or website." },
                { icon: "forum",       label: "Comments",        val: sources?.comments, tooltip: "Counts feedback left as comments on posts and updates." },
                // { icon: "how_to_vote", label: "Poll responses",  val: sources?.polls,    tooltip: "Counts poll responses submitted by residents in citizen engagement exercises." },
                { icon: "assignment",  label: "Surveys",         val: sources?.surveys,  tooltip: "Counts structured survey responses collected from residents." },
              ].map(s => {
                const max   = Math.max(sources?.reports || 0, sources?.comments || 0, sources?.polls || 0, sources?.surveys || 0, 1);
                const width = s.val != null ? `${Math.round((s.val / max) * 100)}%` : "0%";
                return (
                  <SourceTooltipRow
                    key={s.label}
                    icon={s.icon}
                    label={s.label}
                    value={s.val}
                    tooltip={s.tooltip}
                    width={width}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 3: Approval by age group + What's moving your numbers */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* Approval by age group */}
          <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: 24, boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ font: "700 16px 'Hanken Grotesk'", color: "#16233C", marginBottom: 4 }}>Approval by Age Group</div>
              <InfoTip text="How approval differs across citizen age groups." />
            </div>
            <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginBottom: 22 }}>Where you connect — and where to grow</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 18, height: 180, padding: "0 6px" }}>
              {(byGroup?.groups || [{ label: "18–29" }, { label: "30–44" }, { label: "45–59" }, { label: "60+" }]).map((g, i) => {
                const tooltip = g.approvalPct != null
                  ? `Based on ${g.total ?? 'survey'} responses from ${g.label} citizens.`
                  : `Approval data not available for ${g.label}.`;
                return (
                  <AgeGroupBar key={g.label} group={g} tooltip={tooltip} />
                );
              })}
            </div>
            {!byGroup?.hasData && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18, paddingTop: 16, borderTop: "1px solid #F0F2F7" }}>
                <MS style={{ fontSize: 18, color: "#C0C7D4" }}>priority_high</MS>
                <span style={{ font: "500 12px 'Hanken Grotesk'", color: "#C0C7D4" }}>Age data unavailable — citizens need to fill their profiles</span>
              </div>
            )}
          </div>

          {/* What's moving your numbers */}
          <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: 24, boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ font: "700 16px 'Hanken Grotesk'", color: "#16233C", marginBottom: 4 }}>Top Issues Affecting Public Opinion</div>
              <InfoTip text="Most influential issues driving sentiment during this period." />
            </div>
            <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginBottom: 18 }}>Issues with the biggest impact this period</div>
            {moving?.hasData ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {moving.drivers.map((d, i) => {
                  const pos = d.impact >= 0;
                  const tooltip = (() => {
                    const curTotal = d.total ?? 0;
                    const curResolved = d.resolved ?? 0;
                    const prevTotal = d.prev_total ?? 0;
                    const prevResolved = d.prev_resolved ?? 0;
                    const curRate = curTotal ? Math.round((curResolved / curTotal) * 100) : 0;
                    const prevRate = prevTotal ? Math.round((prevResolved / prevTotal) * 100) : 0;
                    return `${d.label}: ${curResolved} of ${curTotal} reports resolved this period (${curRate}%), compared to ${prevResolved} of ${prevTotal} last period (${prevRate}%). ${pos ? "Getting better at resolving this is helping public opinion." : "Falling behind on this is hurting public opinion."}`;
                  })();

                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 11, background: pos ? "#E6F4EC" : "#FBEAE8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <MS style={{ fontSize: 20, color: pos ? "#1E8A5B" : "#C8453A" }}>{d.icon}</MS>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ font: "700 13px 'Hanken Grotesk'", color: "#16233C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.label}</div>
                          <InfoTip text={tooltip} />
                        </div>
                        <div style={{ font: "500 11px 'Hanken Grotesk'", color: "#8590A6" }}>{d.sub}</div>
                      </div>
                      <span style={{ font: "700 14px 'Hanken Grotesk'", color: pos ? "#1E8A5B" : "#C8453A", flexShrink: 0 }}>
                        {pos ? "+" : ""}{d.impact}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 160 }}>
                <span style={{ font: "500 13px 'Hanken Grotesk'", color: "#C0C7D4" }}>No data</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}

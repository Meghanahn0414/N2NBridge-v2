import { useState, useEffect } from "react";
import api from "../../../shared/services/api";

function MS({ children, style }) {
  return <span className="material-symbols-rounded" style={{ fontSize: 21, ...style }}>{children}</span>;
}

const PERIOD_DAYS = { "3M": 90, "6M": 180, "12M": 365, "All": 730 };

function usePopularityData(days) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    api.get("/api/mla/insights", { params: { days } })
      .then(r => setData(r?.data?.data || r?.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [days]);
  return { data, loading };
}

/* ── Approval Line Chart ──────────────────────────────────────── */
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
        <line x1={toX(pts.length - 1)} x2={toX(pts.length - 1)} y1={PAD} y2={H - PAD}
          stroke="#2B5BD7" strokeWidth="1.5" strokeDasharray="4 3" />
      </svg>
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
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", gap: 1 }}>
            <div style={{ background: "#D86C5E", borderRadius: i === 0 ? "4px 4px 0 0" : "2px 2px 0 0", height: `${p.negativePct ?? 0}%`, minHeight: (p.negativePct ?? 0) > 0 ? 3 : 0 }} />
            <div style={{ background: "#E3B778", height: `${p.neutralPct ?? 0}%`,  minHeight: (p.neutralPct  ?? 0) > 0 ? 3 : 0 }} />
            <div style={{ background: "#1E8A5B", height: `${p.positivePct ?? 0}%`, minHeight: (p.positivePct ?? 0) > 0 ? 3 : 0 }} />
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
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 34px", background: "#F3F5FA", position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid #E5E9F1" }}>
        <div>
          <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#8590A6", marginBottom: 3 }}>How residents feel about your work</div>
          <h1 style={{ font: "400 30px 'Newsreader'", color: "#16233C", margin: 0, letterSpacing: "-.01em" }}>Popularity</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#fff", border: "1px solid #E1E6F0", borderRadius: 13, padding: 5 }}>
          {["3M", "6M", "12M", "All"].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ font: `${period === p ? "700" : "600"} 13px 'Hanken Grotesk'`, color: period === p ? "#fff" : "#7A839A", background: period === p ? "#2B5BD7" : "transparent", border: "none", borderRadius: 9, padding: "8px 14px", cursor: "pointer" }}>
              {p}
            </button>
          ))}
        </div>
      </header>

      <div style={{ ...pg, padding: "28px 34px 40px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Row 1: Approval over time + Net sentiment score */}
        <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 20 }}>

          {/* Approval over time */}
          <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: "26px 28px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ font: "600 13px 'Hanken Grotesk'", color: "#8590A6", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>Approval over time</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 13 }}>
                  <span style={{ font: "400 52px 'Newsreader'", color: "#16233C", lineHeight: .9, letterSpacing: "-.02em" }}>
                    {curApproval != null ? `${curApproval}%` : "—"}
                  </span>
                  {approvalDelta != null && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: approvalDelta >= 0 ? "#E6F4EC" : "#FBEAE8", color: approvalDelta >= 0 ? "#1E7A50" : "#C8453A", font: "700 14px 'Hanken Grotesk'", padding: "6px 11px", borderRadius: 20, marginBottom: 5 }}>
                      <MS style={{ fontSize: 17 }}>{approvalDelta >= 0 ? "arrow_upward" : "arrow_downward"}</MS>
                      {Math.abs(approvalDelta)} pts
                    </span>
                  )}
                  {approvalDelta == null && curApproval != null && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#E6F4EC", color: "#1E7A50", font: "700 14px 'Hanken Grotesk'", padding: "6px 11px", borderRadius: 20, marginBottom: 5 }}>
                      <MS style={{ fontSize: 17 }}>arrow_upward</MS>— pts
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 18 }}>
                <div>
                  <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6" }}>{period} low</div>
                  <div style={{ font: "400 20px 'Newsreader'", color: "#16233C" }}>{moLow != null ? `${moLow}%` : "—"}</div>
                </div>
                <div>
                  <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6" }}>{period} high</div>
                  <div style={{ font: "400 20px 'Newsreader'", color: "#2B5BD7" }}>{moHigh != null ? `${moHigh}%` : "—"}</div>
                </div>
              </div>
            </div>
            <ApprovalLineChart points={trendPts} />
          </div>

          {/* Net sentiment score */}
          <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: "26px 28px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)", display: "flex", flexDirection: "column" }}>
            <div style={{ font: "700 16px 'Hanken Grotesk'", color: "#16233C", marginBottom: 4 }}>Net sentiment score</div>
            <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginBottom: 20 }}>Positive minus negative</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 6 }}>
              <span style={{ font: "400 56px 'Newsreader'", color: netScore != null ? (netScore >= 0 ? "#1E8A5B" : "#C8453A") : "#C0C7D4", lineHeight: .85 }}>
                {netScore != null ? `${netScore > 0 ? "+" : ""}${netScore}` : "—"}
              </span>
            </div>
            <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginBottom: 24 }}>
              {sentiment?.hasData
                ? netScore >= 0 ? "More positive than negative" : "More negative than positive"
                : "No data yet"}
            </div>
            {/* Diverging bar: positive | neutral | negative */}
            <div style={{ display: "flex", height: 34, borderRadius: 9, overflow: "hidden", marginBottom: 14 }}>
              <div style={{ width: `${posPct ?? 0}%`, background: "#1E8A5B", display: "flex", alignItems: "center", paddingLeft: 10, font: "700 12px 'Hanken Grotesk'", color: "#fff" }}>
                {posPct != null && posPct > 10 ? `${posPct}%` : ""}
              </div>
              <div style={{ width: `${neuPct ?? 0}%`, background: "#E3B778", display: "flex", alignItems: "center", justifyContent: "center", font: "700 12px 'Hanken Grotesk'", color: "#fff" }}>
                {neuPct != null && neuPct > 10 ? `${neuPct}%` : ""}
              </div>
              <div style={{ flex: 1, background: "#D86C5E", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10, font: "700 12px 'Hanken Grotesk'", color: "#fff" }}>
                {negPct != null && negPct > 10 ? `${negPct}%` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 18, marginTop: "auto" }}>
              {[["#1E8A5B", "Positive", posPct], ["#E3B778", "Neutral", neuPct], ["#D86C5E", "Negative", negPct]].map(([c, l, v]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 11, height: 11, borderRadius: 3, background: c }} />
                  <span style={{ font: "600 12px 'Hanken Grotesk'", color: "#5A6678" }}>{l} {v != null ? `${v}%` : ""}</span>
                </div>
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
                <div style={{ font: "700 16px 'Hanken Grotesk'", color: "#16233C" }}>Sentiment mix over time</div>
                <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginTop: 2 }}>Share of feedback by tone, {period}</div>
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
            <div style={{ font: "700 16px 'Hanken Grotesk'", color: "#16233C", marginBottom: 4 }}>Where feedback comes from</div>
            <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginBottom: 20 }}>
              {sources?.total != null ? `${sources.total.toLocaleString()} signals this period` : "— signals this period"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { icon: "report",      label: "In-app reports",  val: sources?.reports  },
                { icon: "forum",       label: "Comments",        val: sources?.comments },
                { icon: "how_to_vote", label: "Poll responses",  val: sources?.polls    },
                { icon: "assignment",  label: "Surveys",         val: sources?.surveys  },
              ].map(s => {
                const max   = Math.max(sources?.reports || 0, sources?.comments || 0, sources?.polls || 0, sources?.surveys || 0, 1);
                const width = s.val != null ? `${Math.round((s.val / max) * 100)}%` : "0%";
                return (
                  <div key={s.label}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}>
                      <MS style={{ fontSize: 18, color: "#2B5BD7" }}>{s.icon}</MS>
                      <span style={{ flex: 1, font: "600 13px 'Hanken Grotesk'", color: "#16233C" }}>{s.label}</span>
                      <span style={{ font: "700 13px 'Hanken Grotesk'", color: s.val != null ? "#16233C" : "#C0C7D4" }}>
                        {s.val != null ? s.val.toLocaleString() : "—"}
                      </span>
                    </div>
                    <div style={{ height: 7, borderRadius: 5, background: "#EEF1F7", overflow: "hidden" }}>
                      <div style={{ height: "100%", width, background: "#2B5BD7", borderRadius: 5, opacity: 0.55, transition: "width .4s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 3: Approval by age group + What's moving your numbers */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* Approval by age group */}
          <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: 24, boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
            <div style={{ font: "700 16px 'Hanken Grotesk'", color: "#16233C", marginBottom: 4 }}>Approval by age group</div>
            <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginBottom: 22 }}>Where you connect — and where to grow</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 18, height: 180, padding: "0 6px" }}>
              {(byGroup?.groups || [{ label: "18–29" }, { label: "30–44" }, { label: "45–59" }, { label: "60+" }]).map((g, i) => {
                const pct    = g.approvalPct;
                const colors = ["#E3B778", "#2B5BD7", "#2B5BD7", "#5C84E0"];
                const color  = pct != null ? (pct >= 60 ? "#2B5BD7" : pct >= 40 ? "#E3B778" : "#D86C5E") : "#EEF1F7";
                const h      = pct != null ? `${pct}%` : "30%";
                return (
                  <div key={g.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, height: "100%", justifyContent: "flex-end" }}>
                    <span style={{ font: "700 14px 'Hanken Grotesk'", color: pct != null ? "#16233C" : "#C0C7D4" }}>
                      {pct != null ? `${pct}%` : "—"}
                    </span>
                    <div style={{ width: "100%", height: h, background: color, borderRadius: "8px 8px 0 0", transition: "height .4s" }} />
                    <span style={{ font: "600 12px 'Hanken Grotesk'", color: "#5A6678" }}>{g.label}</span>
                  </div>
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
            <div style={{ font: "700 16px 'Hanken Grotesk'", color: "#16233C", marginBottom: 4 }}>What's moving your numbers</div>
            <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginBottom: 18 }}>Issues with the biggest impact this period</div>
            {moving?.hasData ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {moving.drivers.map((d, i) => {
                  const pos = d.impact >= 0;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 11, background: pos ? "#E6F4EC" : "#FBEAE8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <MS style={{ fontSize: 20, color: pos ? "#1E8A5B" : "#C8453A" }}>{d.icon}</MS>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ font: "700 13px 'Hanken Grotesk'", color: "#16233C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.label}</div>
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
